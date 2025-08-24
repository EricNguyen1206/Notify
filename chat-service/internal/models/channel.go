package models

import (
	"time"

	"gorm.io/gorm"
)

// Channel type constants
const (
	ChannelTypeDirect = "direct"
	ChannelTypeGroup  = "group"
)

// Channel represents a channel within a category
type Channel struct {
	gorm.Model
	Name    string `gorm:"not null" json:"name"`                                                    // Name of the channel
	OwnerID uint   `gorm:"not null;type:uint" json:"ownerId"`                                       // ID of the channel owner
	Type    string `gorm:"not null;type:varchar(20);check:type IN ('direct', 'group')" json:"type"` // Type of channel, either 'direct' or 'group'

	Members []*User `gorm:"many2many:channel_members" json:"members"`
}

/** -------------------- DTOs -------------------- */

type UpdateChannelRequest struct {
	Name string `json:"name" binding:"required"`
}

type ChannelDetailResponse struct {
	ID        uint      `json:"id"`
	Name      string    `json:"name"`
	Type      string    `json:"type"`
	CreatedAt time.Time `json:"createdAt"`
	OwnerID   uint      `json:"ownerId"`
	Members   []User    `json:"members"` // List of members in the channel
}

type ChannelResponse struct {
	ID      uint   `json:"id"`
	Name    string `json:"name"`
	Type    string `json:"type"`
	OwnerID uint   `json:"ownerId"`
}

type DirectChannelResponse struct {
	ID      uint   `json:"id"`
	Name    string `json:"name"`
	Avatar  string `json:"avatar,omitempty"` // Optional avatar for direct channels
	Type    string `json:"type"`
	OwnerID uint   `json:"ownerId"`
}

// UserChannelsResponse represents the response for user's channels separated by type
type UserChannelsResponse struct {
	Direct []DirectChannelResponse `json:"direct"` // List of channels of type 'direct'
	Group  []ChannelResponse       `json:"group"`  // List of channels of type 'group'
}
