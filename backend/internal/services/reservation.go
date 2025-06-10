package services

import (
	"errors"
	"log"
	"strings"
	"time"

	"github.com/hungcq/pscit/backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ReservationService struct {
	db           *gorm.DB
	emailService *EmailService
}

func NewReservationService(db *gorm.DB, emailService *EmailService) *ReservationService {
	return &ReservationService{
		db:           db,
		emailService: emailService,
	}
}

// CreateReservation creates a new reservation
func (s *ReservationService) CreateReservation(
	userID string, bookCopyID string, startDate time.Time, endDate time.Time, suggestedPickTimes []string, suggestedReturnTimes []string,
) (*models.Reservation, error) {
	var reservation models.Reservation

	err := s.db.Transaction(func(tx *gorm.DB) error {
		// Check if book copy exists and is available
		var bookCopy models.BookCopy
		if err := tx.First(&bookCopy, "id = ?", bookCopyID).Error; err != nil {
			return err
		}

		if bookCopy.Status != models.BookCopyStatusAvailable {
			return errors.New("book copy is not available")
		}

		// Check if user has any active reservations for this book copy
		var existingReservation models.Reservation
		if err := tx.Where("book_copy_id = ? AND user_id = ? AND status = ?", bookCopyID, userID, models.ReservationStatusPending).First(&existingReservation).Error; err == nil {
			return errors.New("user already has a pending reservation for this book")
		}

		if err := checkTimeOverlap(suggestedPickTimes); err != nil {
			return err
		}
		if err := checkTimeOverlap(suggestedReturnTimes); err != nil {
			return err
		}

		// Parse UUIDs
		userUUID, err := uuid.Parse(userID)
		if err != nil {
			return errors.New("invalid user ID")
		}

		bookCopyUUID, err := uuid.Parse(bookCopyID)
		if err != nil {
			return errors.New("invalid book copy ID")
		}

		// Create reservation
		reservation = models.Reservation{
			UserID:                   userUUID,
			BookCopyID:               bookCopyUUID,
			StartDate:                startDate,
			EndDate:                  endDate,
			PickupTime:               nil, // Will be set when approved
			ReturnTime:               nil, // Will be set when approved
			SuggestedPickupTimeslots: suggestedPickTimes,
			SuggestedReturnTimeslots: suggestedReturnTimes,
			Status:                   models.ReservationStatusPending,
		}

		if err := tx.Create(&reservation).Error; err != nil {
			return err
		}

		// Update book copy status
		if err := tx.Model(&bookCopy).Update("status", models.BookCopyStatusReserved).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	// Load related data with preloaded book and authors
	if err := s.db.Preload("User").Preload("BookCopy.Book.Authors").First(&reservation, reservation.ID).Error; err != nil {
		return nil, err
	}

	return &reservation, nil
}

func checkTimeOverlap(times []string) error {
	// Validate that suggested timeslots don't overlap
	for i := 0; i < len(times); i++ {
		slot1, err := time.Parse(time.RFC3339, times[i])
		if err != nil {
			return errors.New("invalid timeslot format")
		}
		// Check against all other slots
		for j := i + 1; j < len(times); j++ {
			slot2, err := time.Parse(time.RFC3339, times[j])
			if err != nil {
				return errors.New("invalid timeslot format")
			}
			// If slots are within 30 minutes of each other, they overlap
			if slot1.Sub(slot2).Abs() < 30*time.Minute {
				return errors.New("suggested timeslots cannot overlap")
			}
		}
	}
	return nil
}

// GetReservations retrieves all reservations with pagination and filtering
func (s *ReservationService) GetReservations(page, limit int, filters models.ReservationFilters) ([]models.Reservation, int64, error) {
	var reservations []models.Reservation
	var total int64

	query := s.db.Model(&models.Reservation{}).
		Preload("User").
		Preload("BookCopy").
		Preload("BookCopy.Book")

	if filters.Email != "" {
		query = query.Joins("JOIN users ON users.id = reservations.user_id").
			Where("LOWER(users.email) LIKE ?", "%"+strings.ToLower(filters.Email)+"%")
	}

	if filters.Status != "" {
		query = query.Where("reservations.status = ?", filters.Status)
	}

	if filters.BookTitle != "" {
		query = query.Joins("JOIN book_copies ON book_copies.id = reservations.book_copy_id").
			Joins("JOIN books ON books.id = book_copies.book_id").
			Where("LOWER(books.title) LIKE ?", "%"+strings.ToLower(filters.BookTitle)+"%")
	}

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * limit
	if err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&reservations).Error; err != nil {
		return nil, 0, err
	}

	return reservations, total, nil
}

// GetUserReservations gets reservations for a specific user with pagination
func (s *ReservationService) GetUserReservations(userID string, page, limit int) ([]models.Reservation, int64, error) {
	// Parse user ID
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return nil, 0, errors.New("invalid user ID")
	}

	var reservations []models.Reservation
	var total int64

	offset := (page - 1) * limit

	// Get total count
	if err := s.db.Model(&models.Reservation{}).Where("user_id = ?", userUUID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated reservations with preloaded relations
	if err := s.db.Preload("BookCopy.Book").Preload("User").
		Where("user_id = ?", userUUID).
		Offset(offset).Limit(limit).
		Order("created_at DESC").
		Find(&reservations).Error; err != nil {
		return nil, 0, err
	}

	return reservations, total, nil
}

// UpdateReservationStatus updates a reservation's status
func (s *ReservationService) UpdateReservationStatus(
	id string, status models.ReservationStatus, pickupTime time.Time, returnTime time.Time,
) (*models.Reservation, error) {
	var reservation models.Reservation

	err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.First(&reservation, "id = ?", id).Error; err != nil {
			return err
		}

		// If status is approved, require a pickup slot
		if status == models.ReservationStatusApproved && (pickupTime.IsZero() || returnTime.IsZero()) {
			return errors.New("pickup slot is required when approving a reservation")
		}

		// Update reservation
		updates := map[string]interface{}{
			"status": status,
		}

		if status == models.ReservationStatusApproved {
			updates["pickup_time"] = pickupTime
			updates["return_time"] = returnTime
		}

		if err := tx.Model(&reservation).Updates(updates).Error; err != nil {
			return err
		}

		// Update book copy status
		var bookCopy models.BookCopy
		if err := tx.First(&bookCopy, "id = ?", reservation.BookCopyID).Error; err != nil {
			return err
		}

		bookCopyStatus := models.BookCopyStatusAvailable
		switch status {
		case models.ReservationStatusApproved:
			bookCopyStatus = models.BookCopyStatusBorrowed
		case models.ReservationStatusPending:
			bookCopyStatus = models.BookCopyStatusReserved
		case models.ReservationStatusRejected, models.ReservationStatusReturned:
			bookCopyStatus = models.BookCopyStatusAvailable
		}

		if err := tx.Model(&bookCopy).Update("status", bookCopyStatus).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	// Load related data
	if err := s.db.Preload("User").Preload("BookCopy.Book.Authors").First(&reservation, reservation.ID).Error; err != nil {
		return nil, err
	}

	// Send email notification for status updates
	go func() {
		switch status {
		case models.ReservationStatusApproved,
			models.ReservationStatusRejected,
			models.ReservationStatusReturned:
			if err = s.emailService.SendReservationStatusUpdate(&reservation); err != nil {
				log.Printf("Send email notification error: %v", err)
			}
		}
	}()

	return &reservation, nil
}

// GetReservation gets a single reservation
func (s *ReservationService) GetReservation(id string) (*models.Reservation, error) {
	// Parse reservation ID
	reservationUUID, err := uuid.Parse(id)
	if err != nil {
		return nil, errors.New("invalid reservation ID")
	}

	var reservation models.Reservation
	if err := s.db.Preload("BookCopy.Book").Preload("User").First(&reservation, "id = ?", reservationUUID).Error; err != nil {
		return nil, err
	}
	return &reservation, nil
}

func (s *ReservationService) CheckExpiredReservations() error {
	now := time.Now()
	var reservations []models.Reservation

	// Find expired reservations
	if err := s.db.Where("status = ? AND expires_at < ?", "pending", now).Find(&reservations).Error; err != nil {
		return err
	}

	// Update expired reservations
	for _, reservation := range reservations {
		reservation.Status = "expired"
		if err := s.db.Save(&reservation).Error; err != nil {
			return err
		}

		// Make book available again
		var bookCopy models.BookCopy
		if err := s.db.First(&bookCopy, "id = ?", reservation.BookCopyID).Error; err != nil {
			return err
		}
		bookCopy.Status = models.BookCopyStatusAvailable
		if err := s.db.Save(&bookCopy).Error; err != nil {
			return err
		}
	}

	return nil
}
