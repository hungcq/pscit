package services

import (
	"errors"
	"github.com/hungcq/pscit/backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BookCopyService struct {
	db *gorm.DB
}

func NewBookCopyService(db *gorm.DB) *BookCopyService {
	return &BookCopyService{db: db}
}

// GetBookCopies retrieves all copies of a book
func (s *BookCopyService) GetBookCopies(bookID string) ([]models.BookCopy, error) {
	var copies []models.BookCopy
	err := s.db.Where("book_id = ?", bookID).Find(&copies).Error
	return copies, err
}

// GetBookCopy retrieves a single book copy by ID
func (s *BookCopyService) GetBookCopy(id string) (*models.BookCopy, error) {
	var copy models.BookCopy
	if err := s.db.First(&copy, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("book copy not found")
		}
		return nil, err
	}
	return &copy, nil
}

// CreateBookCopy creates a new book copy
func (s *BookCopyService) CreateBookCopy(copy *models.BookCopy) error {
	return s.db.Create(copy).Error
}

// UpdateBookCopy updates an existing book copy
func (s *BookCopyService) UpdateBookCopy(id string, copy *models.BookCopy) error {
	result := s.db.Model(&models.BookCopy{}).Where("id = ?", id).Updates(copy)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("book copy not found")
	}
	return nil
}

// DeleteBookCopy deletes a book copy
func (s *BookCopyService) DeleteBookCopy(id string) error {
	result := s.db.Unscoped().Delete(&models.BookCopy{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("book copy not found")
	}
	return nil
}

// BulkCreateBookCopies creates multiple copies of a book
func (s *BookCopyService) BulkCreateBookCopies(bookID string, count int, condition models.BookCondition) error {
	bookUUID, err := uuid.Parse(bookID)
	if err != nil {
		return errors.New("invalid book ID")
	}

	return s.db.Transaction(func(tx *gorm.DB) error {
		for i := 0; i < count; i++ {
			copy := &models.BookCopy{
				BookID:    bookUUID,
				Condition: condition,
				Status:    models.BookCopyStatusAvailable,
			}
			if err := tx.Create(copy).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

// UpdateBookCopyAvailability updates a book copy's availability status
func (s *BookCopyService) UpdateBookCopyAvailability(id string, available bool) error {
	result := s.db.Model(&models.BookCopy{}).Where("id = ?", id).Update("available", available)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("book copy not found")
	}
	return nil
}
