package config

import (
	"fmt"
	models2 "github.com/hungcq/pscit/backend/internal/models"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func InitDB() *gorm.DB {
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s",
		AppConfig.DBHost,
		AppConfig.DBUser,
		AppConfig.DBPassword,
		AppConfig.DBName,
		AppConfig.DBPort,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Auto-migrate the schema
	db.AutoMigrate(
		&models2.User{},
		&models2.Author{},
		&models2.Category{},
		&models2.Book{},
		&models2.BookCopy{},
		&models2.Reservation{},
		&models2.FAQ{},
	)

	return db
}
