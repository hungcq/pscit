package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ReservationStatus string

const (
	ReservationStatusPending  ReservationStatus = "pending"
	ReservationStatusApproved ReservationStatus = "approved"
	ReservationStatusRejected ReservationStatus = "rejected"
	ReservationStatusReturned ReservationStatus = "returned"
)

type Reservation struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	UserID    uuid.UUID      `gorm:"type:uuid;index" json:"user_id"`
	BookID    uuid.UUID      `gorm:"type:uuid;index" json:"book_id"`
	StartDate time.Time      `json:"start_date"`
	EndDate   time.Time      `json:"end_date"`
	Status    string         `gorm:"index" json:"status"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	User      User           `json:"user,omitempty"`
	Book      Book           `json:"book,omitempty"`
}

type CreateReservationRequest struct {
	BookID    uuid.UUID `json:"book_id" binding:"required"`
	StartDate time.Time `json:"start_date" binding:"required"`
	EndDate   time.Time `json:"end_date" binding:"required"`
}

type UpdateReservationStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

func (r *Reservation) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}
