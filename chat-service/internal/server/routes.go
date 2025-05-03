package server

import (
	"chat-service/configs"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	"chat-service/internal/server/handlers"
	"chat-service/internal/server/middleware"
)

// SetupRoutes configures all the routes for the application
func SetupRoutes(router *gin.Engine, authHandler *handlers.AuthHandler, topicHandler *handlers.TopicHandler, optionHandler *handlers.OptionHandler, voteHandler *handlers.VoteHandler) {
	// Load configuration
	cfg := configs.Load()

	// Swagger documentation
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Health check route
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Public routes (no authentication required)
	public := router.Group("/api/v1")
	{
		// Auth routes
		auth := public.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
		}

		public.GET("/topics", topicHandler.GetAllTopics)
		// Option routes
		public.GET("/topics/:topic_id/options", optionHandler.GetOptions)
	}

	// Protected routes (require JWT authentication)
	protected := router.Group("/api/v1")
	protected.Use(middleware.JWTAuth(cfg.App.JWTSecret)) // Apply JWT middleware
	{
		// Example protected route
		protected.GET("/profile", func(c *gin.Context) {
			user, _ := middleware.GetUserFromContext(c.Request.Context())
			c.JSON(200, gin.H{"user": user})
		})

		// Topic routes
		public.POST("/topics", topicHandler.CreateTopic)

		// Option routes
		protected.POST("/topics/:topic_id/options", optionHandler.AddOption)
		protected.POST("/topics/:topic_id/options/:option_id/vote", voteHandler.CastVote)
	}
}
