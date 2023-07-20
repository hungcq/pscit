package business_logic

import (
	"book-service/internal/models"
	"log"
)

type BookService struct {
	BookRepository BookRepository
	AuthorService  AuthorService
}

func (service *BookService) GetBook(bookId int) (*models.Book, error) {
	book, err := service.BookRepository.GetBook(bookId)
	if err != nil {
		return nil, err
	}
	if len(book.AuthorIds) != 0 {
		authors, err := service.AuthorService.GetAuthorsByIds(book.AuthorIds)
		if err != nil {
			log.Printf("get book's author error. book id %d, author ids %v, error %v", bookId, book.AuthorIds, err)
			return book, nil
		}
		book.Authors = authors
	}
	return book, nil
}

func (service *BookService) CreateBook(book *models.Book) (int, error) {
	return service.BookRepository.CreateBook(book)
}

func (service *BookService) UpdateBook(book *models.Book) error {
	return service.BookRepository.UpdateBook(book)
}

func (service *BookService) DeleteBook(bookId int) error {
	return service.BookRepository.DeleteBook(bookId)
}

type BookRepository interface {
	GetBook(bookId int) (*models.Book, error)
	CreateBook(book *models.Book) (int, error)
	UpdateBook(book *models.Book) error
	DeleteBook(bookId int) error
}

type AuthorService interface {
	GetAuthorsByIds(authorIds []int) ([]*models.Author, error)
}
