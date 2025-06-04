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
func (s *ReservationService) CreateReservation(userID string, req models.CreateReservationRequest) (*models.Reservation, error) {
	// Parse user ID
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	// Parse book copy ID
	bookCopyUUID, err := uuid.Parse(req.BookCopyID)
	if err != nil {
		return nil, errors.New("invalid book copy ID")
	}

	// Parse dates
	startDate, err := time.Parse(time.RFC3339, req.StartDate)
	if err != nil {
		return nil, errors.New("invalid start date format")
	}

	endDate, err := time.Parse(time.RFC3339, req.EndDate)
	if err != nil {
		return nil, errors.New("invalid end date format")
	}

	pickupSlot, err := time.Parse(time.RFC3339, req.PickupSlot)
	if err != nil {
		return nil, errors.New("invalid pickup slot format")
	}

	// Set seconds to 0 for pickup slot
	pickupSlot = time.Date(
		pickupSlot.Year(),
		pickupSlot.Month(),
		pickupSlot.Day(),
		pickupSlot.Hour(),
		pickupSlot.Minute(),
		0, // Set seconds to 0
		0, // Set nanoseconds to 0
		pickupSlot.Location(),
	)

	// Validate start date is not in the past
	now := time.Now()
	if startDate.Before(now) {
		return nil, errors.New("start date cannot be in the past")
	}

	// Validate pickup slot is in 30-minute blocks
	if pickupSlot.Minute() != 0 && pickupSlot.Minute() != 30 {
		return nil, errors.New("pickup slot must be in 30-minute blocks")
	}

	// Check if book copy exists and is available
	var bookCopy models.BookCopy
	if err := s.db.First(&bookCopy, "id = ?", bookCopyUUID).Error; err != nil {
		return nil, errors.New("book copy not found")
	}

	if !bookCopy.Available {
		return nil, errors.New("book copy is not available")
	}

	// Check for overlapping reservations
	var overlappingReservations int64
	s.db.Model(&models.Reservation{}).
		Where("book_copy_id = ? AND status IN ? AND ((start_date <= ? AND end_date >= ?) OR (start_date <= ? AND end_date >= ?))",
			bookCopyUUID, []models.ReservationStatus{models.ReservationStatusPending, models.ReservationStatusApproved},
			endDate, startDate, startDate, endDate).
		Count(&overlappingReservations)

	if overlappingReservations > 0 {
		return nil, errors.New("book copy is already reserved for the selected dates")
	}

	// Check for overlapping pickup slots (30-minute window)
	var overlappingPickupSlots int64
	s.db.Model(&models.Reservation{}).
		Where("pickup_slot = ? AND status IN ?",
			pickupSlot, []models.ReservationStatus{models.ReservationStatusPending, models.ReservationStatusApproved}).
		Count(&overlappingPickupSlots)

	if overlappingPickupSlots > 0 {
		return nil, errors.New("this pickup slot is already taken")
	}

	// Create reservation
	reservation := &models.Reservation{
		UserID:     userUUID,
		BookCopyID: bookCopyUUID,
		StartDate:  startDate,
		EndDate:    endDate,
		PickupSlot: pickupSlot,
		Status:     models.ReservationStatusPending,
	}

	if err := s.db.Create(reservation).Error; err != nil {
		return nil, err
	}

	// Update book copy availability
	bookCopy.Available = false
	if err := s.db.Save(&bookCopy).Error; err != nil {
		return nil, err
	}

	return reservation, nil
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
func (s *ReservationService) UpdateReservationStatus(id string, status models.ReservationStatus) (*models.Reservation, error) {
	// Parse reservation ID
	reservationUUID, err := uuid.Parse(id)
	if err != nil {
		return nil, errors.New("invalid reservation ID")
	}

	var reservation models.Reservation
	if err := s.db.First(&reservation, "id = ?", reservationUUID).Error; err != nil {
		return nil, errors.New("reservation not found")
	}

	// Update status
	reservation.Status = status

	// If reservation is returned or rejected, make the book copy available again
	if status == models.ReservationStatusReturned || status == models.ReservationStatusRejected {
		var bookCopy models.BookCopy
		if err := s.db.First(&bookCopy, "id = ?", reservation.BookCopyID).Error; err != nil {
			return nil, err
		}
		bookCopy.Available = true
		if err := s.db.Save(&bookCopy).Error; err != nil {
			return nil, err
		}
	}

	if err := s.db.Save(&reservation).Error; err != nil {
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
		bookCopy.Available = true
		if err := s.db.Save(&bookCopy).Error; err != nil {
			return err
		}
	}

	return nil
}
