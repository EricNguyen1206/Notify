package models

import (
	"time"

	"gorm.io/gorm"
)

/** --------------------ENTITIES-------------------- */
// User represents the user entity
type User struct {
	gorm.Model
	Username string `gorm:"uniqueIndex;not null" json:"username"`
	Email    string `gorm:"uniqueIndex;not null" json:"email"`
	Password string `json:"-"`

	Friends []Friend `gorm:"foreignKey:SenderEmail;references:Email"`
	// FriendRequests []FriendPending `gorm:"foreignKey:SenderEmail;references:Email"`
	// Servers        []JoinServer    `gorm:"foreignKey:UserID;references:ID"`
	// Chats          []Chat          `gorm:"foreignKey:UserID;references:ID"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	// if u.Role == "" {
	// 	u.Role = "user" // Set default role is user
	// }
	return nil
}

// FriendPending represents pending friend requests
type FriendPending struct {
	ID            string         `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"id"`
	SenderEmail   string         `gorm:"not null;type:varchar(255)" json:"senderEmail"`
	ReceiverEmail string         `gorm:"not null;type:varchar(255)" json:"receiverEmail"`
	DateSended    time.Time      `gorm:"default:CURRENT_TIMESTAMP" json:"dateSended"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
}

// Friend represents accepted friend relationships
type Friend struct {
	UserID   uint   `gorm:"not null;type:uuid" json:"userId"`
	FriendID uint   `gorm:"not null;type:uuid" json:"friendId"`
	Status   string `gorm:"not null;type:varchar(255)" json:"status"`
}

// DirectMessage represents direct message relationships
type DirectMessage struct {
	ID          string         `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"id"`
	OwnerEmail  string         `gorm:"not null;type:varchar(255)" json:"ownerEmail"`
	FriendEmail string         `gorm:"not null;type:varchar(255)" json:"friendEmail"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

/** -------------------- DTOs -------------------- */
// Request
type RegisterRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type FriendRequest struct {
	ReceiverId uint `json:"receiverId" binding:"required,id"`
}

// Response
type UserResponse struct {
	ID        uint      `json:"id"`
	Email     string    `json:"email"`
	Username  string    `json:"username"`
	CreatedAt time.Time `json:"created_at"`
}

type FriendResponse struct {
	ID            string    `json:"id"`
	SenderEmail   string    `json:"senderEmail"`
	ReceiverEmail string    `json:"receiverEmail"`
	Created       time.Time `json:"created"`
}
