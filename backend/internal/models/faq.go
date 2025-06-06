package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type FAQ struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	Question  string         `json:"question"`
	Answer    string         `json:"answer"`
	Category  string         `gorm:"index" json:"category"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (f *FAQ) BeforeCreate(tx *gorm.DB) error {
	if f.ID == uuid.Nil {
		f.ID = uuid.New()
	}
	return nil
}
