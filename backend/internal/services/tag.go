package services

import (
	"errors"

	"github.com/hungcq/pscit/backend/internal/models"
	"gorm.io/gorm"
)

type TagService struct {
	db *gorm.DB
}

func NewTagService(db *gorm.DB) *TagService {
	return &TagService{db: db}
}

func (s *TagService) GetTags() ([]models.Tag, error) {
	var tags []models.Tag
	err := s.db.Order("name ASC").Find(&tags).Error
	return tags, err
}

func (s *TagService) GetTag(id string) (*models.Tag, error) {
	var tag models.Tag
	if err := s.db.First(&tag, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("tag not found")
		}
		return nil, err
	}
	return &tag, nil
}

func (s *TagService) CreateTag(tag *models.Tag) error {
	return s.db.Create(tag).Error
}

func (s *TagService) UpdateTag(id string, tag *models.Tag) error {
	result := s.db.Model(&models.Tag{}).Where("id = ?", id).Updates(map[string]interface{}{
		"key":         tag.Key,
		"name":        tag.Name,
		"description": tag.Description,
	})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("tag not found")
	}
	return nil
}

func (s *TagService) DeleteTag(id string) error {
	result := s.db.Unscoped().Delete(&models.Tag{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("tag not found")
	}
	return nil
}
