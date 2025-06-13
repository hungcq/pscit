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
	StartDate                time.Time         `json:"start_date"`
	EndDate                  time.Time         `json:"end_date"`
	PickupTime               *time.Time        `json:"pickup_time"`
	ReturnTime               *time.Time        `json:"return_time"`
	Status                   ReservationStatus `gorm:"type:varchar(20);index:idx_reservations_status" json:"status"`
	CreatedAt                time.Time         `json:"created_at"`
	UpdatedAt                time.Time         `json:"updated_at"`
	DeletedAt                gorm.DeletedAt    `gorm:"index" json:"-"`
	User                     User              `json:"user,omitempty"`
	BookCopies               []BookCopy        `gorm:"many2many:reservation_book_copies;" json:"book_copies,omitempty"`
	SuggestedPickupTimeslots pq.StringArray    `json:"suggested_pickup_timeslots" gorm:"type:text[]"`
	SuggestedReturnTimeslots pq.StringArray    `json:"suggested_return_timeslots" gorm:"type:text[]"`
}

type CreateReservationRequest struct {
	StartDate                string   `json:"start_date" binding:"required"`
	EndDate                  string   `json:"end_date" binding:"required"`
	SuggestedPickupTimeslots []string `json:"suggested_pickup_timeslots" binding:"required,min=1"`
	SuggestedReturnTimeslots []string `json:"suggested_return_timeslots" binding:"required,min=1"`
}

type UpdateReservationStatusRequest struct {
	Status     ReservationStatus `json:"status" binding:"required,oneof=pending approved rejected returned"`
	PickupTime string            `json:"pickup_time,omitempty"`
	ReturnTime string            `json:"return_time,omitempty"`
}

type ReservationFilters struct {
	Email     string `form:"email"`
	Status    string `form:"status"`
	BookTitle string `form:"book_title"`
}

func (r *Reservation) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}
