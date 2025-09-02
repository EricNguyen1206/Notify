package routes

import (
	"chat-service/internal/api/handlers"
	"chat-service/internal/api/middleware"
	"chat-service/internal/repositories/postgres"
	"chat-service/internal/services"
	"chat-service/internal/websocket"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type Router struct {
	engine         *gin.Engine
	wsHandler      *handlers.WSHandler
	channelHandler *handlers.ChannelHandler
	messageHandler *handlers.ChatHandler
	userHandler    *handlers.UserHandler
	authHandler    *handlers.AuthHandler
	rateLimitMW    *middleware.RateLimitMiddleware
	authMW         *middleware.AuthMiddleware
}

func NewRouter(
	hub *websocket.Hub,
	redisService *services.RedisService,
	redisClient *redis.Client,
	db *gorm.DB,
	jwtSecret string,
) *Router {
	gin.SetMode(gin.ReleaseMode)
	engine := gin.New()

	// Add middlewares
	engine.Use(gin.Recovery())
	engine.Use(middleware.CORS())
	engine.Use(middleware.LogApi())

	// Initialize repositories
	channelRepo := postgres.NewChannelRepository(db)
	userRepo := postgres.NewUserRepository(db)
	chatRepo := postgres.NewChatRepository(db)

	// Initialize services
	channelService := services.NewChannelService(channelRepo, userRepo)
	userService := services.NewUserService(userRepo, jwtSecret, redisClient)

	// Initialize handlers
	wsHandler := handlers.NewWSHandler(hub)
	rateLimitMW := middleware.NewRateLimitMiddleware(redisService)
	authMW := middleware.NewAuthMiddleware(jwtSecret)

	return &Router{
		engine:         engine,
		wsHandler:      wsHandler,
		channelHandler: handlers.NewChannelHandler(channelService),
		messageHandler: handlers.NewChatHandler(channelService, userService, chatRepo, hub),
		userHandler:    handlers.NewUserHandler(userService, redisClient),
		authHandler:    handlers.NewAuthHandler(userService, redisClient),
		rateLimitMW:    rateLimitMW,
		authMW:         authMW,
	}
}

func (r *Router) SetupRoutes() {
	r.engine.GET("/kaithhealthcheck", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	api := r.engine.Group("/api/v1")

	// WebSocket endpoint with authentication and rate limiting
	api.GET("/ws",
		// r.authMW.RequireAuth(),
		// r.rateLimitMW.WebSocketRateLimit(5, time.Minute), // 5 connections per minute
		r.wsHandler.HandleWebSocket,
	)

	// Authenticated routes
	auth := api.Group("/")
	auth.Use(r.authMW.RequireAuth())
	{
		// User routes
		users := auth.Group("/users")
		users.Use(r.rateLimitMW.RateLimit(100, time.Minute)) // 100 requests per minute
		{
			users.GET("/profile", r.userHandler.GetProfile)
		}

		// Channel routes
		const channelUserRoute = "/:id/user"
		channels := auth.Group("/channels")
		channels.Use(r.rateLimitMW.RateLimit(100, time.Minute)) // 100 requests per minute
		{
			channels.GET("/", r.channelHandler.GetUserChannels)
			channels.POST("/", r.channelHandler.CreateChannel)
			// Individual channel routes with :id parameter
			channels.GET("/:id", r.channelHandler.GetChannelByID)
			channels.PUT("/:id", r.channelHandler.UpdateChannel)
			channels.DELETE("/:id", r.channelHandler.DeleteChannel)
			// user-channel relation logic
			channels.POST(channelUserRoute, r.channelHandler.AddUserToChannel)
			channels.PUT(channelUserRoute, r.channelHandler.LeaveChannel)
			channels.DELETE(channelUserRoute, r.channelHandler.RemoveUserFromChannel)
		}

		// Message routes
		messages := auth.Group("/messages")
		messages.Use(r.rateLimitMW.RateLimit(200, time.Minute)) // 200 requests per minute
		{
			messages.GET("/channel/:id", r.messageHandler.GetChannelMessages)
			// messages.PUT("/:id", r.messageHandler.UpdateMessage)
			// messages.DELETE("/:id", r.messageHandler.DeleteMessage)
		}
	}

	// Public routes (no authentication required)
	public := api.Group("/")
	{
		// Auth routes
		authRoutes := public.Group("/auth")
		authRoutes.Use(r.rateLimitMW.RateLimitIP(50, time.Minute)) // 50 requests per minute per IP
		{
			authRoutes.POST("/register", r.authHandler.Register)
			authRoutes.POST("/login", r.authHandler.Login)
		}
	}
}

func (r *Router) GetEngine() *gin.Engine {
	return r.engine
}
