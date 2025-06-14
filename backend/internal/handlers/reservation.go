package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/hungcq/pscit/backend/internal/models"
	services2 "github.com/hungcq/pscit/backend/internal/services"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type ReservationHandler struct {
	reservationService *services2.ReservationService
	emailService       *services2.EmailService
}

func NewReservationHandler(reservationService *services2.ReservationService, emailService *services2.EmailService) *ReservationHandler {
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
		zap.L().Error("CreateReservation: User ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req models.CreateReservationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		zap.L().Error("CreateReservation: Invalid request body", zap.String("userID", userID.(string)), zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse dates
	startDate, err := time.Parse(time.RFC3339, req.StartDate)
	if err != nil {
		zap.L().Error("CreateReservation: Invalid start date format", zap.String("userID", userID.(string)), zap.String("startDate", req.StartDate), zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid start date format"})
		return
	}

	endDate, err := time.Parse(time.RFC3339, req.EndDate)
	if err != nil {
		zap.L().Error("CreateReservation: Invalid end date format", zap.String("userID", userID.(string)), zap.String("endDate", req.EndDate), zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid end date format"})
		return
	}

	// Validate timeslots
	for _, slot := range req.SuggestedPickupTimeslots {
		timeslot, err := time.Parse(time.RFC3339, slot)
		if err != nil {
			zap.L().Error("CreateReservation: Invalid pickup timeslot format", zap.String("userID", userID.(string)), zap.String("timeslot", slot), zap.Error(err))
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid timeslot format"})
			return
		}
		// Validate timeslot is in 30-minute blocks
		if timeslot.Minute() != 0 && timeslot.Minute() != 30 {
			zap.L().Error("CreateReservation: Pickup timeslot not in 30-minute blocks", zap.String("userID", userID.(string)), zap.String("timeslot", slot))
			c.JSON(http.StatusBadRequest, gin.H{"error": "timeslots must be in 30-minute blocks"})
			return
		}
	}

	// Validate timeslots
	for _, slot := range req.SuggestedReturnTimeslots {
		timeslot, err := time.Parse(time.RFC3339, slot)
		if err != nil {
			zap.L().Error("CreateReservation: Invalid return timeslot format", zap.String("userID", userID.(string)), zap.String("timeslot", slot), zap.Error(err))
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid timeslot format"})
			return
		}
		// Validate timeslot is in 30-minute blocks
		if timeslot.Minute() != 0 && timeslot.Minute() != 30 {
			zap.L().Error("CreateReservation: Return timeslot not in 30-minute blocks", zap.String("userID", userID.(string)), zap.String("timeslot", slot))
			c.JSON(http.StatusBadRequest, gin.H{"error": "timeslots must be in 30-minute blocks"})
			return
		}
	}

	reservation, err := h.reservationService.CreateReservation(
		userID.(string), startDate, endDate, req.SuggestedPickupTimeslots, req.SuggestedReturnTimeslots,
	)
	if err != nil {
		zap.L().Error("CreateReservation: Failed to create reservation", zap.String("userID", userID.(string)), zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Send email notifications
	go func() {
		if err = h.emailService.SendReservationNotification(reservation); err != nil {
			zap.L().Error("SendReservationNotification: Failed to send email notification", zap.String("reservationID", reservation.ID.String()), zap.Error(err))
		}
	}()

	c.JSON(http.StatusCreated, reservation)
}

// CheckoutCart handles creating a reservation from the user's cart
func (h *ReservationHandler) CheckoutCart(c *gin.Context) {
	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("userID")
	if !exists {
		zap.L().Error("CheckoutCart: User ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req struct {
		StartDate                string   `json:"start_date" binding:"required"`
		EndDate                  string   `json:"end_date" binding:"required"`
		SuggestedPickupTimeslots []string `json:"suggested_pickup_timeslots" binding:"required,min=1"`
		SuggestedReturnTimeslots []string `json:"suggested_return_timeslots" binding:"required,min=1"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		zap.L().Error("CheckoutCart: Invalid request body", zap.String("userID", userID.(string)), zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse dates
	startDate, err := time.Parse(time.RFC3339, req.StartDate)
	if err != nil {
		zap.L().Error("CheckoutCart: Invalid start date format", zap.String("userID", userID.(string)), zap.String("startDate", req.StartDate), zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid start date format"})
		return
	}

	endDate, err := time.Parse(time.RFC3339, req.EndDate)
	if err != nil {
		zap.L().Error("CheckoutCart: Invalid end date format", zap.String("userID", userID.(string)), zap.String("endDate", req.EndDate), zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid end date format"})
		return
	}

	// Validate timeslots
	for _, slot := range req.SuggestedPickupTimeslots {
		timeslot, err := time.Parse(time.RFC3339, slot)
		if err != nil {
			zap.L().Error("CheckoutCart: Invalid pickup timeslot format", zap.String("userID", userID.(string)), zap.String("timeslot", slot), zap.Error(err))
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid timeslot format"})
			return
		}
		// Validate timeslot is in 30-minute blocks
		if timeslot.Minute() != 0 && timeslot.Minute() != 30 {
			zap.L().Error("CheckoutCart: Pickup timeslot not in 30-minute blocks", zap.String("userID", userID.(string)), zap.String("timeslot", slot))
			c.JSON(http.StatusBadRequest, gin.H{"error": "timeslots must be in 30-minute blocks"})
			return
		}
	}

	// Validate timeslots
	for _, slot := range req.SuggestedReturnTimeslots {
		timeslot, err := time.Parse(time.RFC3339, slot)
		if err != nil {
			zap.L().Error("CheckoutCart: Invalid return timeslot format", zap.String("userID", userID.(string)), zap.String("timeslot", slot), zap.Error(err))
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid timeslot format"})
			return
		}
		// Validate timeslot is in 30-minute blocks
		if timeslot.Minute() != 0 && timeslot.Minute() != 30 {
			zap.L().Error("CheckoutCart: Return timeslot not in 30-minute blocks", zap.String("userID", userID.(string)), zap.String("timeslot", slot))
			c.JSON(http.StatusBadRequest, gin.H{"error": "timeslots must be in 30-minute blocks"})
			return
		}
	}

	reservation, err := h.reservationService.CheckoutCart(
		userID.(string), startDate, endDate, req.SuggestedPickupTimeslots, req.SuggestedReturnTimeslots,
	)
	if err != nil {
		zap.L().Error("CheckoutCart: Failed to checkout cart", zap.String("userID", userID.(string)), zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Send email notifications
	go func() {
		if err = h.emailService.SendReservationNotification(reservation); err != nil {
			zap.L().Error("SendReservationNotification: Failed to send email notification after checkout", zap.String("reservationID", reservation.ID.String()), zap.Error(err))
		}
	}()

	c.JSON(http.StatusCreated, reservation)
}

// GetReservations handles getting all reservations (admin only)
func (h *ReservationHandler) GetReservations(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	var filters models.ReservationFilters
	if err := c.ShouldBindQuery(&filters); err != nil {
		zap.L().Error("GetReservations: Invalid query parameters", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	reservations, total, err := h.reservationService.GetReservations(page, limit, filters)
	if err != nil {
		zap.L().Error("GetReservations: Failed to get reservations", zap.Error(err), zap.Int("page", page), zap.Int("limit", limit))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	zap.L().Info("GetReservations: Successfully retrieved reservations", zap.Int("total", int(total)), zap.Int("page", page), zap.Int("limit", limit))
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
		zap.L().Error("GetUserReservations: User ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	reservations, total, err := h.reservationService.GetUserReservations(userID.(string), page, limit)
	if err != nil {
		zap.L().Error("GetUserReservations: Failed to get user reservations", zap.String("userID", userID.(string)), zap.Error(err), zap.Int("page", page), zap.Int("limit", limit))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	zap.L().Info("GetUserReservations: Successfully retrieved user reservations", zap.String("userID", userID.(string)), zap.Int("total", int(total)), zap.Int("page", page), zap.Int("limit", limit))
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
		zap.L().Error("UpdateReservationStatus: Reservation ID is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "reservation ID is required"})
		return
	}

	var req models.UpdateReservationStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		zap.L().Error("UpdateReservationStatus: Invalid request body", zap.String("id", id), zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// If status is approved, require pickup and return times
	if req.Status == models.ReservationStatusApproved && (req.PickupTime == "" || req.ReturnTime == "") {
		zap.L().Error("UpdateReservationStatus: Pickup and return times are required for approved status", zap.String("id", id), zap.String("status", string(req.Status)))
		c.JSON(http.StatusBadRequest, gin.H{"error": "pickup and return times are required when approving a reservation"})
		return
	}

	// Parse pickup and return times if provided
	var pickupTime, returnTime time.Time
	var err error
	if req.PickupTime != "" {
		pickupTime, err = time.Parse(time.RFC3339, req.PickupTime)
		if err != nil {
			zap.L().Error("UpdateReservationStatus: Invalid pickup time format", zap.String("id", id), zap.String("pickupTime", req.PickupTime), zap.Error(err))
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid pickup time format"})
			return
		}
	}

	if req.ReturnTime != "" {
		returnTime, err = time.Parse(time.RFC3339, req.ReturnTime)
		if err != nil {
			zap.L().Error("UpdateReservationStatus: Invalid return time format", zap.String("id", id), zap.String("returnTime", req.ReturnTime), zap.Error(err))
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid return time format"})
			return
		}
	}

	reservation, err := h.reservationService.UpdateReservationStatus(id, req.Status, pickupTime, returnTime)
	if err != nil {
		zap.L().Error("UpdateReservationStatus: Failed to update reservation status", zap.String("id", id), zap.String("status", string(req.Status)), zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	zap.L().Info("UpdateReservationStatus: Successfully updated reservation status", zap.String("id", id), zap.String("status", string(reservation.Status)))
	c.JSON(http.StatusOK, reservation)
}

// GetReservation handles getting a single reservation
func (h *ReservationHandler) GetReservation(c *gin.Context) {
	id := c.Param("id")
	reservation, err := h.reservationService.GetReservation(id)
	if err != nil {
		zap.L().Error("GetReservation: Reservation not found", zap.String("id", id), zap.Error(err))
		c.JSON(http.StatusNotFound, gin.H{"error": "reservation not found"})
		return
	}

	zap.L().Info("GetReservation: Successfully retrieved reservation", zap.String("id", id))
	c.JSON(http.StatusOK, reservation)
}
