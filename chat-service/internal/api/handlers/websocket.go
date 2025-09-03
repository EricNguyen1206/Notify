package handlers

import (
	"chat-service/internal/websocket"
	"log/slog"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type WSHandler struct {
	hub *websocket.Hub
}

func NewWSHandler(hub *websocket.Hub) *WSHandler {
	return &WSHandler{hub: hub}
}

// validateUserID validates and sanitizes the user ID parameter
func (h *WSHandler) validateUserID(userID string) (string, error) {
	if userID == "" {
		return "", &ValidationError{Field: "userId", Message: "userId parameter is required"}
	}

	// Trim whitespace
	userID = strings.TrimSpace(userID)

	// Check if it's a valid number (assuming user IDs are numeric)
	if _, err := strconv.ParseUint(userID, 10, 64); err != nil {
		return "", &ValidationError{Field: "userId", Message: "userId must be a valid number"}
	}

	return userID, nil
}

// ValidationError represents a validation error
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

func (e *ValidationError) Error() string {
	return e.Message
}

func (h *WSHandler) HandleWebSocket(c *gin.Context) {
	clientIP := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")

	// Get userId from query parameters: /api/v1/ws?userId=1
	// TODO: Get token from query to handle jwt validation
	userID := c.Query("userId")

	// Validate user ID
	validatedUserID, err := h.validateUserID(userID)
	if err != nil {
		slog.Error("WebSocket connection failed: invalid userId",
			"userID", userID,
			"clientIP", clientIP,
			"userAgent", userAgent,
			"error", err)

		if validationErr, ok := err.(*ValidationError); ok {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": validationErr.Message,
				"field": validationErr.Field,
			})
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		}
		return
	}

	// Check for required headers follow HTTP Upgrade mechanism of RFC 7230 (HTTP/1.1).
	if c.GetHeader("Connection") != "Upgrade" || c.GetHeader("Upgrade") != "websocket" {
		slog.Error("WebSocket connection failed: missing required headers",
			"userID", validatedUserID,
			"clientIP", clientIP)
		c.JSON(http.StatusBadRequest, gin.H{"error": "WebSocket upgrade required"})
		return
	}

	websocket.ServeWS(h.hub, c.Writer, c.Request, validatedUserID)
}
