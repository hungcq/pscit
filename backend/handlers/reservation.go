package handlers

import (
	"net/http"
	"strconv"
	"time"

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
	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req struct {
		BookCopyID               string   `json:"book_copy_id" binding:"required"`
		StartDate                string   `json:"start_date" binding:"required"`
		EndDate                  string   `json:"end_date" binding:"required"`
		SuggestedPickupTimeslots []string `json:"suggested_pickup_timeslots" binding:"required,min=1"`
		SuggestedReturnTimeslots []string `json:"suggested_return_timeslots" binding:"required,min=1"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse dates
	startDate, err := time.Parse(time.RFC3339, req.StartDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid start date format"})
		return
	}

	endDate, err := time.Parse(time.RFC3339, req.EndDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid end date format"})
		return
	}

	// Validate timeslots
	for _, slot := range req.SuggestedPickupTimeslots {
		timeslot, err := time.Parse(time.RFC3339, slot)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid timeslot format"})
			return
		}
		// Validate timeslot is in 30-minute blocks
		if timeslot.Minute() != 0 && timeslot.Minute() != 30 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "timeslots must be in 30-minute blocks"})
			return
		}
	}

	// Validate timeslots
	for _, slot := range req.SuggestedReturnTimeslots {
		timeslot, err := time.Parse(time.RFC3339, slot)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid timeslot format"})
			return
		}
		// Validate timeslot is in 30-minute blocks
		if timeslot.Minute() != 0 && timeslot.Minute() != 30 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "timeslots must be in 30-minute blocks"})
			return
		}
	}

	reservation, err := h.reservationService.CreateReservation(
		userID.(string), req.BookCopyID, startDate, endDate, req.SuggestedPickupTimeslots, req.SuggestedReturnTimeslots,
	)
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

	// Get filter parameters
	filters := map[string]string{
		"email":      c.Query("email"),
		"status":     c.Query("status"),
		"book_title": c.Query("book_title"),
	}

	reservations, total, err := h.reservationService.GetReservations(page, limit, filters)
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

// UpdateReservationStatus handles updating a reservation's status
func (h *ReservationHandler) UpdateReservationStatus(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "reservation ID is required"})
		return
	}

	var req struct {
		Status     models.ReservationStatus `json:"status" binding:"required,oneof=pending approved rejected returned"`
		PickupTime string                   `json:"pickup_time,omitempty"`
		ReturnTime string                   `json:"return_time,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// If status is approved, require a pickup slot
	if req.Status == models.ReservationStatusApproved && (req.PickupTime == "" || req.ReturnTime == "") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "pickup slot is required when approving a reservation"})
		return
	}

	// Parse pickup slot if provided
	var pickupSlot time.Time
	var err error
	if req.PickupTime != "" {
		pickupSlot, err = time.Parse(time.RFC3339, req.PickupTime)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid pickup time format"})
			return
		}
	}

	// Parse pickup slot if provided
	var returnSlot time.Time
	if req.ReturnTime != "" {
		returnSlot, err = time.Parse(time.RFC3339, req.ReturnTime)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid return time format"})
			return
		}
	}

	reservation, err := h.reservationService.UpdateReservationStatus(id, req.Status, pickupSlot, returnSlot)
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
