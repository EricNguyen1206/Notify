package models

import (
	"gorm.io/gorm"
)

// Vote represents an individual vote
type Vote struct {
	gorm.Model
	TopicID  uint `gorm:"not null;index:idx_vote_topic_user" json:"topic_id"`
	OptionID uint `gorm:"not null;index" json:"option_id"`
	UserID   uint `gorm:"not null;index:idx_vote_topic_user" json:"user_id"`

	// Relationships
	User   User   `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-"`
	Topic  Topic  `gorm:"foreignKey:TopicID;constraint:OnDelete:CASCADE" json:"-"`
	Option Option `gorm:"foreignKey:OptionID;constraint:OnDelete:CASCADE" json:"-"`
}
