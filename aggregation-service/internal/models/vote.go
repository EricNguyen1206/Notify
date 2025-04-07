package models

import "gorm.io/gorm"

type Vote struct {
	gorm.Model
	UserID   uint `gorm:"not null;index" json:"user_id"`
	TopicID  uint `gorm:"not null;index" json:"topic_id"`
	OptionID uint `gorm:"not null;index" json:"option_id"`
}

type VoteMessage struct {
	UserID   uint `json:"user_id"`
	TopicID  uint `json:"topic_id"`
	OptionID uint `json:"option_id"`
}

type VoteCount struct {
	OptionID  uint  `json:"option_id"`
	VoteCount int64 `json:"vote_count"`
}
