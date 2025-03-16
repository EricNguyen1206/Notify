package models

import (
	"time"

	"gorm.io/gorm"
)

// User represents both the database model and JSON structure
type User struct {
	gorm.Model
	Username  string    `gorm:"size:255;not null;unique" json:"username"`
	Email     string    `gorm:"size:255;not null;unique" json:"email"`
	Password  string    `gorm:"size:255;not null" json:"-"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	LastLogin time.Time `json:"last_login"`
}

// RegisterRequest defines the input for registration
type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

// LoginRequest defines the input for login
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse defines the output for login
type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}
