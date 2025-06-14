package handlers

import (
	"net/http"

	"github.com/hungcq/pscit/backend/internal/models"
	"github.com/hungcq/pscit/backend/internal/services"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type AuthorHandler struct {
	authorService *services.AuthorService
}

func NewAuthorHandler(authorService *services.AuthorService) *AuthorHandler {
	return &AuthorHandler{
		authorService: authorService,
	}
}

func (h *AuthorHandler) GetAuthors(c *gin.Context) {
	authors, err := h.authorService.GetAuthors()
	if err != nil {
		zap.L().Error("GetAuthors: Failed to get authors", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, authors)
}

func (h *AuthorHandler) GetAuthor(c *gin.Context) {
	id := c.Param("id")
	author, err := h.authorService.GetAuthor(id)
	if err != nil {
		zap.L().Error("GetAuthor: Failed to get author", zap.String("id", id), zap.Error(err))
		c.JSON(http.StatusNotFound, gin.H{"error": "author not found"})
		return
	}

	c.JSON(http.StatusOK, author)
}

func (h *AuthorHandler) CreateAuthor(c *gin.Context) {
	var author models.Author
	if err := c.ShouldBindJSON(&author); err != nil {
		zap.L().Error("CreateAuthor: Invalid request body", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.authorService.CreateAuthor(&author); err != nil {
		zap.L().Error("CreateAuthor: Failed to create author", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, author)
}

func (h *AuthorHandler) UpdateAuthor(c *gin.Context) {
	id := c.Param("id")
	var author models.Author
	if err := c.ShouldBindJSON(&author); err != nil {
		zap.L().Error("UpdateAuthor: Invalid request body", zap.String("id", id), zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.authorService.UpdateAuthor(id, &author); err != nil {
		zap.L().Error("UpdateAuthor: Failed to update author", zap.String("id", id), zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, author)
}

func (h *AuthorHandler) DeleteAuthor(c *gin.Context) {
	id := c.Param("id")
	if err := h.authorService.DeleteAuthor(id); err != nil {
		zap.L().Error("DeleteAuthor: Failed to delete author", zap.String("id", id), zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}
