package services

import (
	"errors"

	"github.com/hungcq/pscit/backend/internal/models"

	"go.uber.org/zap"
	"gorm.io/gorm"
)

type AuthorService struct {
	db *gorm.DB
}

func NewAuthorService(db *gorm.DB) *AuthorService {
	return &AuthorService{db: db}
}

func (s *AuthorService) GetAuthors() ([]models.Author, error) {
	var authors []models.Author
	err := s.db.Find(&authors).Error
	if err != nil {
		zap.L().Error("GetAuthors: Failed to retrieve authors", zap.Error(err))
		return nil, err
	}
	zap.L().Info("GetAuthors: Successfully retrieved authors", zap.Int("count", len(authors)))
	return authors, nil
}

func (s *AuthorService) GetAuthor(id string) (*models.Author, error) {
	var author models.Author
	if err := s.db.First(&author, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			zap.L().Warn("GetAuthor: Author not found", zap.String("id", id))
			return nil, errors.New("author not found")
		}
		zap.L().Error("GetAuthor: Failed to retrieve author", zap.String("id", id), zap.Error(err))
		return nil, err
	}
	zap.L().Info("GetAuthor: Successfully retrieved author", zap.String("id", id), zap.String("name", author.Name))
	return &author, nil
}

func (s *AuthorService) CreateAuthor(author *models.Author) error {
	if err := s.db.Create(author).Error; err != nil {
		zap.L().Error("CreateAuthor: Failed to create author", zap.String("name", author.Name), zap.Error(err))
		return err
	}
	zap.L().Info("CreateAuthor: Author created successfully", zap.String("id", author.ID.String()), zap.String("name", author.Name))
	return nil
}

func (s *AuthorService) UpdateAuthor(id string, author *models.Author) error {
	result := s.db.Model(&models.Author{}).Where("id = ?", id).Updates(map[string]interface{}{
		"name":      author.Name,
		"biography": author.Biography,
	})
	if result.Error != nil {
		zap.L().Error("UpdateAuthor: Failed to update author", zap.String("id", id), zap.Error(result.Error))
		return result.Error
	}
	if result.RowsAffected == 0 {
		zap.L().Warn("UpdateAuthor: Author not found for update", zap.String("id", id))
		return errors.New("author not found")
	}
	zap.L().Info("UpdateAuthor: Author updated successfully", zap.String("id", id), zap.String("name", author.Name))
	return nil
}

func (s *AuthorService) DeleteAuthor(id string) error {
	result := s.db.Unscoped().Delete(&models.Author{}, "id = ?", id)
	if result.Error != nil {
		zap.L().Error("DeleteAuthor: Failed to delete author", zap.String("id", id), zap.Error(result.Error))
		return result.Error
	}
	if result.RowsAffected == 0 {
		zap.L().Warn("DeleteAuthor: Author not found for deletion", zap.String("id", id))
		return errors.New("author not found")
	}
	zap.L().Info("DeleteAuthor: Author deleted successfully", zap.String("id", id))
	return nil
}
