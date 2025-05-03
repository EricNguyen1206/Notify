package models

import (
	"gorm.io/gorm"
)

type Option struct {
	gorm.Model
	TopicID   uint   `gorm:"column:topic_id;not null;index" json:"topic_id"`
	Title     string `gorm:"column:title;size:255;not null" json:"title"`
	ImageURL  string `gorm:"column:image_url;size:512" json:"image_url"`
	Link      string `gorm:"column:link;size:512" json:"link"`
	VoteCount uint   `gorm:"column:vote_count;default:0" json:"vote_count"`
}

// TableName specifies the table name for Option
func (Option) TableName() string {
	return "options"
}

// AddOptionRequest defines the input for adding an option
type AddOptionRequest struct {
	TopicID  uint   `json:"topic_id" binding:"required"`
	Title    string `json:"title" binding:"required"`
	ImageURL string `json:"image_url"`
	Link     string `json:"link"`
}
