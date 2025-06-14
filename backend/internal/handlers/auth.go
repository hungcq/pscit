package handlers

import (
	"net/http"

	"github.com/hungcq/pscit/backend/internal/config"
	"github.com/hungcq/pscit/backend/internal/services"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"google.golang.org/api/idtoken"
)

type AuthHandler struct {
	authService *services.AuthService
}

type GoogleCallbackRequest struct {
	Credential string `json:"credential" binding:"required"`
}

func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
	}
}

func (h *AuthHandler) GoogleCallback(c *gin.Context) {
	var req GoogleCallbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		zap.L().Error("GoogleCallback: Invalid request body", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_request"})
		return
	}

	ctx := c.Request.Context()
	payload, err := idtoken.Validate(ctx, req.Credential, config.AppConfig.GoogleClientID)
	if err != nil {
		zap.L().Error("GoogleCallback: Token exchange failed", zap.Error(err))
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
		zap.L().Error("GoogleCallback: Failed to get/create user", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "user_creation_failed"})
		return
	}

	// Generate JWT token
	token, err := h.authService.GenerateToken(user.ID, user.Email, user.Role)
	if err != nil {
		zap.L().Error("GoogleCallback: Failed to generate JWT token", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token_generation_failed"})
		return
	}

	// Return token and user role
	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  user,
	})
}
