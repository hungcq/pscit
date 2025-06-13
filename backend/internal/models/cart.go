package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CartItem struct {
	ID         uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	UserID     uuid.UUID      `gorm:"type:uuid;index:idx_cart_items_user_id;uniqueIndex:uidx_user_bookcopy" json:"user_id"`
	BookCopyID uuid.UUID      `gorm:"type:uuid;index:idx_cart_items_book_copy_id;uniqueIndex:uidx_user_bookcopy" json:"book_copy_id"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
	BookCopy   BookCopy       `json:"book_copy,omitempty"`
	User       User           `json:"user,omitempty"`
}

type CartRequest struct {
	BookCopyID string `json:"book_copy_id,omitempty"`
}

func (c *CartItem) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}
