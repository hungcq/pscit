package outbound

import (
	"author-service/internal/models"
	"fmt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"log"
	"os"
)

var db *gorm.DB

func InitMySqlDb() {
	connStr := fmt.Sprintf("%s:%s@tcp(pscit-db.ceq2eokowsmi.ap-southeast-1.rds.amazonaws.com:3306)/author",
		os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"))
	var err error
	db, err = gorm.Open(mysql.Open(connStr), &gorm.Config{})
	if err != nil {
		log.Fatalf("unable to connect to DB %v", err)
	}
	fmt.Println("Connected!")
}

type AuthorRepository struct {
}

func (repo *AuthorRepository) GetAuthors(authorIds []int) ([]*models.Author, error) {
	var authors []*models.Author
	err := db.Table("authors").Find(&authors, authorIds).Error
	if err != nil {
		return nil, fmt.Errorf("get authors by ids %v error: %v", authors, err)
	}
	return authors, nil
}

func (repo *AuthorRepository) CreateAuthor(author *models.Author) (int, error) {
	err := db.Table("authors").Create(author).Error
	if err != nil {
		return 0, err
	}
	return author.Id, nil
}

func (repo *AuthorRepository) UpdateAuthor(author *models.Author) error {
	return db.Table("authors").Updates(author).Error
}

func (repo *AuthorRepository) DeleteAuthor(authorId int) error {
	return db.Table("authors").Delete(&models.Author{Id: authorId}).Error
}
