package services

import (
	"errors"

	"github.com/google/uuid"
	"github.com/hungcq/pscit/backend/internal/models"
	"gorm.io/gorm"
)

type CartService struct {
	db *gorm.DB
}

func NewCartService(db *gorm.DB) *CartService {
	return &CartService{db: db}
}

// AddToCart adds a book copy to the user's cart
func (s *CartService) AddToCart(userID, bookCopyID string) error {
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return errors.New("invalid user ID")
	}

	bookCopyUUID, err := uuid.Parse(bookCopyID)
	if err != nil {
		return errors.New("invalid book copy ID")
	}

	// Check if book copy exists and is available
	var bookCopy models.BookCopy
	if err := s.db.First(&bookCopy, "id = ?", bookCopyUUID).Error; err != nil {
		return errors.New("book copy not found")
	}

	if bookCopy.Status != models.BookCopyStatusAvailable {
		return errors.New("book copy is not available")
	}

	// Check if book copy is already in cart
	var existingItem models.CartItem
	err = s.db.Where("user_id = ? AND book_copy_id = ?", userUUID, bookCopyUUID).First(&existingItem).Error
	if err == nil {
		return errors.New("book copy already in cart")
	}

	// Add to cart
	cartItem := models.CartItem{
		UserID:     userUUID,
		BookCopyID: bookCopyUUID,
	}

	return s.db.Create(&cartItem).Error
}

// RemoveFromCart removes a book copy from the user's cart
func (s *CartService) RemoveFromCart(userID, bookCopyID string) error {
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return errors.New("invalid user ID")
	}

	bookCopyUUID, err := uuid.Parse(bookCopyID)
	if err != nil {
		return errors.New("invalid book copy ID")
	}

	// Remove item
	result := s.db.Unscoped().Where("user_id = ? AND book_copy_id = ?", userUUID, bookCopyUUID).Delete(&models.CartItem{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("book copy not in cart")
	}

	return nil
}

// ClearCartTx removes all items from the user's cart
func (s *CartService) ClearCartTx(db *gorm.DB, userID string) error {
	if db == nil {
		db = s.db
	}
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return errors.New("invalid user ID")
	}

	// Remove all items
	return db.Unscoped().Where("user_id = ?", userUUID).Delete(&models.CartItem{}).Error
}

// GetCartItems gets all items in the user's cart
func (s *CartService) GetCartItems(userID string) ([]models.CartItem, error) {
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	// Get items
	var items []models.CartItem
	if err := s.db.Preload("BookCopy.Book").Where("user_id = ?", userUUID).Find(&items).Error; err != nil {
		return nil, err
	}

	return items, nil
}
