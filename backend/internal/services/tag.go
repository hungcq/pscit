package services

import (
	"errors"

	"github.com/hungcq/pscit/backend/internal/models"
	"go.uber.org/zap"
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
	if err := s.db.Order("name ASC").Find(&tags).Error; err != nil {
		zap.L().Error("GetTags: Failed to retrieve tags", zap.Error(err))
		return nil, err
	}
	zap.L().Info("GetTags: Successfully retrieved tags", zap.Int("count", len(tags)))
	return tags, nil
}

func (s *TagService) GetTag(id string) (*models.Tag, error) {
	var tag models.Tag
	if err := s.db.First(&tag, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			zap.L().Warn("GetTag: Tag not found", zap.String("id", id))
			return nil, errors.New("tag not found")
		}
		zap.L().Error("GetTag: Failed to retrieve tag", zap.String("id", id), zap.Error(err))
		return nil, err
	}
	zap.L().Info("GetTag: Successfully retrieved tag", zap.String("id", id), zap.String("name", tag.Name))
	return &tag, nil
}

func (s *TagService) CreateTag(tag *models.Tag) error {
	if err := s.db.Create(tag).Error; err != nil {
		zap.L().Error("CreateTag: Failed to create tag", zap.String("name", tag.Name), zap.Error(err))
		return err
	}
	zap.L().Info("CreateTag: Tag created successfully", zap.String("id", tag.ID.String()), zap.String("name", tag.Name))
	return nil
}

func (s *TagService) UpdateTag(id string, tag *models.Tag) error {
	result := s.db.Model(&models.Tag{}).Where("id = ?", id).Updates(map[string]interface{}{
		"key":         tag.Key,
		"name":        tag.Name,
		"description": tag.Description,
	})
	if result.Error != nil {
		zap.L().Error("UpdateTag: Failed to update tag", zap.String("id", id), zap.Error(result.Error))
		return result.Error
	}
	if result.RowsAffected == 0 {
		zap.L().Warn("UpdateTag: Tag not found for update", zap.String("id", id))
		return errors.New("tag not found")
	}
	zap.L().Info("UpdateTag: Tag updated successfully", zap.String("id", id), zap.String("name", tag.Name))
	return nil
}

func (s *TagService) DeleteTag(id string) error {
	result := s.db.Unscoped().Delete(&models.Tag{}, "id = ?", id)
	if result.Error != nil {
		zap.L().Error("DeleteTag: Failed to delete tag", zap.String("id", id), zap.Error(result.Error))
		return result.Error
	}
	if result.RowsAffected == 0 {
		zap.L().Warn("DeleteTag: Tag not found for deletion", zap.String("id", id))
		return errors.New("tag not found")
	}
	zap.L().Info("DeleteTag: Tag deleted successfully", zap.String("id", id))
	return nil
}
