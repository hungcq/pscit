package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/hungcq/pscit/backend/handlers"
	"github.com/hungcq/pscit/backend/middleware"
	"github.com/hungcq/pscit/backend/services"
	"gorm.io/gorm"
)

func SetupRoutes(r *gin.Engine, db *gorm.DB) {
	// Initialize services
	authService := services.NewAuthService(db)
	bookService := services.NewBookService(db)
	bookCopyService := services.NewBookCopyService(db)
	reservationService := services.NewReservationService(db)
	emailService := services.NewEmailService()
	authorService := services.NewAuthorService(db)
	categoryService := services.NewCategoryService(db)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	bookHandler := handlers.NewBookHandler(bookService)
	bookCopyHandler := handlers.NewBookCopyHandler(bookCopyService)
	reservationHandler := handlers.NewReservationHandler(reservationService, emailService)
	authorHandler := handlers.NewAuthorHandler(authorService)
	categoryHandler := handlers.NewCategoryHandler(categoryService)

	// Custom 404 handler
	r.NoRoute(func(c *gin.Context) {
		c.JSON(404, gin.H{
			"error":   "Route not found",
			"message": "The requested endpoint does not exist",
			"path":    c.Request.URL.Path,
		})
	})

	// Public routes
	api := r.Group("/api")
	api.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "healthy",
		})
	})
	api.POST("/auth/google/callback", authHandler.GoogleCallback)

	// Book routes
	api.GET("/books", bookHandler.GetBooks)
	api.GET("/books/search", bookHandler.SearchBooks)
	api.GET("/books/:id", bookHandler.GetBook)

	// Book copy routes
	api.GET("/books/:id/copies", bookCopyHandler.GetBookCopies)
	api.GET("/books/copies/:id", bookCopyHandler.GetBookCopy)

	// Author routes
	api.GET("/authors", authorHandler.GetAuthors)
	api.GET("/authors/:id", authorHandler.GetAuthor)

	// Categories routes
	api.GET("/categories", categoryHandler.GetCategories)
	api.GET("/categories/:id", categoryHandler.GetCategory)

	// Protected routes
	authenticatedApi := api.Use(middleware.AuthMiddleware())

	// Reservation routes
	authenticatedApi.POST("/reservations", reservationHandler.CreateReservation)
	authenticatedApi.GET("/reservations/user", reservationHandler.GetUserReservations)
	authenticatedApi.GET("/reservations/:id", reservationHandler.GetReservation)

	// Admin routes
	admin := authenticatedApi.Use(middleware.AdminMiddleware())
	{
		// Book management
		admin.POST("/books", bookHandler.CreateBook)
		admin.POST("/books/bulk", bookHandler.BulkCreateBooks)
		admin.PUT("/books/:id", bookHandler.UpdateBook)
		admin.DELETE("/books/:id", bookHandler.DeleteBook)

		// Author management
		admin.POST("/authors", authorHandler.CreateAuthor)
		admin.PUT("/authors/:id", authorHandler.UpdateAuthor)
		admin.DELETE("/authors/:id", authorHandler.DeleteAuthor)

		// Category management
		admin.POST("/categories", categoryHandler.CreateCategory)
		admin.PUT("/categories/:id", categoryHandler.UpdateCategory)
		admin.DELETE("/categories/:id", categoryHandler.DeleteCategory)

		// Reservation management
		admin.GET("/reservations", reservationHandler.GetReservations)
		admin.PATCH("/reservations/:id/status", reservationHandler.UpdateReservationStatus)

		// Book copy management
		admin.POST("/books/:bookId/copies", bookCopyHandler.CreateBookCopy)
		admin.POST("/books/:bookId/copies/bulk", bookCopyHandler.BulkCreateBookCopies)
		admin.PUT("/books/copies/:id", bookCopyHandler.UpdateBookCopy)
		admin.DELETE("/books/copies/:id", bookCopyHandler.DeleteBookCopy)
		admin.PUT("/books/copies/:id/availability", bookCopyHandler.UpdateBookCopyAvailability)
	}
}
