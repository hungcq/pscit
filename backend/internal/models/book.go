package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// BookFormat represents the physical format of a book
type BookFormat string

const (
	FormatPaperback BookFormat = "paperback"
	FormatHardcover BookFormat = "hardcover"
)

// Author represents a book author
type Author struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	Name      string         `gorm:"uniqueIndex:idx_authors_name" json:"name"`
	Biography string         `json:"biography"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	Books     []Book         `gorm:"many2many:book_authors;" json:"books,omitempty"`
}

// Category represents a book category
type Category struct {
	ID          uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	Name        string         `gorm:"uniqueIndex:idx_categories_name" json:"name"`
	Description string         `json:"description"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	Books       []Book         `gorm:"many2many:book_categories;" json:"books,omitempty"`
}

type Book struct {
	ID             uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	Title          string         `gorm:"index:idx_books_title" json:"title"`
	Subtitle       string         `json:"subtitle"`
	Description    string         `json:"description"`
	ISBN10         *string        `gorm:"uniqueIndex:idx_books_isbn10" json:"isbn10"`
	ISBN13         *string        `gorm:"uniqueIndex:idx_books_isbn13" json:"isbn13"`
	PublishedYear  int            `json:"published_year"`
	PageCount      int            `json:"page_count"`
	Publisher      string         `json:"publisher"`
	GoogleVolumeID string         `json:"google_volume_id"`
	MainImage      string         `json:"main_image"`
	Format         BookFormat     `gorm:"type:varchar(20);default:'paperback'" json:"format"`
	Language       string         `gorm:"type:varchar(2);default:'en';index:idx_books_language" json:"language"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
	Authors        []Author       `gorm:"many2many:book_authors;" json:"authors"`
	Categories     []Category     `gorm:"many2many:book_categories;" json:"categories"`
	Tags           []Tag          `gorm:"many2many:book_tags;" json:"tags"`
}

type CreateBookRequest struct {
	Title          string     `json:"title" binding:"required"`
	Subtitle       string     `json:"subtitle"`
	Description    string     `json:"description"`
	ISBN10         *string    `json:"isbn10"`
	ISBN13         *string    `json:"isbn13"`
	PublishedYear  int        `json:"published_year"`
	PageCount      int        `json:"page_count"`
	Publisher      string     `json:"publisher"`
	GoogleVolumeID string     `json:"google_volume_id"`
	MainImage      string     `json:"main_image"`
	Language       *string    `json:"language"`
	Format         BookFormat `json:"format" binding:"required,oneof=paperback hardcover"`
	AuthorIDs      []string   `json:"author_ids" binding:"required"`
	CategoryIDs    []string   `json:"category_ids"`
	TagIDs         []string   `json:"tag_ids"`
}

func (b *Book) BeforeCreate(tx *gorm.DB) error {
	if b.ID == uuid.Nil {
		b.ID = uuid.New()
	}
	return nil
}

func (a *Author) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}

func (c *Category) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

// GetMainImage returns the main image URL if available
func (b *Book) GetMainImage() string {
	return b.MainImage
}
