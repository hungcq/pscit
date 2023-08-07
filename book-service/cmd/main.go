package main

import (
	"book-service/internal/business_logic"
	"book-service/internal/inbound"
	"book-service/internal/outbound"
	"log"
	"os"
)

func main() {
	f, err := os.OpenFile("/var/log/data.log", os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
	if err != nil {
		log.Fatalf("error opening file: %v", err)
	}
	defer f.Close()

	log.SetOutput(f)

	outbound.InitMySqlDb()
	outbound.InitHttpClient()

	bookService := &business_logic.BookService{
		BookRepository: &outbound.BookRepository{},
		AuthorService:  &outbound.AuthorServiceAccess{},
	}
	restController := &inbound.RestController{BookService: bookService}
	restController.Init()
}
