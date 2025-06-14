package handlers

import (
	"net/http"

	"github.com/hungcq/pscit/backend/internal/models"
	"github.com/hungcq/pscit/backend/internal/services"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type CategoryHandler struct {
	categoryService *services.CategoryService
}

func NewCategoryHandler(categoryService *services.CategoryService) *CategoryHandler {
	return &CategoryHandler{
		categoryService: categoryService,
	}
}

func (h *CategoryHandler) GetCategories(c *gin.Context) {
	categories, err := h.categoryService.GetCategories()
	if err != nil {
		zap.L().Error("GetCategories: Failed to get categories", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, categories)
}

func (h *CategoryHandler) GetCategory(c *gin.Context) {
	id := c.Param("id")
	category, err := h.categoryService.GetCategory(id)
	if err != nil {
		zap.L().Error("GetCategory: Category not found", zap.String("id", id), zap.Error(err))
		c.JSON(http.StatusNotFound, gin.H{"error": "category not found"})
		return
	}

	c.JSON(http.StatusOK, category)
}

func (h *CategoryHandler) CreateCategory(c *gin.Context) {
	var category models.Category
	if err := c.ShouldBindJSON(&category); err != nil {
		zap.L().Error("CreateCategory: Invalid request body", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.categoryService.CreateCategory(&category); err != nil {
		zap.L().Error("CreateCategory: Failed to create category", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, category)
}

func (h *CategoryHandler) UpdateCategory(c *gin.Context) {
	id := c.Param("id")
	var category models.Category
	if err := c.ShouldBindJSON(&category); err != nil {
		zap.L().Error("UpdateCategory: Invalid request body", zap.String("id", id), zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.categoryService.UpdateCategory(id, &category); err != nil {
		zap.L().Error("UpdateCategory: Failed to update category", zap.String("id", id), zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, category)
}

func (h *CategoryHandler) DeleteCategory(c *gin.Context) {
	id := c.Param("id")
	if err := h.categoryService.DeleteCategory(id); err != nil {
		zap.L().Error("DeleteCategory: Failed to delete category", zap.String("id", id), zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}
