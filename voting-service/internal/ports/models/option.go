package models

import (
	"gorm.io/gorm"
)

// Option represents a voting option within a topic
type Option struct {
	gorm.Model
	TopicID   uint   `gorm:"not null;index" json:"topic_id"`
	Title     string `gorm:"size:255;not null" json:"title"`
	ImageURL  string `gorm:"size:512" json:"image_url"`
	Link      string `gorm:"size:512" json:"link"`
	VoteCount uint   `gorm:"default:0" json:"vote_count"`
}

// AddOptionRequest defines the input for adding an option
type AddOptionRequest struct {
	TopicID  uint   `json:"topic_id" binding:"required"`
	Title    string `json:"title" binding:"required"`
	ImageURL string `json:"image_url"`
	Link     string `json:"link"`
}
