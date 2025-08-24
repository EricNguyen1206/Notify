package handlers

import (
	"chat-service/internal/models"
	"chat-service/internal/websocket"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

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

// HandleWebSocket godoc
// @Summary WebSocket connection for real-time messaging
// @Description Establish a WebSocket connection for real-time messaging with typed message support.
// @Description
// @Description ## Message Types
// @Description The WebSocket API uses typed messages with the following enum values:
// @Description
// @Description ### Connection Events
// @Description - `connection.connect` - Connection established (server -> client)
// @Description - `connection.disconnect` - Connection closed (server -> client)
// @Description - `connection.ping` - Ping message (client -> server)
// @Description - `connection.pong` - Pong response (server -> client)
// @Description
// @Description ### Channel Events
// @Description - `channel.join` - Join a channel (client -> server)
// @Description - `channel.leave` - Leave a channel (client -> server)
// @Description - `channel.message` - Send/receive channel message (bidirectional)
// @Description - `channel.typing` - Typing indicator (client -> server)
// @Description - `channel.stop_typing` - Stop typing indicator (client -> server)
// @Description
// @Description ### Channel Member Events
// @Description - `channel.member.join` - Member joined channel (server -> client)
// @Description - `channel.member.leave` - Member left channel (server -> client)
// @Description
// @Description ### User Events
// @Description - `user.status` - User status update (server -> client)
// @Description - `user.notification` - User notification (server -> client)
// @Description
// @Description ### Error Events
// @Description - `error` - Error message (server -> client)
// @Description
// @Description ## Message Format
// @Description All messages follow this JSON structure:
// @Description ```json
// @Description {
// @Description   "id": "unique-message-id",
// @Description   "type": "message-type-enum",
// @Description   "data": { /* type-specific data */ },
// @Description   "timestamp": 1234567890,
// @Description   "user_id": "user-id"
// @Description }
// @Description ```
// @Description
// @Description ## Example Messages
// @Description
// @Description ### Join Channel
// @Description ```json
// @Description {
// @Description   "id": "msg-123",
// @Description   "type": "channel.join",
// @Description   "data": { "channel_id": "channel-123" },
// @Description   "timestamp": 1234567890,
// @Description   "user_id": "user-456"
// @Description }
// @Description ```
// @Description
// @Description ### Send Message
// @Description ```json
// @Description {
// @Description   "id": "msg-456",
// @Description   "type": "channel.message",
// @Description   "data": {
// @Description     "channel_id": "channel-123",
// @Description     "text": "Hello world!",
// @Description     "url": null,
// @Description     "fileName": null
// @Description   },
// @Description   "timestamp": 1234567890,
// @Description   "user_id": "user-456"
// @Description }
// @Description ```
// @Description
// @Description ### Error Response
// @Description ```json
// @Description {
// @Description   "id": "error-789",
// @Description   "type": "error",
// @Description   "data": {
// @Description     "code": "INVALID_MESSAGE",
// @Description     "message": "Invalid message format"
// @Description   },
// @Description   "timestamp": 1234567890,
// @Description   "user_id": "user-456"
// @Description }
// @Description ```
// @Tags websocket
// @Accept json
// @Produce json
// @Param userId query string true "User ID for WebSocket connection"
// @Success 101 "Switching Protocols - WebSocket connection established"
// @Failure 400 {object} map[string]interface{} "Bad request - missing or invalid userId parameter"
// @Router /ws [get]
func (h *WSHandler) HandleWebSocket(c *gin.Context) {
	// This handler uses WebSocket message types defined in models package
	// See models.WebSocketMessage and related data structures for message schemas
	startTime := time.Now()
	clientIP := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")

	// Get userId from query parameters: /api/v1/ws?userId=1
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

	// Log connection attempt
	slog.Info("WebSocket connection request",
		"userID", validatedUserID,
		"clientIP", clientIP,
		"userAgent", userAgent)

	// Check for required headers
	if c.GetHeader("Connection") != "Upgrade" || c.GetHeader("Upgrade") != "websocket" {
		slog.Error("WebSocket connection failed: missing required headers",
			"userID", validatedUserID,
			"clientIP", clientIP)
		c.JSON(http.StatusBadRequest, gin.H{"error": "WebSocket upgrade required"})
		return
	}

	// Attempt WebSocket upgrade and client registration
	defer func() {
		duration := time.Since(startTime)
		slog.Debug("WebSocket connection attempt completed",
			"userID", validatedUserID,
			"clientIP", clientIP,
			"duration", duration)
	}()

	// Use the ServeWS function from websocket package for proper client creation and registration
	websocket.ServeWS(h.hub, c.Writer, c.Request, validatedUserID)
}
