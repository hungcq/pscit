package handlers

import (
	"net/http"

	"github.com/hungcq/pscit/backend/internal/models"
	"github.com/hungcq/pscit/backend/internal/services"

	"github.com/gin-gonic/gin"
)

type TagHandler struct {
	tagService *services.TagService
}

func NewTagHandler(tagService *services.TagService) *TagHandler {
	return &TagHandler{
		tagService: tagService,
	}
}

func (h *TagHandler) GetTags(c *gin.Context) {
	tags, err := h.tagService.GetTags()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tags)
}

func (h *TagHandler) GetTag(c *gin.Context) {
	id := c.Param("id")
	tag, err := h.tagService.GetTag(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "tag not found"})
		return
	}

	c.JSON(http.StatusOK, tag)
}

func (h *TagHandler) CreateTag(c *gin.Context) {
	var req models.Tag
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tag := &models.Tag{
		Key:         req.Key,
		Name:        req.Name,
		Description: req.Description,
	}

	if err := h.tagService.CreateTag(tag); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, tag)
}

func (h *TagHandler) UpdateTag(c *gin.Context) {
	id := c.Param("id")
	var req models.Tag
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get existing tag
	existingTag, err := h.tagService.GetTag(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "tag not found"})
		return
	}

	// Update tag fields
	existingTag.Key = req.Key
	existingTag.Name = req.Name
	existingTag.Description = req.Description

	if err := h.tagService.UpdateTag(id, existingTag); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, existingTag)
}

func (h *TagHandler) DeleteTag(c *gin.Context) {
	id := c.Param("id")
	if err := h.tagService.DeleteTag(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}
