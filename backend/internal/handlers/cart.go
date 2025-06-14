package handlers

import (
	"net/http"

	"github.com/hungcq/pscit/backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/hungcq/pscit/backend/internal/services"
	"go.uber.org/zap"
)

type CartHandler struct {
	cartService *services.CartService
}

func NewCartHandler(cartService *services.CartService) *CartHandler {
	return &CartHandler{
		cartService: cartService,
	}
}

// GetCart handles getting the user's cart
func (h *CartHandler) GetCart(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		zap.L().Error("GetCart: User ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	items, err := h.cartService.GetCartItems(userID.(string))
	if err != nil {
		zap.L().Error("GetCart: Failed to get cart items", zap.String("userID", userID.(string)), zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, items)
}

// AddToCart handles adding a book copy to the cart
func (h *CartHandler) AddToCart(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		zap.L().Error("AddToCart: User ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req models.CartRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		zap.L().Error("AddToCart: Invalid request body", zap.String("userID", userID.(string)), zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.cartService.AddToCart(userID.(string), req.BookCopyID); err != nil {
		zap.L().Error("AddToCart: Failed to add to cart", zap.String("userID", userID.(string)), zap.String("bookCopyID", req.BookCopyID), zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Book copy added to cart"})
}

// RemoveFromCart handles removing a book copy from the cart
func (h *CartHandler) RemoveFromCart(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		zap.L().Error("RemoveFromCart: User ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	bookCopyID := c.Param("id")
	if bookCopyID == "" {
		zap.L().Error("RemoveFromCart: Book copy ID is required", zap.String("userID", userID.(string)))
		c.JSON(http.StatusBadRequest, gin.H{"error": "book copy ID is required"})
		return
	}

	if err := h.cartService.RemoveFromCart(userID.(string), bookCopyID); err != nil {
		zap.L().Error("RemoveFromCart: Failed to remove from cart", zap.String("userID", userID.(string)), zap.String("bookCopyID", bookCopyID), zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Book copy removed from cart"})
}

// ClearCart handles clearing the user's cart
func (h *CartHandler) ClearCart(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		zap.L().Error("ClearCart: User ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	if err := h.cartService.ClearCartTx(nil, userID.(string)); err != nil {
		zap.L().Error("ClearCart: Failed to clear cart", zap.String("userID", userID.(string)), zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cart cleared"})
}
