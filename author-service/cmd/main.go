package main

import (
	"author-service/internal/business_logic"
	"author-service/internal/inbound"
	"author-service/internal/outbound"
)

func main() {
	outbound.InitMySqlDb()

	authorRepo := &outbound.AuthorRepository{}
	authorService := &business_logic.AuthorService{AuthorRepository: authorRepo}
	restController := &inbound.RestController{AuthorService: authorService}
	restController.Init()
}
