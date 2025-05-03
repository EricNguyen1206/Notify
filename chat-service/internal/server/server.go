package server

import (
	"log"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"chat-service/internal/adapters/database"
	"chat-service/internal/server/handlers"
	"chat-service/internal/server/middleware"
	"chat-service/internal/server/repository"
	"chat-service/internal/server/service"
)

// Server represents the HTTP server
type Server struct {
	router *gin.Engine
	db     *gorm.DB
}

// NewServer creates a new HTTP server
func NewServer(db *gorm.DB, minioClient *database.MinIOClient) *Server {
	router := gin.Default()

	// Initialize middleware
	router.Use(middleware.CORS())

	// Initialize repositories
	authRepo := repository.NewAuthRepository(db)

	// Initialize services
	authService := service.NewAuthService(
		authRepo,
		"your-secret-key", // Replace with your JWT secret
		time.Hour,         // Token expiration time
	)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)

	// Initialize repositories
	topicRepo := repository.NewTopicRepository(db)
	optionRepo := repository.NewOptionRepository(db)
	voteRepo := repository.NewVoteRepository(db)

	// Initialize services
	topicService := service.NewTopicService(topicRepo, minioClient)
	optionService := service.NewOptionService(optionRepo)
	voteService := service.NewVoteService(voteRepo)

	// Initialize handlers
	topicHandler := handlers.NewTopicHandler(topicService)
	optionHandler := handlers.NewOptionHandler(optionService)
	voteHandler := handlers.NewVoteHandler(voteService)

	// Setup routes
	SetupRoutes(router, authHandler, topicHandler, optionHandler, voteHandler)

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
