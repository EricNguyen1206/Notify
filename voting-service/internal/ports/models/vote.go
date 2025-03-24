package models

import (
	"gorm.io/gorm"
)

// Vote represents a user's vote for an option
type Vote struct {
	gorm.Model
	UserID   uint `gorm:"not null;index" json:"user_id"`
	TopicID  uint `gorm:"not null;index" json:"topic_id"`
	OptionID uint `gorm:"not null;index" json:"option_id"`
}

// VoteRequest defines the input for casting a vote
type VoteRequest struct {
	TopicID  uint `json:"topic_id" binding:"required"`
	OptionID uint `json:"option_id" binding:"required"`
}

type VoteMessage struct {
	UserID    uint  `json:"user_id"`
	TopicID   uint  `json:"topic_id"`
	OptionID  uint  `json:"option_id"`
	Timestamp int64 `json:"timestamp"`
}
