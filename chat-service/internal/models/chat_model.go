package models

import (
	"time"

	"gorm.io/gorm"
)

/** --------------------ENTITIES-------------------- */
// Chat represents a chat message
type Chat struct {
	ID        string         `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"id"`
	UserID    string         `gorm:"not null;type:uuid" json:"userId"`
	Type      string         `gorm:"not null" json:"type"`                // direct messages || server messages
	Provider  string         `gorm:"not null" json:"provider"`            // text || image || file
	FriendID  string         `gorm:"nullable;type:uuid" json:"friendId"`  // type is direct messages
	ServerID  string         `gorm:"nullable;type:uuid" json:"serverId"`  // type is server messages
	ChannelID string         `gorm:"nullable;type:uuid" json:"channelId"` // type is server messages
	Text      string         `gorm:"nullable" json:"text"`                // provider is text
	URL       string         `gorm:"nullable" json:"url"`                 // provider is image or file
	FileName  string         `gorm:"nullable" json:"fileName"`            // file name
	Sended    time.Time      `gorm:"default:CURRENT_TIMESTAMP" json:"sended"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	User    User    `gorm:"foreignKey:UserID;references:ID"`
	Friend  Friend  `gorm:"foreignKey:FriendID;references:ID"`
	Server  Server  `gorm:"foreignKey:ServerID;references:ID"`
	Channel Channel `gorm:"foreignKey:ChannelID;references:ID"`
}

/** -------------------- DTOs -------------------- */
// Websocket
type Message struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

type ChatMessage struct {
	ID        string `json:"id"`
	UserID    string `json:"userId"`
	Type      string `json:"type"`
	Provider  string `json:"provider"`
	FriendID  string `json:"friendId,omitempty"`
	ServerID  string `json:"serverId,omitempty"`
	ChannelID string `json:"channelId,omitempty"`
	Text      string `json:"text,omitempty"`
	URL       string `json:"url,omitempty"`
	FileName  string `json:"fileName,omitempty"`
}

// Request
type CreateChatRequest struct {
	Type      string `json:"type" binding:"required,oneof=direct_messages server_messages"`
	Provider  string `json:"provider" binding:"required,oneof=text image file"`
	FriendID  string `json:"friendId"`  // for direct messages
	ServerID  string `json:"serverId"`  // for server messages
	ChannelID string `json:"channelId"` // for server messages
	Text      string `json:"text"`      // for text provider
	URL       string `json:"url"`       // for image/file provider
	FileName  string `json:"fileName"`  // for file provider
}

// Response
type ChatResponse struct {
	ID        string    `json:"id"`
	UserID    string    `json:"userId"`
	Type      string    `json:"type"`
	Provider  string    `json:"provider"`
	FriendID  string    `json:"friendId,omitempty"`
	ServerID  string    `json:"serverId,omitempty"`
	ChannelID string    `json:"channelId,omitempty"`
	Text      string    `json:"text,omitempty"`
	URL       string    `json:"url,omitempty"`
	FileName  string    `json:"fileName,omitempty"`
	Sended    time.Time `json:"sended"`
}
