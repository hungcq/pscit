package services

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/hungcq/pscit/backend/models"
	"gorm.io/gorm"
)

type ReservationService struct {
	db *gorm.DB
}

func NewReservationService(db *gorm.DB) *ReservationService {
	return &ReservationService{db: db}
}

// CreateReservation creates a new reservation
func (s *ReservationService) CreateReservation(userID string, bookCopyID string, startDate time.Time, endDate time.Time, suggestedTimeslots []string) (*models.Reservation, error) {
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

		// Validate that suggested timeslots don't overlap
		for i := 0; i < len(suggestedTimeslots); i++ {
			slot1, err := time.Parse(time.RFC3339, suggestedTimeslots[i])
			if err != nil {
				return errors.New("invalid timeslot format")
			}
			// Check against all other slots
			for j := i + 1; j < len(suggestedTimeslots); j++ {
				slot2, err := time.Parse(time.RFC3339, suggestedTimeslots[j])
				if err != nil {
					return errors.New("invalid timeslot format")
				}
				// If slots are within 30 minutes of each other, they overlap
				if slot1.Sub(slot2).Abs() < 30*time.Minute {
					return errors.New("suggested timeslots cannot overlap")
				}
			}
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
			UserID:             userUUID,
			BookCopyID:         bookCopyUUID,
			StartDate:          startDate,
			EndDate:            endDate,
			PickupSlot:         nil, // Will be set when approved
			SuggestedTimeslots: suggestedTimeslots,
			Status:             models.ReservationStatusPending,
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

	// Load related data
	if err := s.db.Preload("User").Preload("BookCopy.Book").First(&reservation, reservation.ID).Error; err != nil {
		return nil, err
	}

	return &reservation, nil
}

// GetReservations gets all reservations with pagination
func (s *ReservationService) GetReservations(page, limit int) ([]models.Reservation, int64, error) {
	var reservations []models.Reservation
	var total int64

	offset := (page - 1) * limit

	// Get total count
	if err := s.db.Model(&models.Reservation{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated reservations with preloaded relations
	if err := s.db.Preload("BookCopy.Book").Preload("User").
		Offset(offset).Limit(limit).
		Order("created_at DESC").
		Find(&reservations).Error; err != nil {
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
func (s *ReservationService) UpdateReservationStatus(id string, status models.ReservationStatus, pickupSlot time.Time) (*models.Reservation, error) {
	var reservation models.Reservation

	err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.First(&reservation, "id = ?", id).Error; err != nil {
			return err
		}

		// If status is approved, require a pickup slot
		if status == models.ReservationStatusApproved && pickupSlot.IsZero() {
			return errors.New("pickup slot is required when approving a reservation")
		}

		// Update reservation
		updates := map[string]interface{}{
			"status": status,
		}

		if status == models.ReservationStatusApproved {
			updates["pickup_slot"] = pickupSlot
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
	if err := s.db.Preload("User").Preload("BookCopy.Book").First(&reservation, reservation.ID).Error; err != nil {
		return nil, err
	}

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
