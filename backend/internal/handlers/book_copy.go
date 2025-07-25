package handlers

import (
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/hungcq/pscit/backend/internal/models"
	"github.com/hungcq/pscit/backend/internal/services"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type BookCopyHandler struct {
	bookCopyService *services.BookCopyService
}

func NewBookCopyHandler(bookCopyService *services.BookCopyService) *BookCopyHandler {
	return &BookCopyHandler{
		bookCopyService: bookCopyService,
	}
}

// GetBookCopies retrieves all copies of a book
func (h *BookCopyHandler) GetBookCopies(c *gin.Context) {
	bookID := c.Param("id")
	copies, err := h.bookCopyService.GetBookCopies(bookID)
	if err != nil {
		zap.L().Error("GetBookCopies: Failed to get book copies", zap.String("bookID", bookID), zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, copies)
}

// GetBookCopy retrieves a single book copy
func (h *BookCopyHandler) GetBookCopy(c *gin.Context) {
	id := c.Param("id")
	copy, err := h.bookCopyService.GetBookCopy(id)
	if err != nil {
		zap.L().Error("GetBookCopy: Failed to get book copy", zap.String("id", id), zap.Error(err))
		c.JSON(http.StatusNotFound, gin.H{"error": "book copy not found"})
		return
	}

	c.JSON(http.StatusOK, copy)
}

// CreateBookCopy creates a new book copy
func (h *BookCopyHandler) CreateBookCopy(c *gin.Context) {
	var copy models.BookCopy
	if err := c.ShouldBindJSON(&copy); err != nil {
		zap.L().Error("CreateBookCopy: Invalid request body", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	bookId := c.Param("bookId")
	copy.BookID = uuid.MustParse(bookId)

	if err := h.bookCopyService.CreateBookCopy(&copy); err != nil {
		zap.L().Error("CreateBookCopy: Failed to create book copy", zap.String("bookID", bookId), zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, copy)
}

// UpdateBookCopy updates an existing book copy
func (h *BookCopyHandler) UpdateBookCopy(c *gin.Context) {
	id := c.Param("id")
	var copy models.BookCopy
	if err := c.ShouldBindJSON(&copy); err != nil {
		zap.L().Error("UpdateBookCopy: Invalid request body", zap.String("id", id), zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.bookCopyService.UpdateBookCopy(id, &copy); err != nil {
		zap.L().Error("UpdateBookCopy: Failed to update book copy", zap.String("id", id), zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, copy)
}

// DeleteBookCopy deletes a book copy
func (h *BookCopyHandler) DeleteBookCopy(c *gin.Context) {
	id := c.Param("id")
	if err := h.bookCopyService.DeleteBookCopy(id); err != nil {
		zap.L().Error("DeleteBookCopy: Failed to delete book copy", zap.String("id", id), zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

// BulkCreateBookCopies creates multiple copies of a book
func (h *BookCopyHandler) BulkCreateBookCopies(c *gin.Context) {
	bookID := c.Param("bookId")

	var request struct {
		Count     int                  `json:"count"`
		Condition models.BookCondition `json:"condition"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		zap.L().Error("BulkCreateBookCopies: Invalid request body", zap.String("bookID", bookID), zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if request.Condition == "" {
		request.Condition = models.ConditionNew
	}

	if err := h.bookCopyService.BulkCreateBookCopies(bookID, request.Count, request.Condition); err != nil {
		zap.L().Error("BulkCreateBookCopies: Failed to bulk create book copies", zap.String("bookID", bookID), zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Book copies created successfully",
		"count":   request.Count,
	})
}

// UpdateBookCopyAvailability updates a book copy's availability status
func (h *BookCopyHandler) UpdateBookCopyAvailability(c *gin.Context) {
	id := c.Param("id")
	available, err := strconv.ParseBool(c.PostForm("available"))
	if err != nil {
		zap.L().Error("UpdateBookCopyAvailability: Invalid availability status", zap.String("id", id), zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid availability status"})
		return
	}

	if err := h.bookCopyService.UpdateBookCopyAvailability(id, available); err != nil {
		zap.L().Error("UpdateBookCopyAvailability: Failed to update book copy availability", zap.String("id", id), zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Book copy availability updated successfully"})
}
