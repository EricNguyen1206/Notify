package models

import (
	"gorm.io/gorm"
)

// Vote represents a user's vote for an option
type Vote struct {
	gorm.Model
	UserID   uint `gorm:"column:user_id;not null;index" json:"user_id"`
	TopicID  uint `gorm:"column:topic_id;not null;index" json:"topic_id"`
	OptionID uint `gorm:"column:option_id;not null;index" json:"option_id"`
}

// TableName specifies the table name for Vote
func (Vote) TableName() string {
	return "votes"
}

// VoteRequest defines the input for casting a vote
type VoteRequest struct {
	TopicID  uint `json:"topic_id" binding:"required"`
	OptionID uint `json:"option_id" binding:"required"`
}

type VoteMessage struct {
	UserID   uint `json:"user_id"`
	TopicID  uint `json:"topic_id"`
	OptionID uint `json:"option_id"`
}
