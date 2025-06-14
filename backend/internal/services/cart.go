package services

import (
	"errors"

	"github.com/google/uuid"
	"github.com/hungcq/pscit/backend/internal/models"
	"go.uber.org/zap"
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
		zap.L().Error("AddToCart: Invalid user ID", zap.String("userID", userID), zap.Error(err))
		return errors.New("invalid user ID")
	}

	bookCopyUUID, err := uuid.Parse(bookCopyID)
	if err != nil {
		zap.L().Error("AddToCart: Invalid book copy ID", zap.String("bookCopyID", bookCopyID), zap.Error(err))
		return errors.New("invalid book copy ID")
	}

	// Check if book copy exists and is available
	var bookCopy models.BookCopy
	if err := s.db.First(&bookCopy, "id = ?", bookCopyUUID).Error; err != nil {
		zap.L().Error("AddToCart: Book copy not found", zap.String("bookCopyID", bookCopyID), zap.Error(err))
		return errors.New("book copy not found")
	}

	if bookCopy.Status != models.BookCopyStatusAvailable {
		zap.L().Warn("AddToCart: Book copy not available", zap.String("bookCopyID", bookCopyID), zap.String("status", string(bookCopy.Status)))
		return errors.New("book copy is not available")
	}

	// Check current cart item count
	var count int64
	if err := s.db.Model(&models.CartItem{}).Where("user_id = ?", userUUID).Count(&count).Error; err != nil {
		zap.L().Error("AddToCart: Failed to count cart items", zap.String("userID", userID), zap.Error(err))
		return err
	}

	if count >= 5 {
		zap.L().Warn("AddToCart: Cart limit reached", zap.String("userID", userID), zap.Int64("currentCount", count))
		return errors.New("cart limit reached: maximum 5 items allowed")
	}

	// Check if book copy is already in cart
	var existingItem models.CartItem
	err = s.db.Where("user_id = ? AND book_copy_id = ?", userUUID, bookCopyUUID).First(&existingItem).Error
	if err == nil {
		zap.L().Warn("AddToCart: Book copy already in cart", zap.String("userID", userID), zap.String("bookCopyID", bookCopyID))
		return errors.New("book copy already in cart")
	}

	// Add to cart
	cartItem := models.CartItem{
		UserID:     userUUID,
		BookCopyID: bookCopyUUID,
	}

	if err := s.db.Create(&cartItem).Error; err != nil {
		zap.L().Error("AddToCart: Failed to add item to cart", zap.String("userID", userID), zap.String("bookCopyID", bookCopyID), zap.Error(err))
		return err
	}
	zap.L().Info("AddToCart: Item added to cart successfully", zap.String("userID", userID), zap.String("bookCopyID", bookCopyID))
	return nil
}

// RemoveFromCart removes a book copy from the user's cart
func (s *CartService) RemoveFromCart(userID, bookCopyID string) error {
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		zap.L().Error("RemoveFromCart: Invalid user ID", zap.String("userID", userID), zap.Error(err))
		return errors.New("invalid user ID")
	}

	bookCopyUUID, err := uuid.Parse(bookCopyID)
	if err != nil {
		zap.L().Error("RemoveFromCart: Invalid book copy ID", zap.String("bookCopyID", bookCopyID), zap.Error(err))
		return errors.New("invalid book copy ID")
	}

	// Remove item
	result := s.db.Unscoped().Where("user_id = ? AND book_copy_id = ?", userUUID, bookCopyUUID).Delete(&models.CartItem{})
	if result.Error != nil {
		zap.L().Error("RemoveFromCart: Failed to remove item from cart", zap.String("userID", userID), zap.String("bookCopyID", bookCopyID), zap.Error(result.Error))
		return result.Error
	}
	if result.RowsAffected == 0 {
		zap.L().Warn("RemoveFromCart: Book copy not in cart", zap.String("userID", userID), zap.String("bookCopyID", bookCopyID))
		return errors.New("book copy not in cart")
	}
	zap.L().Info("RemoveFromCart: Item removed from cart successfully", zap.String("userID", userID), zap.String("bookCopyID", bookCopyID))
	return nil
}

// ClearCartTx removes all items from the user's cart
func (s *CartService) ClearCartTx(db *gorm.DB, userID string) error {
	if db == nil {
		db = s.db
	}
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		zap.L().Error("ClearCartTx: Invalid user ID", zap.String("userID", userID), zap.Error(err))
		return errors.New("invalid user ID")
	}

	// Remove all items
	if err := db.Unscoped().Where("user_id = ?", userUUID).Delete(&models.CartItem{}).Error; err != nil {
		zap.L().Error("ClearCartTx: Failed to clear cart", zap.String("userID", userID), zap.Error(err))
		return err
	}
	zap.L().Info("ClearCartTx: Cart cleared successfully", zap.String("userID", userID))
	return nil
}

// GetCartItems gets all items in the user's cart
func (s *CartService) GetCartItems(userID string) ([]models.CartItem, error) {
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		zap.L().Error("GetCartItems: Invalid user ID", zap.String("userID", userID), zap.Error(err))
		return nil, errors.New("invalid user ID")
	}

	// Get items
	var items []models.CartItem
	if err := s.db.Preload("BookCopy.Book").Where("user_id = ?", userUUID).Find(&items).Error; err != nil {
		zap.L().Error("GetCartItems: Failed to retrieve cart items", zap.String("userID", userID), zap.Error(err))
		return nil, err
	}
	zap.L().Info("GetCartItems: Successfully retrieved cart items", zap.String("userID", userID), zap.Int("count", len(items)))
	return items, nil
}
