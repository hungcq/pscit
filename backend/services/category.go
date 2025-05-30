package services

import (
	"errors"

	"github.com/hungcq/pscit/backend/models"
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
	err := s.db.Find(&categories).Error
	return categories, err
}

func (s *CategoryService) GetCategory(id string) (*models.Category, error) {
	var category models.Category
	if err := s.db.First(&category, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("category not found")
		}
		return nil, err
	}
	return &category, nil
}

func (s *CategoryService) CreateCategory(category *models.Category) error {
	return s.db.Create(category).Error
}

func (s *CategoryService) UpdateCategory(id string, category *models.Category) error {
	result := s.db.Model(&models.Category{}).Where("id = ?", id).Updates(map[string]interface{}{
		"name":        category.Name,
		"description": category.Description,
	})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("category not found")
	}
	return nil
}

func (s *CategoryService) DeleteCategory(id string) error {
	result := s.db.Delete(&models.Category{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("category not found")
	}
	return nil
}
