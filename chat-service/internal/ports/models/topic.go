package models

import (
	"gorm.io/gorm"
)

type Topic struct {
	gorm.Model
	Title       string `gorm:"column:title;size:255;not null" json:"title"`
	Description string `gorm:"column:description;type:text" json:"description"`
	StartTime   string `gorm:"column:start_time;not null" json:"start_time"`
	EndTime     string `gorm:"column:end_time;not null" json:"end_time"`
}

// TableName specifies the table name for Topic
func (Topic) TableName() string {
	return "topics"
}

// CreateTopicRequest defines the input for creating a topic
type CreateTopicRequest struct {
	Title       string `form:"title" binding:"required"`
	Description string `form:"description" binding:"required"`
	StartTime   string `form:"start_time" binding:"required"`
	EndTime     string `form:"end_time" binding:"required"`
}
