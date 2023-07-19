package main

import (
	"book-service/internal/business_logic"
	"book-service/internal/inbound"
	"book-service/internal/outbound"
)

func main() {
	outbound.InitMySqlDb()
	outbound.InitHttpClient()

	bookService := &business_logic.BookService{
		BookRepository: &outbound.BookRepository{},
		AuthorService:  &outbound.AuthorServiceAccess{},
	}
	restController := &inbound.RestController{BookService: bookService}
	restController.Init()
}
