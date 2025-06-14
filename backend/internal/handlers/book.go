package handlers

import (
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/hungcq/pscit/backend/internal/models"
	"github.com/hungcq/pscit/backend/internal/services"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type BookHandler struct {
	bookService *services.BookService
	tagService  *services.TagService
}

func NewBookHandler(bookService *services.BookService, db *gorm.DB) *BookHandler {
	return &BookHandler{
		bookService: bookService,
		tagService:  services.NewTagService(db),
	}
}

func (h *BookHandler) GetBooks(c *gin.Context) {
	query := c.Query("query")
	category := c.Query("category")
	author, err := url.QueryUnescape(c.Query("author"))
	if err != nil {
		zap.L().Error("GetBooks: Invalid author parameter", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid author parameter"})
		return
	}
	language := c.Query("language")
	tagKey := c.Query("tag_key")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	sortField := c.Query("sortField")
	sortOrder := c.Query("sortOrder")

	books, total, err := h.bookService.GetBooks(query, category, author, language, tagKey, page, limit, sortField, sortOrder)
	if err != nil {
		zap.L().Error("GetBooks: Failed to get books", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"books": books,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *BookHandler) GetBook(c *gin.Context) {
	id := c.Param("id")
	book, err := h.bookService.GetBook(id)
	if err != nil {
		zap.L().Error("GetBook: Book not found", zap.String("id", id), zap.Error(err))
		c.JSON(http.StatusNotFound, gin.H{"error": "book not found"})
		return
	}

	c.JSON(http.StatusOK, book)
}

func (h *BookHandler) CreateBook(c *gin.Context) {
	var req models.CreateBookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		zap.L().Error("CreateBook: Invalid request body", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Convert request to Book model
	book := &models.Book{
		Title:          req.Title,
		Subtitle:       req.Subtitle,
		Description:    strings.ReplaceAll(req.Description, "\r\n", "\n"),
		ISBN10:         req.ISBN10,
		ISBN13:         req.ISBN13,
		PublishedYear:  req.PublishedYear,
		PageCount:      req.PageCount,
		Publisher:      req.Publisher,
		GoogleVolumeID: req.GoogleVolumeID,
		MainImage:      req.MainImage,
		Format:         req.Format,
	}

	// Load authors
	book.Authors = make([]models.Author, len(req.AuthorIDs))
	for i, id := range req.AuthorIDs {
		author, err := h.bookService.GetAuthor(id)
		if err != nil {
			zap.L().Error("CreateBook: Author not found", zap.String("authorID", id), zap.Error(err))
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("author not found: %s", id)})
			return
		}
		book.Authors[i] = *author
	}

	// Load categories
	book.Categories = make([]models.Category, len(req.CategoryIDs))
	for i, id := range req.CategoryIDs {
		category, err := h.bookService.GetCategory(id)
		if err != nil {
			zap.L().Error("CreateBook: Category not found", zap.String("categoryID", id), zap.Error(err))
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("category not found: %s", id)})
			return
		}
		book.Categories[i] = *category
	}

	// Load tags
	book.Tags = make([]models.Tag, len(req.TagIDs))
	for i, id := range req.TagIDs {
		tag, err := h.tagService.GetTag(id)
		if err != nil {
			zap.L().Error("CreateBook: Tag not found", zap.String("tagID", id), zap.Error(err))
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("tag not found: %s", id)})
			return
		}
		book.Tags[i] = *tag
	}

	if err := h.bookService.CreateBook(book); err != nil {
		zap.L().Error("CreateBook: Failed to create book", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, book)
}

func (h *BookHandler) UpdateBook(c *gin.Context) {
	id := c.Param("id")
	var req models.CreateBookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		zap.L().Error("UpdateBook: Invalid request body", zap.String("id", id), zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get existing book
	existingBook, err := h.bookService.GetBook(id)
	if err != nil {
		zap.L().Error("UpdateBook: Book not found", zap.String("id", id), zap.Error(err))
		c.JSON(http.StatusNotFound, gin.H{"error": "book not found"})
		return
	}

	// Update book fields
	existingBook.Title = req.Title
	existingBook.Subtitle = req.Subtitle
	existingBook.Description = strings.ReplaceAll(req.Description, "\r\n", "\n")
	existingBook.ISBN10 = req.ISBN10
	existingBook.ISBN13 = req.ISBN13
	existingBook.PublishedYear = req.PublishedYear
	existingBook.PageCount = req.PageCount
	existingBook.Publisher = req.Publisher
	existingBook.GoogleVolumeID = req.GoogleVolumeID
	existingBook.MainImage = req.MainImage
	existingBook.Format = req.Format

	// Load authors
	existingBook.Authors = make([]models.Author, len(req.AuthorIDs))
	for i, authorID := range req.AuthorIDs {
		author, err := h.bookService.GetAuthor(authorID)
		if err != nil {
			zap.L().Error("UpdateBook: Author not found", zap.String("bookID", id), zap.String("authorID", authorID), zap.Error(err))
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("author not found: %s", authorID)})
			return
		}
		existingBook.Authors[i] = *author
	}

	// Load categories
	existingBook.Categories = make([]models.Category, len(req.CategoryIDs))
	for i, categoryID := range req.CategoryIDs {
		category, err := h.bookService.GetCategory(categoryID)
		if err != nil {
			zap.L().Error("UpdateBook: Category not found", zap.String("bookID", id), zap.String("categoryID", categoryID), zap.Error(err))
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("category not found: %s", categoryID)})
			return
		}
		existingBook.Categories[i] = *category
	}

	// Load tags
	existingBook.Tags = make([]models.Tag, len(req.TagIDs))
	for i, tagID := range req.TagIDs {
		tag, err := h.tagService.GetTag(tagID)
		if err != nil {
			zap.L().Error("UpdateBook: Tag not found", zap.String("bookID", id), zap.String("tagID", tagID), zap.Error(err))
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("tag not found: %s", tagID)})
			return
		}
		existingBook.Tags[i] = *tag
	}

	if err := h.bookService.UpdateBook(id, existingBook); err != nil {
		zap.L().Error("UpdateBook: Failed to update book", zap.String("id", id), zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, existingBook)
}

func (h *BookHandler) DeleteBook(c *gin.Context) {
	id := c.Param("id")
	if err := h.bookService.DeleteBook(id); err != nil {
		zap.L().Error("DeleteBook: Failed to delete book", zap.String("id", id), zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *BookHandler) SearchBooks(c *gin.Context) {
	query := c.Query("q")
	books, err := h.bookService.SearchBooks(query)
	if err != nil {
		zap.L().Error("SearchBooks: Failed to search books", zap.String("query", query), zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, books)
}

func (h *BookHandler) BulkCreateBooks(c *gin.Context) {
	var books []models.Book
	if err := c.ShouldBindJSON(&books); err != nil {
		zap.L().Error("BulkCreateBooks: Invalid request body", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.bookService.BulkCreateBooks(books); err != nil {
		zap.L().Error("BulkCreateBooks: Failed to bulk create books", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Books created successfully",
		"count":   len(books),
	})
}
