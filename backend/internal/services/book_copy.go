package services

import (
	"errors"

	"github.com/hungcq/pscit/backend/internal/models"

	"github.com/google/uuid"
	"go.uber.org/zap"
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
	if err := s.db.Where("book_id = ?", bookID).Find(&copies).Error; err != nil {
		zap.L().Error("GetBookCopies: Failed to retrieve book copies", zap.String("bookID", bookID), zap.Error(err))
		return nil, err
	}
	zap.L().Info("GetBookCopies: Successfully retrieved book copies", zap.String("bookID", bookID), zap.Int("count", len(copies)))
	return copies, nil
}

// GetBookCopy retrieves a single book copy by ID
func (s *BookCopyService) GetBookCopy(id string) (*models.BookCopy, error) {
	var copy models.BookCopy
	if err := s.db.First(&copy, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			zap.L().Warn("GetBookCopy: Book copy not found", zap.String("id", id))
			return nil, errors.New("book copy not found")
		}
		zap.L().Error("GetBookCopy: Failed to retrieve book copy", zap.String("id", id), zap.Error(err))
		return nil, err
	}
	zap.L().Info("GetBookCopy: Successfully retrieved book copy", zap.String("id", id))
	return &copy, nil
}

// CreateBookCopy creates a new book copy
func (s *BookCopyService) CreateBookCopy(copy *models.BookCopy) error {
	if err := s.db.Create(copy).Error; err != nil {
		zap.L().Error("CreateBookCopy: Failed to create book copy", zap.String("bookID", copy.BookID.String()), zap.Error(err))
		return err
	}
	zap.L().Info("CreateBookCopy: Book copy created successfully", zap.String("id", copy.ID.String()), zap.String("bookID", copy.BookID.String()))
	return nil
}

// UpdateBookCopy updates an existing book copy
func (s *BookCopyService) UpdateBookCopy(id string, copy *models.BookCopy) error {
	result := s.db.Model(&models.BookCopy{}).Where("id = ?", id).Updates(copy)
	if result.Error != nil {
		zap.L().Error("UpdateBookCopy: Failed to update book copy", zap.String("id", id), zap.Error(result.Error))
		return result.Error
	}
	if result.RowsAffected == 0 {
		zap.L().Warn("UpdateBookCopy: Book copy not found for update", zap.String("id", id))
		return errors.New("book copy not found")
	}
	zap.L().Info("UpdateBookCopy: Book copy updated successfully", zap.String("id", id))
	return nil
}

// DeleteBookCopy deletes a book copy
func (s *BookCopyService) DeleteBookCopy(id string) error {
	result := s.db.Delete(&models.BookCopy{}, "id = ?", id)
	if result.Error != nil {
		zap.L().Error("DeleteBookCopy: Failed to delete book copy", zap.String("id", id), zap.Error(result.Error))
		return result.Error
	}
	if result.RowsAffected == 0 {
		zap.L().Warn("DeleteBookCopy: Book copy not found for deletion", zap.String("id", id))
		return errors.New("book copy not found")
	}
	zap.L().Info("DeleteBookCopy: Book copy deleted successfully", zap.String("id", id))
	return nil
}

// BulkCreateBookCopies creates multiple copies of a book
func (s *BookCopyService) BulkCreateBookCopies(bookID string, count int, condition models.BookCondition) error {
	bookUUID, err := uuid.Parse(bookID)
	if err != nil {
		zap.L().Error("BulkCreateBookCopies: Invalid book ID", zap.String("bookID", bookID), zap.Error(err))
		return errors.New("invalid book ID")
	}

	if err := s.db.Transaction(func(tx *gorm.DB) error {
		for i := 0; i < count; i++ {
			copy := &models.BookCopy{
				BookID:    bookUUID,
				Condition: condition,
				Status:    models.BookCopyStatusAvailable,
			}
			if err := tx.Create(copy).Error; err != nil {
				zap.L().Error("BulkCreateBookCopies: Failed to create book copy in transaction", zap.String("bookID", bookID), zap.Int("index", i), zap.Error(err))
				return err
			}
		}
		return nil
	}); err != nil {
		zap.L().Error("BulkCreateBookCopies: Transaction failed", zap.String("bookID", bookID), zap.Error(err))
		return err
	}
	zap.L().Info("BulkCreateBookCopies: Successfully created book copies", zap.String("bookID", bookID), zap.Int("count", count))
	return nil
}

// UpdateBookCopyAvailability updates a book copy's availability status
func (s *BookCopyService) UpdateBookCopyAvailability(id string, available bool) error {
	result := s.db.Model(&models.BookCopy{}).Where("id = ?", id).Update("available", available)
	if result.Error != nil {
		zap.L().Error("UpdateBookCopyAvailability: Failed to update book copy availability", zap.String("id", id), zap.Bool("available", available), zap.Error(result.Error))
		return result.Error
	}
	if result.RowsAffected == 0 {
		zap.L().Warn("UpdateBookCopyAvailability: Book copy not found for availability update", zap.String("id", id))
		return errors.New("book copy not found")
	}
	zap.L().Info("UpdateBookCopyAvailability: Successfully updated book copy availability", zap.String("id", id), zap.Bool("available", available))
	return nil
}
