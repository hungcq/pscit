package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/hungcq/pscit/backend/models"
	"github.com/hungcq/pscit/backend/services"
)

type ReservationHandler struct {
	reservationService *services.ReservationService
	emailService       *services.EmailService
}

func NewReservationHandler(reservationService *services.ReservationService, emailService *services.EmailService) *ReservationHandler {
	return &ReservationHandler{
		reservationService: reservationService,
		emailService:       emailService,
	}
}

// CreateReservation handles the creation of a new reservation
func (h *ReservationHandler) CreateReservation(c *gin.Context) {
	var req models.CreateReservationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	reservation, err := h.reservationService.CreateReservation(userID.(string), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Send email notifications
	if err := h.emailService.SendReservationNotification(reservation); err != nil {
		// Log error but don't fail the request
		c.JSON(http.StatusOK, gin.H{
			"message":     "Reservation created but email notification failed",
			"reservation": reservation,
		})
		return
	}

	c.JSON(http.StatusCreated, reservation)
}

// GetReservations handles getting all reservations (admin only)
func (h *ReservationHandler) GetReservations(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	reservations, total, err := h.reservationService.GetReservations(page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"reservations": reservations,
		"total":        total,
		"page":         page,
		"limit":        limit,
	})
}

// GetUserReservations handles getting reservations for the current user
func (h *ReservationHandler) GetUserReservations(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	reservations, total, err := h.reservationService.GetUserReservations(userID.(string), page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"reservations": reservations,
		"total":        total,
		"page":         page,
		"limit":        limit,
	})
}

// UpdateReservationStatus handles updating a reservation's status (admin only)
func (h *ReservationHandler) UpdateReservationStatus(c *gin.Context) {
	id := c.Param("id")
	var req models.UpdateReservationStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	reservation, err := h.reservationService.UpdateReservationStatus(id, req.Status)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, reservation)
}

// GetReservation handles getting a single reservation
func (h *ReservationHandler) GetReservation(c *gin.Context) {
	id := c.Param("id")
	reservation, err := h.reservationService.GetReservation(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "reservation not found"})
		return
	}

	c.JSON(http.StatusOK, reservation)
}
