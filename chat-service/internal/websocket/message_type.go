package websocket

import (
	"encoding/json"
	"fmt"
	"time"
)

// MessageType represents the type of WebSocket message using a custom enum type for better type safety
type MessageType string

// Simplified WebSocket message types - only essential chat functionality
const (
	// Connection events
	MessageTypeConnect    MessageType = "connection.connect"
	MessageTypeDisconnect MessageType = "connection.disconnect"

	// Channel events
	MessageTypeChannelMessage MessageType = "channel.message"

	// Error events
	MessageTypeError MessageType = "error"
)

// String returns the string representation of the MessageType
func (mt MessageType) String() string {
	return string(mt)
}

// IsValid checks if the MessageType is a valid enum value
func (mt MessageType) IsValid() bool {
	switch mt {
	case MessageTypeConnect, MessageTypeDisconnect, MessageTypeChannelMessage, MessageTypeError:
		return true
	default:
		return false
	}
}

// GetAllMessageTypes returns all valid message types for documentation and validation
func GetAllMessageTypes() []MessageType {
	return []MessageType{
		MessageTypeConnect, MessageTypeDisconnect, MessageTypeChannelMessage, MessageTypeError,
	}
}

// Base message structure with typed MessageType for better type safety
type Message struct {
	ID        string                 `json:"id"`
	Type      MessageType            `json:"type"`
	Data      map[string]interface{} `json:"data"`
	Timestamp int64                  `json:"timestamp"`
	UserID    string                 `json:"user_id,omitempty"`
}

// Validate validates the message structure and type
func (m *Message) Validate() error {
	if m.ID == "" {
		return fmt.Errorf("message ID is required")
	}
	if !m.Type.IsValid() {
		return fmt.Errorf("invalid message type: %s", m.Type)
	}
	if m.Data == nil {
		m.Data = make(map[string]interface{})
	}
	return nil
}

// Simplified message data structures
type ChannelMessageData struct {
	ChannelID string  `json:"channel_id" binding:"required" validate:"required"`
	Text      *string `json:"text,omitempty"`
	URL       *string `json:"url,omitempty"`
	FileName  *string `json:"fileName,omitempty"`
}

type ErrorData struct {
	Code    string `json:"code" validate:"required"`
	Message string `json:"message" validate:"required"`
}

type ConnectData struct {
	ClientID string `json:"client_id"`
	Status   string `json:"status"`
}

// Message constructors for type safety and consistency

// NewMessage creates a new message with the specified type and data
func NewMessage(id string, msgType MessageType, userID string, data map[string]interface{}) *Message {
	if data == nil {
		data = make(map[string]interface{})
	}
	return &Message{
		ID:        id,
		Type:      msgType,
		Data:      data,
		Timestamp: time.Now().Unix(),
		UserID:    userID,
	}
}

// NewConnectMessage creates a connection success message
func NewConnectMessage(id, clientID, userID string) *Message {
	return NewMessage(id, MessageTypeConnect, userID, map[string]interface{}{
		"client_id": clientID,
		"status":    "connected",
	})
}

// NewErrorMessage creates an error message
func NewErrorMessage(id, userID, code, message string) *Message {
	return NewMessage(id, MessageTypeError, userID, map[string]interface{}{
		"code":    code,
		"message": message,
	})
}

// NewChannelMessage creates a channel message
func NewChannelMessage(id, userID string, data interface{}) *Message {
	dataMap := make(map[string]interface{})
	if data != nil {
		// Convert struct to map for JSON serialization
		if dataBytes, err := json.Marshal(data); err == nil {
			json.Unmarshal(dataBytes, &dataMap)
		}
	}
	return NewMessage(id, MessageTypeChannelMessage, userID, dataMap)
}
