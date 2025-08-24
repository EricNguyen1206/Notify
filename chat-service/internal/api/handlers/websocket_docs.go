package handlers

import (
	"chat-service/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

// WebSocketDocsHandler provides documentation endpoints for WebSocket message schemas
type WebSocketDocsHandler struct{}

// NewWebSocketDocsHandler creates a new WebSocket documentation handler
func NewWebSocketDocsHandler() *WebSocketDocsHandler {
	return &WebSocketDocsHandler{}
}

// GetWebSocketSchemas godoc
// @Summary Get WebSocket message schemas
// @Description Returns the schemas for all WebSocket message types used in the real-time messaging API.
// @Description This endpoint is for documentation purposes only and provides TypeScript-compatible schemas.
// @Description
// @Description ## Available Message Types:
// @Description - **connection.connect** - Connection established (server -> client)
// @Description - **connection.disconnect** - Connection closed (server -> client)  
// @Description - **connection.ping** - Ping message (client -> server)
// @Description - **connection.pong** - Pong response (server -> client)
// @Description - **channel.join** - Join a channel (client -> server)
// @Description - **channel.leave** - Leave a channel (client -> server)
// @Description - **channel.message** - Send/receive channel message (bidirectional)
// @Description - **channel.typing** - Typing indicator (client -> server)
// @Description - **channel.stop_typing** - Stop typing indicator (client -> server)
// @Description - **channel.member.join** - Member joined channel (server -> client)
// @Description - **channel.member.leave** - Member left channel (server -> client)
// @Description - **user.status** - User status update (server -> client)
// @Description - **user.notification** - User notification (server -> client)
// @Description - **error** - Error message (server -> client)
// @Tags websocket
// @Accept json
// @Produce json
// @Success 200 {object} models.WebSocketExampleMessages "WebSocket message schemas and examples"
// @Router /ws/schemas [get]
func (h *WebSocketDocsHandler) GetWebSocketSchemas(c *gin.Context) {
	// This endpoint is for documentation purposes only
	// It ensures WebSocket message schemas are included in Swagger generation
	examples := models.WebSocketExampleMessages{
		ChannelJoin: models.WebSocketMessage{
			ID:        "msg-123",
			Type:      "channel.join",
			Data:      models.ChannelJoinData{ChannelID: "channel-123"},
			Timestamp: 1234567890,
			UserID:    "user-456",
		},
		ChannelMessage: models.WebSocketMessage{
			ID:   "msg-456",
			Type: "channel.message",
			Data: models.ChannelMessageData{
				ChannelID: "channel-123",
				Text:      stringPtr("Hello world!"),
				URL:       nil,
				FileName:  nil,
			},
			Timestamp: 1234567890,
			UserID:    "user-456",
		},
		TypingIndicator: models.WebSocketMessage{
			ID:   "msg-789",
			Type: "channel.typing",
			Data: models.TypingIndicatorData{
				ChannelID: "channel-123",
				IsTyping:  true,
			},
			Timestamp: 1234567890,
			UserID:    "user-456",
		},
		Error: models.WebSocketMessage{
			ID:   "error-123",
			Type: "error",
			Data: models.ErrorData{
				Code:    "INVALID_MESSAGE",
				Message: "Invalid message format",
				Details: stringPtr("Field 'channel_id' is required"),
			},
			Timestamp: 1234567890,
			UserID:    "user-456",
		},
	}

	c.JSON(http.StatusOK, examples)
}

// GetWebSocketMessageTypes godoc
// @Summary Get WebSocket message type enum
// @Description Returns the enum values for all valid WebSocket message types
// @Tags websocket
// @Accept json
// @Produce json
// @Success 200 {object} models.WebSocketMessageType "WebSocket message type enum"
// @Router /ws/message-types [get]
func (h *WebSocketDocsHandler) GetWebSocketMessageTypes(c *gin.Context) {
	messageTypes := models.WebSocketMessageType{
		Connect:           "connection.connect",
		Disconnect:        "connection.disconnect",
		Ping:              "connection.ping",
		Pong:              "connection.pong",
		ChannelJoin:       "channel.join",
		ChannelLeave:      "channel.leave",
		ChannelMessage:    "channel.message",
		ChannelTyping:     "channel.typing",
		ChannelStopTyping: "channel.stop_typing",
		MemberJoin:        "channel.member.join",
		MemberLeave:       "channel.member.leave",
		UserStatus:        "user.status",
		UserNotification:  "user.notification",
		Error:             "error",
	}

	c.JSON(http.StatusOK, messageTypes)
}

// GetChannelMessageSchema godoc
// @Summary Get channel message data schema
// @Description Returns the schema for channel message data structure
// @Tags websocket
// @Accept json
// @Produce json
// @Success 200 {object} models.ChannelMessageData "Channel message data schema"
// @Router /ws/schemas/channel-message [get]
func (h *WebSocketDocsHandler) GetChannelMessageSchema(c *gin.Context) {
	schema := models.ChannelMessageData{
		ChannelID: "channel-123",
		Text:      stringPtr("Hello world!"),
		URL:       stringPtr("https://example.com/image.jpg"),
		FileName:  stringPtr("document.pdf"),
		ReplyToID: stringPtr("msg-456"),
	}

	c.JSON(http.StatusOK, schema)
}

// GetTypingIndicatorSchema godoc
// @Summary Get typing indicator data schema
// @Description Returns the schema for typing indicator data structure
// @Tags websocket
// @Accept json
// @Produce json
// @Success 200 {object} models.TypingIndicatorData "Typing indicator data schema"
// @Router /ws/schemas/typing-indicator [get]
func (h *WebSocketDocsHandler) GetTypingIndicatorSchema(c *gin.Context) {
	schema := models.TypingIndicatorData{
		ChannelID: "channel-123",
		IsTyping:  true,
	}

	c.JSON(http.StatusOK, schema)
}

// GetErrorDataSchema godoc
// @Summary Get error data schema
// @Description Returns the schema for error data structure
// @Tags websocket
// @Accept json
// @Produce json
// @Success 200 {object} models.ErrorData "Error data schema"
// @Router /ws/schemas/error [get]
func (h *WebSocketDocsHandler) GetErrorDataSchema(c *gin.Context) {
	schema := models.ErrorData{
		Code:    "INVALID_MESSAGE",
		Message: "Invalid message format",
		Details: stringPtr("Field 'channel_id' is required"),
	}

	c.JSON(http.StatusOK, schema)
}

// Helper function to create string pointers
func stringPtr(s string) *string {
	return &s
}
