package models

import (
	"gorm.io/gorm"
)

// Option represents a voting option within a topic
type Option struct {
	gorm.Model
	TopicID     uint   `gorm:"not null;index" json:"topic_id"`
	Title       string `gorm:"size:255;not null" json:"title"`
	ImageURL    string `gorm:"size:512" json:"image_url"`
	Link        string `gorm:"size:512" json:"link"`
	Description string `gorm:"type:text" json:"description"`

	// Relationships
	Topic Topic  `gorm:"foreignKey:TopicID;constraint:OnDelete:CASCADE;constraint:fk_options_topic" json:"-"`
	Votes []Vote `gorm:"foreignKey:OptionID" json:"-"`
}
