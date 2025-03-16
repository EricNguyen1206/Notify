package server

import (
	"log"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"voting-service/internal/server/handlers"
	"voting-service/internal/server/middleware"
	"voting-service/internal/server/repository"
	"voting-service/internal/server/service"
)

// Server represents the HTTP server
type Server struct {
	router *gin.Engine
	db     *gorm.DB
}

// NewServer creates a new HTTP server
func NewServer(db *gorm.DB) *Server {
	router := gin.Default()

	// Initialize middleware
	router.Use(middleware.CORS())

	// Initialize repositories
	authRepo := repository.NewAuthRepository(db)

	// Initialize services
	authService := service.NewAuthService(
		authRepo,
		"your-jwt-secret-key", // Replace with your JWT secret
		24*time.Hour,          // Token expiration time
	)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)

	// Setup routes
	SetupRoutes(router, authHandler)

	return &Server{
		router: router,
		db:     db,
	}
}

// Start runs the HTTP server
func (s *Server) Start(address string) error {
	log.Printf("Server is running on %s\n", address)
	return s.router.Run(address)
}
