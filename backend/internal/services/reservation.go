package services

import (
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/hungcq/pscit/backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
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

// Helper to count user's reserved/borrowed books
func (s *ReservationService) countUserActiveBooks(tx *gorm.DB, userID uuid.UUID) (int64, error) {
	var count int64
	err := tx.Table("reservation_book_copies").
		Joins("JOIN reservations ON reservations.id = reservation_book_copies.reservation_id").
		Where("reservations.user_id = ? AND reservations.status IN ?", userID, []string{"pending", "approved"}).
		Count(&count).Error
	return count, err
}

// CreateReservation creates a new reservation
func (s *ReservationService) CreateReservation(
	userID string, startDate time.Time, endDate time.Time,
	suggestedPickTimes []string, suggestedReturnTimes []string,
) (*models.Reservation, error) {
	var reservation models.Reservation

	// Get cart items
	cartService := NewCartService(s.db)
	items, err := cartService.GetCartItems(userID)
	if err != nil {
		return nil, err
	}

	if len(items) == 0 {
		return nil, errors.New("cart is empty")
	}

	var bookCopyIDs []string
	for _, item := range items {
		bookCopyIDs = append(bookCopyIDs, item.BookCopyID.String())
	}

	err = s.db.Transaction(func(tx *gorm.DB) error {
		userUUID, err := uuid.Parse(userID)
		if err != nil {
			return fmt.Errorf("invalid user ID: %w", err)
		}

		// Enforce max 5 reserved/borrowed books
		activeCount, err := s.countUserActiveBooks(tx, userUUID)
		if err != nil {
			return fmt.Errorf("failed to count user's active books: %w", err)
		}
		if activeCount+int64(len(bookCopyIDs)) > 5 {
			return fmt.Errorf("you cannot reserve or borrow more than 5 books at a time (currently %d books)", activeCount)
		}

		var bookCopies []models.BookCopy
		for _, bookCopyID := range bookCopyIDs {
			bookCopyUUID, err := uuid.Parse(bookCopyID)
			if err != nil {
				return fmt.Errorf("invalid book copy ID: %w", err)
			}

			var bookCopy models.BookCopy
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
				First(&bookCopy, "id = ?", bookCopyUUID).Error; err != nil {
				return fmt.Errorf("failed to lock book copy %s: %w", bookCopyUUID, err)
			}

			if bookCopy.Status != models.BookCopyStatusAvailable {
				return fmt.Errorf("book copy %s is not available", bookCopyUUID)
			}

			bookCopies = append(bookCopies, bookCopy)
		}

		// Check if user has any active reservations for these book copies
		for _, bookCopy := range bookCopies {
			var count int64
			if err := tx.Model(&models.Reservation{}).
				Joins("JOIN reservation_book_copies ON reservation_book_copies.reservation_id = reservations.id").
				Where("reservation_book_copies.book_copy_id = ? AND reservations.user_id = ? AND reservations.status = ?",
					bookCopy.ID, userUUID, models.ReservationStatusPending).
				Count(&count).Error; err != nil {
				return fmt.Errorf("failed to check existing reservations: %w", err)
			}
			if count > 0 {
				return fmt.Errorf("user already has a pending reservation for book copy %s", bookCopy.ID)
			}
		}

		if err := checkTimeOverlap(suggestedPickTimes); err != nil {
			return fmt.Errorf("invalid pick time: %w", err)
		}
		if err := checkTimeOverlap(suggestedReturnTimes); err != nil {
			return fmt.Errorf("invalid return time: %w", err)
		}

		reservation = models.Reservation{
			UserID:                   userUUID,
			StartDate:                startDate,
			EndDate:                  endDate,
			Status:                   models.ReservationStatusPending,
			SuggestedPickupTimeslots: suggestedPickTimes,
			SuggestedReturnTimeslots: suggestedReturnTimes,
		}

		if err := tx.Create(&reservation).Error; err != nil {
			return fmt.Errorf("failed to create reservation: %w", err)
		}

		// Associate book copies with reservation using GORM's association
		if err := tx.Model(&reservation).Association("BookCopies").Append(bookCopies); err != nil {
			return fmt.Errorf("failed to associate book copies: %w", err)
		}

		// Update book copy statuses
		if err := tx.Model(&models.BookCopy{}).
			Where("id IN ?", bookCopyIDs).
			Update("status", models.BookCopyStatusReserved).Error; err != nil {
			return fmt.Errorf("failed to update book copy status: %w", err)
		}

		// Clear cart within the same transaction
		if err := cartService.ClearCartTx(tx, userID); err != nil {
			return fmt.Errorf("failed to clear cart: %w", err)
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	// Load related data
	if err := s.db.Preload("User").
		Preload("BookCopies").
		Preload("BookCopies.Book").
		Preload("BookCopies.Book.Authors").
		First(&reservation, reservation.ID).Error; err != nil {
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
		Preload("BookCopies").
		Preload("BookCopies.Book").
		Preload("BookCopies.Book.Authors").
		Preload("BookCopies.Book.Categories")

	if filters.Email != "" {
		query = query.Joins("JOIN users ON users.id = reservations.user_id").
			Where("LOWER(users.email) LIKE ?", "%"+strings.ToLower(filters.Email)+"%")
	}

	if filters.Status != "" {
		query = query.Where("reservations.status = ?", filters.Status)
	}

	if filters.BookTitle != "" {
		query = query.Joins("JOIN reservation_book_copies ON reservation_book_copies.reservation_id = reservations.id").
			Joins("JOIN book_copies ON book_copies.id = reservation_book_copies.book_copy_id").
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
	if err := s.db.Preload("BookCopies").
		Preload("BookCopies.Book").
		Preload("BookCopies.Book.Authors").
		Preload("BookCopies.Book.Categories").
		Preload("User").
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

		// If status is approved, require pickup and return times
		if status == models.ReservationStatusApproved && (pickupTime.IsZero() || returnTime.IsZero()) {
			return errors.New("pickup and return times are required when approving a reservation")
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

		// Update all book copies status in a single query
		bookCopyStatus := models.BookCopyStatusAvailable
		switch status {
		case models.ReservationStatusApproved:
			bookCopyStatus = models.BookCopyStatusBorrowed
		case models.ReservationStatusPending:
			bookCopyStatus = models.BookCopyStatusReserved
		case models.ReservationStatusRejected, models.ReservationStatusReturned:
			bookCopyStatus = models.BookCopyStatusAvailable
		}

		// Use raw SQL to update with FROM clause
		if err := tx.Exec(`
			UPDATE book_copies
			SET status = ?, updated_at = ?
			FROM reservation_book_copies
			WHERE reservation_book_copies.book_copy_id = book_copies.id
			  AND reservation_book_copies.reservation_id = ?
			  AND book_copies.deleted_at IS NULL
		`, bookCopyStatus, time.Now(), reservation.ID).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	// Load related data
	if err := s.db.Preload("User").Preload("BookCopies.Book.Authors").First(&reservation, reservation.ID).Error; err != nil {
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
	if err := s.db.Preload("BookCopies").
		Preload("BookCopies.Book").
		Preload("BookCopies.Book.Authors").
		Preload("BookCopies.Book.Categories").
		Preload("User").
		First(&reservation, "id = ?", reservationUUID).Error; err != nil {
		return nil, err
	}
	return &reservation, nil
}

// CheckoutCart creates a reservation from the user's cart
func (s *ReservationService) CheckoutCart(
	userID string, startDate time.Time, endDate time.Time, suggestedPickTimes []string, suggestedReturnTimes []string,
) (*models.Reservation, error) {
	// Get cart items
	cartService := NewCartService(s.db)
	items, err := cartService.GetCartItems(userID)
	if err != nil {
		return nil, err
	}

	if len(items) == 0 {
		return nil, errors.New("cart is empty")
	}

	// Enforce max 5 reserved/borrowed books
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}
	activeCount, err := s.countUserActiveBooks(s.db, userUUID)
	if err != nil {
		return nil, fmt.Errorf("failed to count user's active books: %w", err)
	}
	if activeCount+int64(len(items)) > 5 {
		return nil, errors.New("You cannot reserve or borrow more than 5 books at a time.")
	}

	// Get book copy IDs
	var bookCopyIDs []string
	for _, item := range items {
		bookCopyIDs = append(bookCopyIDs, item.BookCopyID.String())
	}

	// Create reservation
	reservation, err := s.CreateReservation(userID, startDate, endDate, suggestedPickTimes, suggestedReturnTimes)
	if err != nil {
		return nil, err
	}

	// Clear cart
	if err := cartService.ClearCartTx(nil, userID); err != nil {
		log.Printf("Failed to clear cart after checkout: %v", err)
	}

	return reservation, nil
}
