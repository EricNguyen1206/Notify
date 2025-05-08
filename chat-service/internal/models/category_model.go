package models

import (
	"time"

	"gorm.io/gorm"
)

// Category represents a server category
type Category struct {
	ID        string         `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"id"`
	ServerID  string         `gorm:"not null" json:"serverId"`
	Name      string         `gorm:"not null" json:"name"`
	IsPrivate bool           `gorm:"default:false" json:"isPrivate"`
	Created   time.Time      `gorm:"default:CURRENT_TIMESTAMP" json:"created"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Channels []Channel `gorm:"foreignKey:CategoryID;references:ID"`
}

// Channel represents a channel within a category
type Channel struct {
	ID         string         `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"id"`
	CategoryID string         `gorm:"not null" json:"categoryId"`
	Name       string         `gorm:"not null" json:"name"`
	Type       string         `gorm:"not null" json:"type"` // text | voice
	Created    time.Time      `gorm:"default:CURRENT_TIMESTAMP" json:"created"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
}

type CreateCategoryRequest struct {
	ServerID  string `json:"serverId" binding:"required"`
	Name      string `json:"name" binding:"required"`
	IsPrivate bool   `json:"isPrivate"`
}

type UpdateCategoryRequest struct {
	Name      string `json:"name" binding:"required"`
	IsPrivate bool   `json:"isPrivate"`
}

type CreateChannelRequest struct {
	CategoryID string `json:"categoryId" binding:"required"`
	Name       string `json:"name" binding:"required"`
	Type       string `json:"type" binding:"required,oneof=text voice"`
}

type UpdateChannelRequest struct {
	Name string `json:"name" binding:"required"`
	Type string `json:"type" binding:"required,oneof=text voice"`
}

type CategoryResponse struct {
	ID        string            `json:"id"`
	ServerID  string            `json:"serverId"`
	Name      string            `json:"name"`
	IsPrivate bool              `json:"isPrivate"`
	Created   time.Time         `json:"created"`
	Channels  []ChannelResponse `json:"channels,omitempty"`
}

type ChannelResponse struct {
	ID         string    `json:"id"`
	CategoryID string    `json:"categoryId"`
	Name       string    `json:"name"`
	Type       string    `json:"type"`
	Created    time.Time `json:"created"`
}
