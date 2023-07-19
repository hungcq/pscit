package business_logic

import "author-service/internal/models"

type AuthorService struct {
	AuthorRepository AuthorRepository
}

func (service *AuthorService) GetAuthors(authorIds []int) ([]*models.Author, error) {
	return service.AuthorRepository.GetAuthors(authorIds)
}

func (service *AuthorService) CreateAuthor(book *models.Author) (int, error) {
	return service.AuthorRepository.CreateAuthor(book)
}

func (service *AuthorService) UpdateAuthor(book *models.Author) error {
	return service.AuthorRepository.UpdateAuthor(book)
}

func (service *AuthorService) DeleteAuthor(bookId int) error {
	return service.AuthorRepository.DeleteAuthor(bookId)
}

type AuthorRepository interface {
	GetAuthors(authorIds []int) ([]*models.Author, error)
	CreateAuthor(author *models.Author) (int, error)
	UpdateAuthor(author *models.Author) error
	DeleteAuthor(authorId int) error
}
