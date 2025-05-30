package handlers

import (
	"github.com/hungcq/pscit/backend/config"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/hungcq/pscit/backend/services"
	"google.golang.org/api/idtoken"
)

type AuthHandler struct {
	authService *services.AuthService
}

func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
	}
}

func (h *AuthHandler) GoogleCallback(c *gin.Context) {
	ctx := c.Request.Context()
	payload, err := idtoken.Validate(ctx, c.Query("code"), config.AppConfig.GoogleClientID)
	if err != nil {
		log.Printf("GoogleCallback: Token exchange failed: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "token_exchange_failed"})
		return
	}

	// Get or create user
	user, err := h.authService.GetOrCreateUser(
		payload.Claims["email"].(string),
		payload.Claims["name"].(string),
		payload.Claims["sub"].(string),
	)
	if err != nil {
		log.Printf("GoogleCallback: Failed to get/create user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "user_creation_failed"})
		return
	}

	// Generate JWT token
	token, err := h.authService.GenerateToken(user.ID, user.Email, user.Role)
	if err != nil {
		log.Printf("GoogleCallback: Failed to generate JWT token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token_generation_failed"})
		return
	}

	// Return token and user role
	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  user,
	})
}
