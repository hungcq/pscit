package services

import (
	"errors"

	"github.com/hungcq/pscit/backend/internal/models"

	"go.uber.org/zap"
	"gorm.io/gorm"
)

type CategoryService struct {
	db *gorm.DB
}

func NewCategoryService(db *gorm.DB) *CategoryService {
	return &CategoryService{db: db}
}

func (s *CategoryService) GetCategories() ([]models.Category, error) {
	var categories []models.Category
	if err := s.db.Find(&categories).Error; err != nil {
		zap.L().Error("GetCategories: Failed to retrieve categories", zap.Error(err))
		return nil, err
	}
	zap.L().Info("GetCategories: Successfully retrieved categories", zap.Int("count", len(categories)))
	return categories, nil
}

func (s *CategoryService) GetCategory(id string) (*models.Category, error) {
	var category models.Category
	if err := s.db.First(&category, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			zap.L().Warn("GetCategory: Category not found", zap.String("id", id))
			return nil, errors.New("category not found")
		}
		zap.L().Error("GetCategory: Failed to retrieve category", zap.String("id", id), zap.Error(err))
		return nil, err
	}
	zap.L().Info("GetCategory: Successfully retrieved category", zap.String("id", id), zap.String("name", category.Name))
	return &category, nil
}

func (s *CategoryService) CreateCategory(category *models.Category) error {
	if err := s.db.Create(category).Error; err != nil {
		zap.L().Error("CreateCategory: Failed to create category", zap.String("name", category.Name), zap.Error(err))
		return err
	}
	zap.L().Info("CreateCategory: Category created successfully", zap.String("id", category.ID.String()), zap.String("name", category.Name))
	return nil
}

func (s *CategoryService) UpdateCategory(id string, category *models.Category) error {
	result := s.db.Model(&models.Category{}).Where("id = ?", id).Updates(map[string]interface{}{
		"name":        category.Name,
		"description": category.Description,
	})
	if result.Error != nil {
		zap.L().Error("UpdateCategory: Failed to update category", zap.String("id", id), zap.Error(result.Error))
		return result.Error
	}
	if result.RowsAffected == 0 {
		zap.L().Warn("UpdateCategory: Category not found for update", zap.String("id", id))
		return errors.New("category not found")
	}
	zap.L().Info("UpdateCategory: Category updated successfully", zap.String("id", id), zap.String("name", category.Name))
	return nil
}

func (s *CategoryService) DeleteCategory(id string) error {
	result := s.db.Unscoped().Delete(&models.Category{}, "id = ?", id)
	if result.Error != nil {
		zap.L().Error("DeleteCategory: Failed to delete category", zap.String("id", id), zap.Error(result.Error))
		return result.Error
	}
	if result.RowsAffected == 0 {
		zap.L().Warn("DeleteCategory: Category not found for deletion", zap.String("id", id))
		return errors.New("category not found")
	}
	zap.L().Info("DeleteCategory: Category deleted successfully", zap.String("id", id))
	return nil
}
