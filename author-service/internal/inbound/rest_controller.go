package inbound

import (
	"author-service/internal/models"
	"github.com/gin-gonic/gin"
	"log"
	"net/http"
	"strconv"
	"strings"
)

type RestController struct {
	AuthorService authorService
}

func (controller *RestController) Init() {
	router := gin.Default()

	router.GET("/authors/:id", controller.getAuthors)
	router.POST("/authors", controller.createAuthor)
	router.PUT("/authors/:id", controller.updateAuthor)
	router.DELETE("/authors/:id", controller.deleteAuthor)

	err := router.Run(":80")
	if err != nil {
		log.Fatalf("%v", err)
	}
}

func (controller *RestController) getAuthors(c *gin.Context) {
	idStrings := strings.Split(c.Param("id"), ",")
	var ids []int
	for _, idStr := range idStrings {
		id, err := strconv.Atoi(idStr)
		if err != nil {
			logAndReturnError(c, err)
			return
		}
		ids = append(ids, id)
	}
	authors, err := controller.AuthorService.GetAuthors(ids)
	if err != nil {
		logAndReturnError(c, err)
		return
	}
	c.JSON(http.StatusOK, authors)
}

func (controller *RestController) createAuthor(c *gin.Context) {
	author := &models.Author{}
	err := c.BindJSON(author)
	if err != nil {
		logAndReturnError(c, err)
		return
	}
	id, err := controller.AuthorService.CreateAuthor(author)
	if err != nil {
		logAndReturnError(c, err)
		return
	}
	author.Id = id
	c.JSON(http.StatusOK, author)
}

func (controller *RestController) updateAuthor(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logAndReturnError(c, err)
		return
	}
	author := &models.Author{}
	err = c.BindJSON(author)
	if err != nil {
		logAndReturnError(c, err)
		return
	}
	author.Id = id
	err = controller.AuthorService.UpdateAuthor(author)
	if err != nil {
		logAndReturnError(c, err)
		return
	}
	c.JSON(http.StatusOK, author)
}

func (controller *RestController) deleteAuthor(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logAndReturnError(c, err)
		return
	}
	err = controller.AuthorService.DeleteAuthor(id)
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

type authorService interface {
	GetAuthors(authorIds []int) ([]*models.Author, error)
	CreateAuthor(author *models.Author) (int, error)
	UpdateAuthor(book *models.Author) error
	DeleteAuthor(bookId int) error
}
