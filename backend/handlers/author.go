package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/hungcq/pscit/backend/models"
	"github.com/hungcq/pscit/backend/services"
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, authors)
}

func (h *AuthorHandler) GetAuthor(c *gin.Context) {
	id := c.Param("id")
	author, err := h.authorService.GetAuthor(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "author not found"})
		return
	}

	c.JSON(http.StatusOK, author)
}

func (h *AuthorHandler) CreateAuthor(c *gin.Context) {
	var author models.Author
	if err := c.ShouldBindJSON(&author); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.authorService.CreateAuthor(&author); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, author)
}

func (h *AuthorHandler) UpdateAuthor(c *gin.Context) {
	id := c.Param("id")
	var author models.Author
	if err := c.ShouldBindJSON(&author); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.authorService.UpdateAuthor(id, &author); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, author)
}

func (h *AuthorHandler) DeleteAuthor(c *gin.Context) {
	id := c.Param("id")
	if err := h.authorService.DeleteAuthor(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}
