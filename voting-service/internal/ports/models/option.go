package models

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Option represents a voting option within a topic
type Option struct {
	gorm.Model
	TopicID   uuid.UUID `gorm:"type:char(36);not null;index" json:"topic_id"`
	Title     string    `gorm:"size:255;not null" json:"title"`
	ImageURL  string    `gorm:"size:512" json:"image_url"`
	Link      string    `gorm:"size:512" json:"link"`
	VoteCount int       `gorm:"default:0;index" json:"vote_count"`
	Votes     []Vote    `gorm:"foreignKey:OptionID" json:"-"`
}
