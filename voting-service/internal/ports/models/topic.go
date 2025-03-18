package models

import (
	"mime/multipart"
	"time"

	"gorm.io/gorm"
)

// Topic represents a voting topic
type Topic struct {
	gorm.Model
	Title       string    `gorm:"size:255;not null" json:"title"`
	Description string    `gorm:"type:text" json:"description"`
	ImageURL    string    `gorm:"size:512" json:"image_url"`
	StartTime   time.Time `gorm:"not null" json:"start_time"`
	EndTime     time.Time `gorm:"not null" json:"end_time"`
}

// CreateTopicRequest defines the input for creating a topic
type CreateTopicRequest struct {
	Title       string                `form:"title" binding:"required"`
	Description string                `form:"description" binding:"required"`
	Image       *multipart.FileHeader `form:"image" binding:"required"`
	StartTime   time.Time             `form:"start_time" binding:"required" time_format:"2006-01-02T15:04:05Z"`
	EndTime     time.Time             `form:"end_time" binding:"required" time_format:"2006-01-02T15:04:05Z"`
}
