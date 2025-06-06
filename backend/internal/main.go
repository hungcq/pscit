package main

import (
	config2 "github.com/hungcq/pscit/backend/internal/config"
	"github.com/hungcq/pscit/backend/internal/routes"
	"log"

	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize database
	db := config2.InitDB()

	// Create Gin router
	r := gin.Default()

	// Setup CORS
	r.Use(config2.CORSMiddleware())

	// Initialize routes
	routes.SetupRoutes(r, db)

	// Start server
	if err := r.Run(":" + config2.AppConfig.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
