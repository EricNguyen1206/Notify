package auth

import (
	"time"

	"gorm.io/gorm"
)

type UserModel struct {
	gorm.Model
	Username  string    `gorm:"column:username;size:255;not null;unique" json:"username"`
	Email     string    `gorm:"column:email;size:255;not null;unique" json:"email"`
	Password  string    `gorm:"column:password;size:255;not null" json:"-"`
	IsActive  bool      `gorm:"column:is_active;default:true" json:"is_active"`
	LastLogin time.Time `gorm:"column:last_login" json:"last_login"`
}

// TableName specifies the table name for User
func (UserModel) TableName() string {
	return "users"
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token string `json:"token"`
}

type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}
