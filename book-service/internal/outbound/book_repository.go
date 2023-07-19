package outbound

import (
	"book-service/internal/models"
	"fmt"
	"gorm.io/gorm"
)

type BookRepository struct {
}

func (repo *BookRepository) GetBook(bookId int) (*models.Book, error) {
	book := &models.Book{}
	err := db.Table("books").First(book, bookId).Error
	if err != nil {
		return nil, fmt.Errorf("get book by id %d error: %v", bookId, err)
	}

	var mappings []models.BookAuthorMapping
	err = db.Table("book_author_mapping").Select("author_id").Where("book_id = ?", bookId).Find(&mappings).Error
	if err != nil {
		return nil, fmt.Errorf("get authors by book id %d error: %v", bookId, err)
	}
	for _, m := range mappings {
		book.AuthorIds = append(book.AuthorIds, m.AuthorId)
	}
	return book, nil
}

func (repo *BookRepository) CreateBook(book *models.Book) (int, error) {
	err := db.Transaction(func(tx *gorm.DB) error {
		err := db.Table("books").Create(book).Error
		if err != nil {
			return err
		}
		var mappings []models.BookAuthorMapping
		for _, authorId := range book.AuthorIds {
			mappings = append(mappings, models.BookAuthorMapping{
				BookId:   book.Id,
				AuthorId: authorId,
			})
		}
		err = db.Table("book_author_mapping").Create(&mappings).Error
		if err != nil {
			return err
		}
		var tagMappings []models.BookTagMapping
		for _, tagId := range book.TagIds {
			tagMappings = append(tagMappings, models.BookTagMapping{
				BookId: book.Id,
				TagId:  tagId,
			})
		}
		return db.Table("book_tag_mapping").Create(&tagMappings).Error
	})
	return book.Id, err
}

func (repo *BookRepository) UpdateBook(book *models.Book) error {
	err := db.Transaction(func(tx *gorm.DB) error {
		err := db.Table("books").Updates(book).Error
		if err != nil {
			return fmt.Errorf("update book by book id %d error: %v", book.Id, err)
		}
		err = db.Table("book_author_mapping").Where("book_id = ?", book.Id).Delete(&models.BookAuthorMapping{}).Error
		if err != nil {
			return fmt.Errorf("get authors by book id %d error: %v", book.Id, err)
		}
		var mappings []models.BookAuthorMapping
		for _, authorId := range book.AuthorIds {
			mapping := models.BookAuthorMapping{
				BookId:   book.Id,
				AuthorId: authorId,
			}
			mappings = append(mappings, mapping)
		}
		err = db.Table("book_author_mapping").Create(&mappings).Error
		if err != nil {
			return fmt.Errorf("update mapping error %v error: %v", mappings, err)
		}
		return nil
	})
	return err
}

func (repo *BookRepository) DeleteBook(bookId int) error {
	return db.Transaction(func(tx *gorm.DB) error {
		err := db.Table("books").Delete(&models.Book{Id: bookId}).Error
		if err != nil {
			return err
		}
		err = db.Table("book_author_mapping").Where("book_id = ?", bookId).
			Delete(&models.BookAuthorMapping{}).Error
		if err != nil {
			return fmt.Errorf("get authors by book id %d error: %v", bookId, err)
		}
		return nil
	})
}
