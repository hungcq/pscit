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

	// Check if book exists and is available
	var book models.Book
	if err := s.db.First(&book, "id = ?", req.BookID).Error; err != nil {
		return nil, errors.New("book not found")
	}

	if !book.Available {
		return nil, errors.New("book is not available")
	}

	// Check for overlapping reservations
	var overlappingReservations int64
	s.db.Model(&models.Reservation{}).
		Where("book_id = ? AND status IN ? AND ((start_date <= ? AND end_date >= ?) OR (start_date <= ? AND end_date >= ?))",
			req.BookID, []string{"pending", "approved"}, req.EndDate, req.StartDate, req.StartDate, req.EndDate).
		Count(&overlappingReservations)

	if overlappingReservations > 0 {
		return nil, errors.New("book is already reserved for the selected dates")
	}

	// Create reservation
	reservation := &models.Reservation{
		UserID:    userUUID,
		BookID:    req.BookID,
		StartDate: req.StartDate,
		EndDate:   req.EndDate,
		Status:    "pending",
	}

	if err := s.db.Create(reservation).Error; err != nil {
		return nil, err
	}

	// Update book availability
	book.Available = false
	if err := s.db.Save(&book).Error; err != nil {
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
	if err := s.db.Preload("Book").Preload("User").
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
	if err := s.db.Preload("Book").Preload("User").
		Where("user_id = ?", userUUID).
		Offset(offset).Limit(limit).
		Order("created_at DESC").
		Find(&reservations).Error; err != nil {
		return nil, 0, err
	}

	return reservations, total, nil
}

// UpdateReservationStatus updates a reservation's status
func (s *ReservationService) UpdateReservationStatus(id string, status string) (*models.Reservation, error) {
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

	// If book is returned, make it available again
	if status == "returned" {
		var book models.Book
		if err := s.db.First(&book, "id = ?", reservation.BookID).Error; err != nil {
			return nil, err
		}
		book.Available = true
		if err := s.db.Save(&book).Error; err != nil {
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
	if err := s.db.Preload("Book").Preload("User").First(&reservation, "id = ?", reservationUUID).Error; err != nil {
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
		var book models.Book
		if err := s.db.First(&book, "id = ?", reservation.BookID).Error; err != nil {
			return err
		}
		book.Available = true
		if err := s.db.Save(&book).Error; err != nil {
			return err
		}
	}

	return nil
}
