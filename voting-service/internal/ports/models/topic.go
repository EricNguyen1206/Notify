package models

import (
	"time"

	"gorm.io/gorm"
)

// Topic represents a voting topic/poll
type Topic struct {
	gorm.Model
	Title       string    `gorm:"size:255;not null" json:"title"`
	Description string    `gorm:"type:text" json:"description"`
	StartTime   time.Time `gorm:"not null;index" json:"start_time"`
	EndTime     time.Time `gorm:"not null;index" json:"end_time"`
	Options     []Option  `gorm:"foreignKey:TopicID" json:"options,omitempty"`
	Status      string    `gorm:"-:all" json:"status"` // Virtual field
}

func (t *Topic) AfterFind(tx *gorm.DB) (err error) {
	now := time.Now().UTC()
	switch {
	case now.Before(t.StartTime):
		t.Status = "upcoming"
	case now.After(t.EndTime):
		t.Status = "ended"
	default:
		t.Status = "active"
	}
	return
}
