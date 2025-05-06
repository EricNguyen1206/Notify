package chat

import (
	"time"

	"gorm.io/gorm"
)

// Chat represents a chat message
type Chat struct {
	ID        string         `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"id"`
	UserID    string         `gorm:"not null" json:"userId"`
	Type      string         `gorm:"not null" json:"type"`      // direct messages || server messages
	Provider  string         `gorm:"not null" json:"provider"`  // text || image || file
	FriendID  string         `gorm:"nullable" json:"friendId"`  // type is direct messages
	ServerID  string         `gorm:"nullable" json:"serverId"`  // type is server messages
	ChannelID string         `gorm:"nullable" json:"channelId"` // type is server messages
	Text      string         `gorm:"nullable" json:"text"`      // provider is text
	URL       string         `gorm:"nullable" json:"url"`       // provider is image or file
	FileName  string         `gorm:"nullable" json:"fileName"`  // file name
	Sended    time.Time      `gorm:"default:CURRENT_TIMESTAMP" json:"sended"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
