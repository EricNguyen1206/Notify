package models

import (
	"fmt"
	"time"

	"gorm.io/gorm"
)

// PaginatedChatResponse is a reusable paginated response for chat messages
type PaginatedChatResponse struct {
	Items      []ChatResponse `json:"items"`
	Total      int            `json:"total"`
	NextCursor *int64         `json:"nextCursor,omitempty"`
}

// Validate checks that exactly one of ReceiverID or ChannelID is set for a Chat
func (c *Chat) Validate() error {
	if (c.ReceiverID == nil && c.ChannelID == 0) || (c.ReceiverID != nil && c.ChannelID != 0) {
		return fmt.Errorf("exactly one of ReceiverID or ChannelID must be set")
	}
	return nil
}

// GetType returns the chat type as a string for ChatResponse
func (c *Chat) GetType() string {
	if c.ReceiverID != nil {
		return string(ChatTypeDirect)
	}
	if c.ChannelID != 0 {
		return string(ChatTypeChannel)
	}
	return ""
}

// enum
type ChatType string

const (
	ChatTypeDirect  ChatType = "direct"
	ChatTypeChannel ChatType = "group"
)

/** --------------------ENTITIES-------------------- */
// Chat represents a chat message
type Chat struct {
	gorm.Model

	SenderID   uint  `gorm:"not null" json:"senderId"`
	ReceiverID *uint `gorm:"type:uint" json:"receiverId"` // for direct messages

	ChannelID uint `gorm:"type:uint" json:"channelId"` // only if type == channel

	Text     *string `json:"text,omitempty"`     // optional
	URL      *string `json:"url,omitempty"`      // optional
	FileName *string `json:"fileName,omitempty"` // optional

	Sender   User    `gorm:"foreignKey:SenderID"`
	Receiver *User   `gorm:"foreignKey:ReceiverID"` // pointer to allow null
	Channel  Channel `gorm:"foreignKey:ChannelID"`
}

/** -------------------- DTOs -------------------- */
// Request
type ChatRequest struct {
	ChannelID string  `json:"channel_id" binding:"required"`
	Text      *string `json:"text,omitempty"`
	URL       *string `json:"url,omitempty"`
	FileName  *string `json:"fileName,omitempty"`
}

// Response
type ChatResponse struct {
	ID           uint      `json:"id"`
	Type         string    `json:"type"`                   // "direct" | "group"
	SenderID     uint      `json:"senderId"`               // ID of the user who sent the message
	SenderName   string    `json:"senderName"`             // Username of the sender
	SenderAvatar string    `json:"senderAvatar,omitempty"` // url string for avatar
	Text         *string   `json:"text,omitempty"`         // free text message
	URL          *string   `json:"url,omitempty"`          // optional URL for media
	FileName     *string   `json:"fileName,omitempty"`     // optional file name for media
	CreatedAt    time.Time `json:"createdAt"`              // timestamp of when the message was created

	// Relate to type message
	ReceiverID *uint `json:"receiverId,omitempty"` // direct
	ChannelID  *uint `json:"channelId,omitempty"`  // channel
}
