package models

import "gorm.io/gorm"

type Vote struct {
	gorm.Model
	UserID   uint `gorm:"not null;index" json:"user_id"`
	TopicID  uint `gorm:"not null;index" json:"topic_id"`
	OptionID uint `gorm:"not null;index" json:"option_id"`
}
