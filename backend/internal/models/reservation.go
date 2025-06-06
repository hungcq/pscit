package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
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
	ID                       uuid.UUID         `gorm:"type:uuid;primary_key" json:"id"`
	UserID                   uuid.UUID         `gorm:"type:uuid;index:idx_reservations_user_id" json:"user_id"`
	BookCopyID               uuid.UUID         `gorm:"type:uuid;index:idx_reservations_book_copy_id" json:"book_copy_id"`
	StartDate                time.Time         `gorm:"index:idx_reservations_dates" json:"start_date"`
	EndDate                  time.Time         `gorm:"index:idx_reservations_dates" json:"end_date"`
	PickupTime               *time.Time        `gorm:"index:idx_reservations_pickup" json:"pickup_time"`
	ReturnTime               *time.Time        `gorm:"index:idx_reservations_return" json:"return_time"`
	Status                   ReservationStatus `gorm:"type:varchar(20);index:idx_reservations_status" json:"status"`
	CreatedAt                time.Time         `json:"created_at"`
	UpdatedAt                time.Time         `json:"updated_at"`
	DeletedAt                gorm.DeletedAt    `gorm:"index" json:"-"`
	User                     User              `json:"user,omitempty"`
	BookCopy                 BookCopy          `json:"book_copy,omitempty"`
	SuggestedPickupTimeslots pq.StringArray    `json:"suggested_pickup_timeslots" gorm:"type:text[]"`
	SuggestedReturnTimeslots pq.StringArray    `json:"suggested_return_timeslots" gorm:"type:text[]"`
}

type CreateReservationRequest struct {
	BookCopyID               string   `json:"bookCopyId" binding:"required"`
	StartDate                string   `json:"startDate" binding:"required"`
	EndDate                  string   `json:"endDate" binding:"required"`
	SuggestedPickupTimeslots []string `json:"suggestedPickupTimeslots" binding:"required,min=1"`
	SuggestedReturnTimeslots []string `json:"suggestedReturnTimeslots" binding:"required,min=1"`
}

type UpdateReservationStatusRequest struct {
	Status     ReservationStatus `json:"status" binding:"required"`
	PickupTime string            `json:"pickupTime,omitempty"`
	ReturnTime string            `json:"returnTime,omitempty"`
}

func (r *Reservation) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}
