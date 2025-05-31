package services

import (
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/hungcq/pscit/backend/models"
	"gorm.io/gorm"
)

type BookService struct {
	db *gorm.DB
}

func NewBookService(db *gorm.DB) *BookService {
	return &BookService{db: db}
}

// GetBooks retrieves books with pagination and filtering
func (s *BookService) GetBooks(query, category, author string, page, limit int) ([]models.Book, int64, error) {
	var books []models.Book
	var total int64

	// Build base query
	baseQuery := s.db.Model(&models.Book{})

	// Apply filters
	if query != "" {
		query = "%" + strings.ToLower(query) + "%"
		baseQuery = baseQuery.Where(
			"LOWER(title) LIKE ? OR LOWER(subtitle) LIKE ?",
			query, query,
		)
	}

	// Create subquery for distinct book IDs
	subQuery := baseQuery.Table("books").Select("books.id")

	if category != "" {
		subQuery = subQuery.Distinct("books.id").
			Joins("JOIN book_categories ON books.id = book_categories.book_id").
			Joins("JOIN categories ON book_categories.category_id = categories.id").
			Where("LOWER(categories.name) LIKE ?", "%"+strings.ToLower(category)+"%")
	}

	if author != "" {
		subQuery = subQuery.Distinct("books.id").
			Joins("JOIN book_authors ON books.id = book_authors.book_id").
			Joins("JOIN authors ON book_authors.author_id = authors.id").
			Where("LOWER(authors.name) LIKE ?", "%"+strings.ToLower(author)+"%")
	}

	// Build final query with preloading
	dbQuery := s.db.Model(&models.Book{}).
		Preload("Authors").
		Preload("Categories").
		Where("id IN (?)", subQuery)

	// Get total count
	if err := dbQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination
	offset := (page - 1) * limit
	if err := dbQuery.Offset(offset).Limit(limit).Find(&books).Error; err != nil {
		return nil, 0, err
	}

	return books, total, nil
}

// GetBook retrieves a single book by ID
func (s *BookService) GetBook(id string) (*models.Book, error) {
	var book models.Book
	if err := s.db.Preload("Authors").Preload("Categories").First(&book, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("book not found")
		}
		return nil, err
	}
	return &book, nil
}

// CreateBook creates a new book
func (s *BookService) CreateBook(book *models.Book) error {
	return s.db.Create(book).Error
}

// UpdateBook updates an existing book
func (s *BookService) UpdateBook(id string, book *models.Book) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		// Get existing book
		var existingBook models.Book
		if err := tx.Preload("Authors").Preload("Categories").First(&existingBook, "id = ?", id).Error; err != nil {
			return err
		}

		// Update authors
		if err := tx.Model(&existingBook).Association("Authors").Replace(book.Authors); err != nil {
			return err
		}

		// Update categories
		if err := tx.Model(&existingBook).Association("Categories").Replace(book.Categories); err != nil {
			return err
		}

		// Update book fields
		if err := tx.Model(&existingBook).Updates(map[string]interface{}{
			"title":       book.Title,
			"subtitle":    book.Subtitle,
			"description": book.Description,
			"isbn_10":     book.ISBN10,
			"isbn_13":     book.ISBN13,
			"main_image":  book.MainImage,
			"available":   book.Available,
		}).Error; err != nil {
			return err
		}

		return nil
	})
}

// DeleteBook deletes a book
func (s *BookService) DeleteBook(id string) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		// Delete book associations first
		if err := tx.Model(&models.Book{ID: uuid.MustParse(id)}).Association("Authors").Clear(); err != nil {
			return err
		}
		if err := tx.Model(&models.Book{ID: uuid.MustParse(id)}).Association("Categories").Clear(); err != nil {
			return err
		}

		// Delete the book
		result := tx.Delete(&models.Book{}, "id = ?", id)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return errors.New("book not found")
		}
		return nil
	})
}

// SearchBooks performs a full-text search on books
func (s *BookService) SearchBooks(query string) ([]models.Book, error) {
	var books []models.Book
	query = "%" + strings.ToLower(query) + "%"

	err := s.db.Preload("Authors").Preload("Categories").Where(
		"LOWER(title) LIKE ? OR LOWER(subtitle) LIKE ?",
		query, query,
	).Find(&books).Error

	return books, err
}

// GetAvailableBooks retrieves all available books
func (s *BookService) GetAvailableBooks() ([]models.Book, error) {
	var books []models.Book
	err := s.db.Preload("Authors").Preload("Categories").Where("available = ?", true).Find(&books).Error
	return books, err
}

// UpdateBookAvailability updates a book's availability status
func (s *BookService) UpdateBookAvailability(id string, available bool) error {
	result := s.db.Model(&models.Book{}).Where("id = ?", id).Update("available", available)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("book not found")
	}
	return nil
}

// GetBooksByCategory retrieves books by category
func (s *BookService) GetBooksByCategory(category string) ([]models.Book, error) {
	var books []models.Book
	err := s.db.Preload("Authors").Preload("Categories").
		Joins("JOIN book_categories ON books.id = book_categories.book_id").
		Joins("JOIN categories ON book_categories.category_id = categories.id").
		Where("categories.name = ?", category).
		Find(&books).Error
	return books, err
}

// GetBooksByAuthor retrieves books by author
func (s *BookService) GetBooksByAuthor(author string) ([]models.Book, error) {
	var books []models.Book
	err := s.db.Preload("Authors").Preload("Categories").
		Joins("JOIN book_authors ON books.id = book_authors.book_id").
		Joins("JOIN authors ON book_authors.author_id = authors.id").
		Where("LOWER(authors.name) LIKE ?", "%"+strings.ToLower(author)+"%").
		Find(&books).Error
	return books, err
}

func (s *BookService) BulkCreateBooks(books []models.Book) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		for _, book := range books {
			if err := s.CreateBook(&book); err != nil {
				return err
			}
		}
		return nil
	})
}

// GetAuthor retrieves an author by ID
func (s *BookService) GetAuthor(id string) (*models.Author, error) {
	var author models.Author
	if err := s.db.First(&author, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("author not found")
		}
		return nil, err
	}
	return &author, nil
}

// GetCategory retrieves a category by ID
func (s *BookService) GetCategory(id string) (*models.Category, error) {
	var category models.Category
	if err := s.db.First(&category, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("category not found")
		}
		return nil, err
	}
	return &category, nil
}
