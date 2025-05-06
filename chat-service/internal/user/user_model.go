package user

import (
	"chat-service/internal/chat"
	"chat-service/internal/server"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

/** --------------------ENTITIES-------------------- */
// User represents the user entity
type User struct {
	ID        string         `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"id"`
	Provider  string         `gorm:"not null" json:"provider"`
	Email     string         `gorm:"unique;not null" json:"email"`
	Name      string         `gorm:"not null" json:"name"`
	Password  string         `gorm:"nullable" json:"-"`
	Avatar    string         `gorm:"nullable" json:"avatar"`
	IsAdmin   bool           `gorm:"default:false" json:"isAdmin"`
	Created   time.Time      `gorm:"default:CURRENT_TIMESTAMP" json:"created"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Friends        []Friend            `gorm:"foreignKey:SenderEmail;references:Email"`
	FriendRequests []FriendPending     `gorm:"foreignKey:SenderEmail;references:Email"`
	Servers        []server.JoinServer `gorm:"foreignKey:UserID;references:ID"`
	Chats          []chat.Chat         `gorm:"foreignKey:UserID;references:ID"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == "" {
		u.ID = uuid.New().String()
	}
	return nil
}

// FriendPending represents pending friend requests
type FriendPending struct {
	ID            string         `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"id"`
	SenderEmail   string         `gorm:"not null" json:"senderEmail"`
	ReceiverEmail string         `gorm:"not null" json:"receiverEmail"`
	DateSended    time.Time      `gorm:"default:CURRENT_TIMESTAMP" json:"dateSended"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
}

// Friend represents accepted friend relationships
type Friend struct {
	ID            string         `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"id"`
	SenderEmail   string         `gorm:"not null" json:"senderEmail"`
	ReceiverEmail string         `gorm:"not null" json:"receiverEmail"`
	Created       time.Time      `gorm:"default:CURRENT_TIMESTAMP" json:"created"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
}

// DirectMessage represents direct message relationships
type DirectMessage struct {
	ID          string         `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"id"`
	OwnerEmail  string         `gorm:"not null" json:"ownerEmail"`
	FriendEmail string         `gorm:"not null" json:"friendEmail"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

/** -------------------- DTOs -------------------- */
// Request
type RegisterRequest struct {
	Provider string `json:"provider" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Name     string `json:"name" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type FriendRequest struct {
	ReceiverEmail string `json:"receiverEmail" binding:"required,email"`
}

// Response
type UserResponse struct {
	ID      string    `json:"id"`
	Email   string    `json:"email"`
	Name    string    `json:"name"`
	Avatar  string    `json:"avatar"`
	IsAdmin bool      `json:"isAdmin"`
	Created time.Time `json:"created"`
}

type FriendResponse struct {
	ID            string    `json:"id"`
	SenderEmail   string    `json:"senderEmail"`
	ReceiverEmail string    `json:"receiverEmail"`
	Created       time.Time `json:"created"`
}
