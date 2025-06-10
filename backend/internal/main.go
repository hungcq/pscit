package main

import (
	"log"
	_ "time/tzdata"

	"github.com/hungcq/pscit/backend/internal/config"
	"github.com/hungcq/pscit/backend/internal/routes"

	"github.com/gin-gonic/gin"
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
