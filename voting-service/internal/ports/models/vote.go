package models

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Vote represents an individual vote
type Vote struct {
	gorm.Model
	TopicID  uuid.UUID `gorm:"type:char(36);not null;index:idx_vote_topic_user" json:"topic_id"`
	OptionID uuid.UUID `gorm:"type:char(36);not null;index" json:"option_id"`
	UserID   uint      `gorm:"not null;index:idx_vote_topic_user" json:"user_id"`

	// Relationships
	User  User  `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-"`
	Topic Topic `gorm:"foreignKey:TopicID;constraint:OnDelete:CASCADE" json:"-"`
}
