package models

import (
	"time"

	"gorm.io/gorm"
)

/** --------------------ENTITIES-------------------- */
// User represents the user entity
type User struct {
	gorm.Model
	Username string `gorm:"uniqueIndex;not null" json:"username"` // Username for the user
	Email    string `gorm:"uniqueIndex;not null" json:"email"`    // Unique email for the user
	Password string `json:"-"`                                    // Password is hashed and not returned in responses
	// Avatar is optional and can be used to store a profile picture URL
	// It is not mandatory for the user to have an avatar.
	Avatar string `json:"avatar,omitempty"`

	Channels []*Channel `gorm:"many2many:channel_members" json:"channels"`
}

/** -------------------- DTOs -------------------- */
// Request
type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

// LoginRequest represents the request for user login
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// Response
type UserResponse struct {
	ID        uint      `json:"id"`
	Email     string    `json:"email"`
	Username  string    `json:"username"`
	CreatedAt time.Time `json:"created_at"`
	Avatar    string    `json:"avatar,omitempty"`
}

// LoginResponse represents the response for a successful login
// swagger:model
type LoginResponse struct {
	Token string       `json:"token"`
	User  UserResponse `json:"user"`
}

// Update user request
type UpdateUserRequest struct {
	Username *string `json:"username,omitempty" binding:"omitempty,min=3,max=50"`
	Email    *string `json:"email,omitempty" binding:"omitempty,email"`
	Password *string `json:"password,omitempty" binding:"omitempty,min=6"`
	Avatar   *string `json:"avatar,omitempty"` // Optional avatar URL
}
