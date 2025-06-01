package config

import (
	"fmt"
	"log"

	"github.com/hungcq/pscit/backend/models"
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
		&models.User{},
		&models.Author{},
		&models.Category{},
		&models.Book{},
		&models.Reservation{},
		&models.FAQ{},
		&models.BookCopy{},
	)

	return db
}
