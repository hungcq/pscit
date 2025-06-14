package middleware

import (
	"net/http"
	"strings"

	"github.com/hungcq/pscit/backend/internal/services"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

var authService = services.NewAuthService(nil) // We'll initialize this properly in main.go

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			zap.L().Error("AuthMiddleware: Authorization header is required")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			c.Abort()
			return
		}

		// Check if the header has the Bearer prefix
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			zap.L().Error("AuthMiddleware: Invalid authorization header format", zap.String("authHeader", authHeader))
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}

		tokenString := parts[1]
		claims, err := authService.ValidateToken(tokenString)
		if err != nil {
			zap.L().Error("AuthMiddleware: Invalid token", zap.Error(err))
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Set user information in context
		c.Set("userID", claims.UserID)
		c.Set("email", claims.Email)
		c.Set("role", claims.Role)

		c.Next()
	}
}

func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists || role != "admin" {
			zap.L().Error("AdminMiddleware: Admin access required", zap.Any("role", role))
			c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
			c.Abort()
			return
		}
		c.Next()
	}
}
