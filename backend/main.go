package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/hungcq/pscit/backend/config"
	"github.com/hungcq/pscit/backend/routes"
)

func main() {
	// Initialize database
	db := config.InitDB()

	// Create Gin router
	r := gin.Default()

	// Setup CORS
	r.Use(config.CORSMiddleware())

	// Initialize routes
	routes.SetupRoutes(r, db)

	// Start server
	if err := r.Run(":" + config.AppConfig.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
