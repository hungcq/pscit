package inbound

import (
	"book-service/internal/models"
	"github.com/gin-gonic/gin"
	"log"
	"net/http"
	"strconv"
)

type RestController struct {
	BookService bookService
}

func (controller *RestController) Init() {
	router := gin.Default()

	router.GET("/hihi", func (c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"hihi": "hihi"})
	})
	router.GET("/books/:id", controller.getBook)
	router.POST("/books", controller.createBook)
	router.PUT("/books/:id", controller.updateBook)
	router.DELETE("/books/:id", controller.deleteBook)

	err := router.Run(":80")
	if err != nil {
		log.Fatalf("%v", err)
	}
}

func (controller *RestController) getBook(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logAndReturnError(c, err)
		return
	}
	var book *models.Book
	book, err = controller.BookService.GetBook(id)
	if err != nil {
		logAndReturnError(c, err)
		return
	}
	c.JSON(http.StatusOK, book)
}

func (controller *RestController) createBook(c *gin.Context) {
	book := &models.Book{}
	err := c.BindJSON(book)
	if err != nil {
		logAndReturnError(c, err)
		return
	}
	id, err := controller.BookService.CreateBook(book)
	if err != nil {
		logAndReturnError(c, err)
		return
	}
	book.Id = id
	c.JSON(http.StatusOK, book)
}

func (controller *RestController) updateBook(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logAndReturnError(c, err)
		return
	}
	book := &models.Book{}
	err = c.BindJSON(book)
	if err != nil {
		logAndReturnError(c, err)
		return
	}
	book.Id = id
	err = controller.BookService.UpdateBook(book)
	if err != nil {
		logAndReturnError(c, err)
		return
	}
	book.Id = id
	c.JSON(http.StatusOK, book)
}

func (controller *RestController) deleteBook(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logAndReturnError(c, err)
		return
	}
	err = controller.BookService.DeleteBook(id)
	if err != nil {
		logAndReturnError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{})
}

func logAndReturnError(c *gin.Context, err error) {
	log.Printf("%v", err)
	c.JSON(http.StatusInternalServerError, gin.H{
		"error": err.Error(),
	})
}

type bookService interface {
	GetBook(bookId int) (*models.Book, error)
	CreateBook(book *models.Book) (int, error)
	UpdateBook(book *models.Book) error
	DeleteBook(bookId int) error
}
