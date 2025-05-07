package server

import (
	"chat-service/internal/category"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

/** --------------------ENTITIES-------------------- */
// Server represents a server entity
type Server struct {
	ID        string         `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"id"`
	Name      string         `gorm:"not null" json:"name"`
	Owner     string         `gorm:"not null" json:"owner"` // userid
	Avatar    string         `gorm:"nullable" json:"avatar"`
	Created   time.Time      `gorm:"default:CURRENT_TIMESTAMP" json:"created"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Categories []category.Category `gorm:"foreignKey:ServerID;references:ID"`
	Members    []JoinServer        `gorm:"foreignKey:ServerID;references:ID"`
}

func (s *Server) BeforeCreate(tx *gorm.DB) error {
	if s.ID == "" {
		s.ID = uuid.New().String()
	}
	return nil
}

// JoinServer represents server membership
type JoinServer struct {
	ID         string         `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"id"`
	ServerID   string         `gorm:"not null" json:"serverId"`
	UserID     string         `gorm:"not null" json:"userId"`
	JoinedDate time.Time      `gorm:"default:CURRENT_TIMESTAMP" json:"joinedDate"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
}

/** -------------------- DTOs -------------------- */
// Request
type CreateServerRequest struct {
	Name   string `json:"name" binding:"required"`
	Avatar string `json:"avatar"`
}

type UpdateServerRequest struct {
	Name   string `json:"name" binding:"required"`
	Avatar string `json:"avatar"`
}

type JoinServerRequest struct {
	ServerID string `json:"serverId" binding:"required"`
}

// Response
type ServerResponse struct {
	ID      string               `json:"id"`
	Name    string               `json:"name"`
	Owner   string               `json:"owner"`
	Avatar  string               `json:"avatar"`
	Created time.Time            `json:"created"`
	Members []JoinServerResponse `json:"members,omitempty"`
}

type JoinServerResponse struct {
	ID         string    `json:"id"`
	ServerID   string    `json:"serverId"`
	UserID     string    `json:"userId"`
	JoinedDate time.Time `json:"joinedDate"`
}
