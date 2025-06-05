package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BookCondition string

const (
	ConditionNew     BookCondition = "new"
	ConditionLikeNew BookCondition = "like_new"
	ConditionGood    BookCondition = "good"
	ConditionFair    BookCondition = "fair"
	ConditionPoor    BookCondition = "poor"
)

type BookCopyStatus string

const (
	BookCopyStatusAvailable BookCopyStatus = "available"
	BookCopyStatusBorrowed  BookCopyStatus = "borrowed"
	BookCopyStatusReserved  BookCopyStatus = "reserved"
)

type BookCopy struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	BookID    uuid.UUID      `gorm:"type:uuid;index:idx_book_copies_book_id" json:"book_id"`
	Condition BookCondition  `gorm:"type:varchar(20);index:idx_book_copies_condition" json:"condition"`
	Status    BookCopyStatus `gorm:"type:varchar(20);index:idx_book_copies_status;default:'available'" json:"status"`
	Notes     string         `json:"notes"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	Book      Book           `json:"book,omitempty"`
}

func (bc *BookCopy) BeforeCreate(tx *gorm.DB) error {
	if bc.ID == uuid.Nil {
		bc.ID = uuid.New()
	}
	return nil
}
