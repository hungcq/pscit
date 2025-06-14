package routes

import (
	"github.com/gin-gonic/gin"
	handlers2 "github.com/hungcq/pscit/backend/internal/handlers"
	"github.com/hungcq/pscit/backend/internal/middleware"
	services2 "github.com/hungcq/pscit/backend/internal/services"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

func SetupRoutes(r *gin.Engine, db *gorm.DB) {
	// Initialize services
	authService := services2.NewAuthService(db)
	bookService := services2.NewBookService(db)
	bookCopyService := services2.NewBookCopyService(db)
	reservationService := services2.NewReservationService(db, services2.NewEmailService())
	emailService := services2.NewEmailService()
	authorService := services2.NewAuthorService(db)
	categoryService := services2.NewCategoryService(db)
	cartService := services2.NewCartService(db)
	tagService := services2.NewTagService(db)

	// Initialize handlers
	authHandler := handlers2.NewAuthHandler(authService)
	bookHandler := handlers2.NewBookHandler(bookService, db)
	bookCopyHandler := handlers2.NewBookCopyHandler(bookCopyService)
	reservationHandler := handlers2.NewReservationHandler(reservationService, emailService)
	authorHandler := handlers2.NewAuthorHandler(authorService)
	categoryHandler := handlers2.NewCategoryHandler(categoryService)
	cartHandler := handlers2.NewCartHandler(cartService)
	tagHandler := handlers2.NewTagHandler(tagService)

	// Custom 404 handler
	r.NoRoute(func(c *gin.Context) {
		zap.L().Error("Route not found", zap.String("path", c.Request.URL.Path))
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
	api.GET("/metrics", middleware.PrometheusHandler())
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

	// Tag routes
	api.GET("/tags", tagHandler.GetTags)
	api.GET("/tags/:id", tagHandler.GetTag)

	// Protected routes
	authenticatedApi := api.Use(middleware.AuthMiddleware())

	// Cart routes
	authenticatedApi.GET("/cart", cartHandler.GetCart)
	authenticatedApi.POST("/cart", cartHandler.AddToCart)
	authenticatedApi.DELETE("/cart/:id", cartHandler.RemoveFromCart)
	authenticatedApi.DELETE("/cart", cartHandler.ClearCart)

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

		// Tag management
		admin.POST("/tags", tagHandler.CreateTag)
		admin.PUT("/tags/:id", tagHandler.UpdateTag)
		admin.DELETE("/tags/:id", tagHandler.DeleteTag)

		// Reservation management
		admin.GET("/reservations", reservationHandler.GetReservations)
		admin.PUT("/reservations/:id/status", reservationHandler.UpdateReservationStatus)

		// Book copy management
		admin.POST("/books/:bookId/copies", bookCopyHandler.CreateBookCopy)
		admin.POST("/books/:bookId/copies/bulk", bookCopyHandler.BulkCreateBookCopies)
		admin.PUT("/books/copies/:id", bookCopyHandler.UpdateBookCopy)
		admin.DELETE("/books/copies/:id", bookCopyHandler.DeleteBookCopy)
		admin.PUT("/books/copies/:id/availability", bookCopyHandler.UpdateBookCopyAvailability)
	}
}
