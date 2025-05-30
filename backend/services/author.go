package services

import (
	"errors"

	"github.com/hungcq/pscit/backend/models"
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
	return authors, err
}

func (s *AuthorService) GetAuthor(id string) (*models.Author, error) {
	var author models.Author
	if err := s.db.First(&author, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("author not found")
		}
		return nil, err
	}
	return &author, nil
}

func (s *AuthorService) CreateAuthor(author *models.Author) error {
	return s.db.Create(author).Error
}

func (s *AuthorService) UpdateAuthor(id string, author *models.Author) error {
	result := s.db.Model(&models.Author{}).Where("id = ?", id).Updates(map[string]interface{}{
		"name":      author.Name,
		"biography": author.Biography,
	})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("author not found")
	}
	return nil
}

func (s *AuthorService) DeleteAuthor(id string) error {
	result := s.db.Delete(&models.Author{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("author not found")
	}
	return nil
}
