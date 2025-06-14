package services

import (
	"errors"
	"strings"

	"github.com/hungcq/pscit/backend/internal/models"

	"github.com/google/uuid"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type BookService struct {
	db *gorm.DB
}

func NewBookService(db *gorm.DB) *BookService {
	return &BookService{db: db}
}

// GetBooks retrieves books with pagination and filtering
func (s *BookService) GetBooks(query, category, author, language, tagKey string, page, limit int, sortField, sortOrder string) ([]models.Book, int64, error) {
	var books []models.Book
	var total int64

	// Build base query
	baseQuery := s.db.Model(&models.Book{})

	// Apply filters
	if query != "" {
		query = "%" + query + "%"
		baseQuery = baseQuery.Where(
			"unaccent(title) ILIKE unaccent(?) OR unaccent(subtitle) ILIKE unaccent(?) OR unaccent(isbn10) ILIKE unaccent(?) OR unaccent(isbn13) ILIKE unaccent(?)",
			query, query, query, query,
		)
	}

	// Create subquery for distinct book IDs
	subQuery := baseQuery.Table("books").Select("books.id")

	if category != "" {
		subQuery = subQuery.Distinct("books.id").
			Joins("JOIN book_categories ON books.id = book_categories.book_id").
			Joins("JOIN categories ON book_categories.category_id = categories.id").
			Where("unaccent(categories.name) ILIKE unaccent(?)", "%"+category+"%")
	}

	if author != "" {
		subQuery = subQuery.Distinct("books.id").
			Joins("JOIN book_authors ON books.id = book_authors.book_id").
			Joins("JOIN authors ON book_authors.author_id = authors.id").
			Where("unaccent(authors.name) ILIKE unaccent(?)", "%"+author+"%")
	}

	if language != "" {
		subQuery = subQuery.Where("books.language = ?", language)
	}

	if tagKey != "" {
		subQuery = subQuery.Distinct("books.id").
			Joins("JOIN book_tags ON books.id = book_tags.book_id").
			Joins("JOIN tags ON book_tags.tag_id = tags.id").
			Where("tags.key = ?", tagKey)
	}

	// Build final query with preloading
	dbQuery := s.db.Model(&models.Book{}).
		Preload("Authors").
		Preload("Categories").
		Preload("Tags").
		Where("id IN (?)", subQuery)

	// Apply sorting
	if sortField == "" {
		sortField = "created_at"
		sortOrder = "ascend"
	}

	order := "ASC"
	if sortOrder == "descend" {
		order = "DESC"
	}

	switch sortField {
	case "title":
		dbQuery = dbQuery.Order("title " + order)
	case "authors":
		dbQuery = dbQuery.Joins("LEFT JOIN book_authors ON books.id = book_authors.book_id").
			Joins("LEFT JOIN authors ON book_authors.author_id = authors.id").
			Group("books.id").
			Order("MIN(authors.name) " + order)
	case "created_at":
		dbQuery = dbQuery.Order("created_at " + order)
	}

	// Get total count
	if err := dbQuery.Count(&total).Error; err != nil {
		zap.L().Error("GetBooks: Failed to count books", zap.Error(err))
		return nil, 0, err
	}

	// Apply pagination
	offset := (page - 1) * limit
	if err := dbQuery.Offset(offset).Limit(limit).Find(&books).Error; err != nil {
		zap.L().Error("GetBooks: Failed to retrieve books with pagination", zap.Int("page", page), zap.Int("limit", limit), zap.Error(err))
		return nil, 0, err
	}
	zap.L().Info("GetBooks: Successfully retrieved books", zap.Int64("total", total), zap.Int("page", page), zap.Int("limit", limit), zap.String("query", query), zap.String("category", category), zap.String("author", author), zap.String("language", language), zap.String("tagKey", tagKey))
	return books, total, nil
}

// GetBook retrieves a single book by ID
func (s *BookService) GetBook(id string) (*models.Book, error) {
	var book models.Book
	if err := s.db.Preload("Authors").Preload("Categories").Preload("Tags").First(&book, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			zap.L().Warn("GetBook: Book not found", zap.String("id", id))
			return nil, errors.New("book not found")
		}
		zap.L().Error("GetBook: Failed to retrieve book", zap.String("id", id), zap.Error(err))
		return nil, err
	}
	zap.L().Info("GetBook: Successfully retrieved book", zap.String("id", id), zap.String("title", book.Title))
	return &book, nil
}

// CreateBook creates a new book
func (s *BookService) CreateBook(book *models.Book) error {
	if err := s.db.Create(book).Error; err != nil {
		zap.L().Error("CreateBook: Failed to create book", zap.String("title", book.Title), zap.Error(err))
		return err
	}
	zap.L().Info("CreateBook: Book created successfully", zap.String("id", book.ID.String()), zap.String("title", book.Title))
	return nil
}

// UpdateBook updates an existing book
func (s *BookService) UpdateBook(id string, book *models.Book) error {
	if err := s.db.Transaction(func(tx *gorm.DB) error {
		// Get existing book
		var existingBook models.Book
		if err := tx.Preload("Authors").Preload("Categories").First(&existingBook, "id = ?", id).Error; err != nil {
			zap.L().Error("UpdateBook: Existing book not found for update", zap.String("id", id), zap.Error(err))
			return err
		}

		// Update authors
		if err := tx.Model(&existingBook).Association("Authors").Replace(book.Authors); err != nil {
			zap.L().Error("UpdateBook: Failed to update authors association", zap.String("id", id), zap.Error(err))
			return err
		}

		// Update categories
		if err := tx.Model(&existingBook).Association("Categories").Replace(book.Categories); err != nil {
			zap.L().Error("UpdateBook: Failed to update categories association", zap.String("id", id), zap.Error(err))
			return err
		}

		// Update tags
		if err := tx.Model(&existingBook).Association("Tags").Replace(book.Tags); err != nil {
			zap.L().Error("UpdateBook: Failed to update tags association", zap.String("id", id), zap.Error(err))
			return err
		}

		// Update book fields
		if err := tx.Model(&existingBook).Updates(map[string]interface{}{
			"title":            book.Title,
			"subtitle":         book.Subtitle,
			"description":      book.Description,
			"isbn10":           book.ISBN10,
			"isbn13":           book.ISBN13,
			"published_year":   book.PublishedYear,
			"page_count":       book.PageCount,
			"publisher":        book.Publisher,
			"google_volume_id": book.GoogleVolumeID,
			"main_image":       book.MainImage,
			"format":           book.Format,
		}).Error; err != nil {
			zap.L().Error("UpdateBook: Failed to update book fields", zap.String("id", id), zap.Error(err))
			return err
		}

		return nil
	}); err != nil {
		zap.L().Error("UpdateBook: Transaction failed", zap.String("id", id), zap.Error(err))
		return err
	}
	zap.L().Info("UpdateBook: Book updated successfully", zap.String("id", id), zap.String("title", book.Title))
	return nil
}

// DeleteBook deletes a book
func (s *BookService) DeleteBook(id string) error {
	if err := s.db.Transaction(func(tx *gorm.DB) error {
		// Delete book associations first
		if err := tx.Model(&models.Book{ID: uuid.MustParse(id)}).Association("Authors").Clear(); err != nil {
			zap.L().Error("DeleteBook: Failed to clear authors association", zap.String("id", id), zap.Error(err))
			return err
		}
		if err := tx.Model(&models.Book{ID: uuid.MustParse(id)}).Association("Categories").Clear(); err != nil {
			zap.L().Error("DeleteBook: Failed to clear categories association", zap.String("id", id), zap.Error(err))
			return err
		}

		// Delete the book
		result := tx.Unscoped().Delete(&models.Book{}, "id = ?", id)
		if result.Error != nil {
			zap.L().Error("DeleteBook: Failed to delete book", zap.String("id", id), zap.Error(result.Error))
			return result.Error
		}
		if result.RowsAffected == 0 {
			zap.L().Warn("DeleteBook: Book not found for deletion", zap.String("id", id))
			return errors.New("book not found")
		}
		return nil
	}); err != nil {
		zap.L().Error("DeleteBook: Transaction failed", zap.String("id", id), zap.Error(err))
		return err
	}
	zap.L().Info("DeleteBook: Book deleted successfully", zap.String("id", id))
	return nil
}

// SearchBooks performs a full-text search on books
func (s *BookService) SearchBooks(query string) ([]models.Book, error) {
	var books []models.Book
	query = "%" + strings.ToLower(query) + "%"

	if err := s.db.Preload("Authors").Preload("Categories").Where(
		"LOWER(title) LIKE ? OR LOWER(subtitle) LIKE ?",
		query, query,
	).Find(&books).Error; err != nil {
		zap.L().Error("SearchBooks: Failed to search books", zap.String("query", query), zap.Error(err))
		return nil, err
	}
	zap.L().Info("SearchBooks: Successfully searched books", zap.String("query", query), zap.Int("count", len(books)))
	return books, nil
}

// GetAvailableBooks retrieves all available books
func (s *BookService) GetAvailableBooks() ([]models.Book, error) {
	var books []models.Book
	if err := s.db.Preload("Authors").Preload("Categories").Where("available = ?", true).Find(&books).Error; err != nil {
		zap.L().Error("GetAvailableBooks: Failed to retrieve available books", zap.Error(err))
		return nil, err
	}
	zap.L().Info("GetAvailableBooks: Successfully retrieved available books", zap.Int("count", len(books)))
	return books, nil
}

// UpdateBookAvailability updates a book's availability status
func (s *BookService) UpdateBookAvailability(id string, available bool) error {
	result := s.db.Model(&models.Book{}).Where("id = ?", id).Update("available", available)
	if result.Error != nil {
		zap.L().Error("UpdateBookAvailability: Failed to update book availability", zap.String("id", id), zap.Bool("available", available), zap.Error(result.Error))
		return result.Error
	}
	if result.RowsAffected == 0 {
		zap.L().Warn("UpdateBookAvailability: Book not found for availability update", zap.String("id", id))
		return errors.New("book not found")
	}
	zap.L().Info("UpdateBookAvailability: Successfully updated book availability", zap.String("id", id), zap.Bool("available", available))
	return nil
}

// GetBooksByCategory retrieves books by category
func (s *BookService) GetBooksByCategory(category string) ([]models.Book, error) {
	var books []models.Book
	if err := s.db.Preload("Authors").Preload("Categories").
		Joins("JOIN book_categories ON books.id = book_categories.book_id").
		Joins("JOIN categories ON book_categories.category_id = categories.id").
		Where("categories.name = ?", category).
		Find(&books).Error; err != nil {
		zap.L().Error("GetBooksByCategory: Failed to retrieve books by category", zap.String("category", category), zap.Error(err))
		return nil, err
	}
	zap.L().Info("GetBooksByCategory: Successfully retrieved books by category", zap.String("category", category), zap.Int("count", len(books)))
	return books, nil
}

// GetBooksByAuthor retrieves books by author
func (s *BookService) GetBooksByAuthor(author string) ([]models.Book, error) {
	var books []models.Book
	if err := s.db.Preload("Authors").Preload("Categories").
		Joins("JOIN book_authors ON books.id = book_authors.book_id").
		Joins("JOIN authors ON book_authors.author_id = authors.id").
		Where("LOWER(authors.name) LIKE ?", "%"+strings.ToLower(author)+"%").
		Find(&books).Error; err != nil {
		zap.L().Error("GetBooksByAuthor: Failed to retrieve books by author", zap.String("author", author), zap.Error(err))
		return nil, err
	}
	zap.L().Info("GetBooksByAuthor: Successfully retrieved books by author", zap.String("author", author), zap.Int("count", len(books)))
	return books, nil
}

func (s *BookService) BulkCreateBooks(books []models.Book) error {
	if err := s.db.Transaction(func(tx *gorm.DB) error {
		for _, book := range books {
			if err := s.CreateBook(&book); err != nil {
				zap.L().Error("BulkCreateBooks: Failed to create book in transaction", zap.String("title", book.Title), zap.Error(err))
				return err
			}
		}
		return nil
	}); err != nil {
		zap.L().Error("BulkCreateBooks: Transaction failed", zap.Error(err))
		return err
	}
	zap.L().Info("BulkCreateBooks: Successfully bulk created books", zap.Int("count", len(books)))
	return nil
}

// GetAuthor retrieves an author by ID
func (s *BookService) GetAuthor(id string) (*models.Author, error) {
	var author models.Author
	if err := s.db.First(&author, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			zap.L().Warn("GetAuthor (BookService): Author not found", zap.String("id", id))
			return nil, errors.New("author not found")
		}
		zap.L().Error("GetAuthor (BookService): Failed to retrieve author", zap.String("id", id), zap.Error(err))
		return nil, err
	}
	zap.L().Info("GetAuthor (BookService): Successfully retrieved author", zap.String("id", id), zap.String("name", author.Name))
	return &author, nil
}

// GetCategory retrieves a category by ID
func (s *BookService) GetCategory(id string) (*models.Category, error) {
	var category models.Category
	if err := s.db.First(&category, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			zap.L().Warn("GetCategory (BookService): Category not found", zap.String("id", id))
			return nil, errors.New("category not found")
		}
		zap.L().Error("GetCategory (BookService): Failed to retrieve category", zap.String("id", id), zap.Error(err))
		return nil, err
	}
	zap.L().Info("GetCategory (BookService): Successfully retrieved category", zap.String("id", id), zap.String("name", category.Name))
	return &category, nil
}
