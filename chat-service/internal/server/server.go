package server

import (
	"chat-service/configs"
	"chat-service/configs/database"
	"chat-service/internal/auth"

	"chat-service/internal/channel"
	// "chat-service/internal/message"
	"chat-service/internal/category"
	"chat-service/internal/directmsg"

	// "chat-service/internal/user"
	"chat-service/internal/ws"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type App struct {
	router      *gin.Engine
	postgresDB  *gorm.DB
	mongoDB     *database.MongoDB
	authHandler *auth.AuthHandler
	wsHub       *ws.Hub
}

func NewApp() (*App, error) {
	// Initialize databases
	postgresDB, err := database.NewPostgresConnection()
	if err != nil {
		return nil, err
	}

	mongoDB, err := database.NewMongoConnection()
	if err != nil {
		return nil, err
	}

	// Auto migrate models for Postgres
	if err := database.MigratePostgres(postgresDB); err != nil {
		return nil, err
	}

	config := configs.Load()

	// Initialize WebSocket hub
	wsHub := ws.NewHub()
	go wsHub.Run()

	// Setup services and handlers
	authRepo := auth.NewAuthRepository(postgresDB)
	authService := auth.NewAuthService(authRepo, config.App.JWTSecret, config.App.JWTExpire)
	authHandler := auth.NewAuthHandler(authService)

	// userRepo := user.NewPostgresRepository(postgresDB)
	// userService := user.NewService(userRepo)
	// userHandler := user.NewHandler(userService)

	channelRepo := channel.NewChannelRepository(postgresDB)
	channelService := channel.NewChannelService(channelRepo)
	channelHandler := channel.NewChannelHandler(channelService)

	// messageRepo := message.NewMongoRepository(mongoDB)
	// messageService := message.NewService(messageRepo)
	// messageHandler := message.NewHandler(messageService, wsHub)

	categoryService := category.NewCategoryService(postgresDB)
	categoryHandler := category.NewCategoryHandler(categoryService)

	directMsgRepo := directmsg.NewDirectMsgRepo(mongoDB)
	directMsgService := directmsg.NewDirectMsgService(directMsgRepo)

	// Setup router
	router := gin.Default()
	// router.Use(middleware.CORSMiddleware())

	api := router.Group("/api")
	{
		// Auth routes
		authGroup := api.Group("/auth")
		{
			authGroup.POST("/register", authHandler.Register)
			authGroup.POST("/login", authHandler.Login)
			// authGroup.GET("/google", authHandler.GoogleLogin)
			// authGroup.GET("/google/callback", authHandler.GoogleCallback)
			// authGroup.POST("/refresh", authHandler.RefreshToken)
		}

		// Authenticated routes
		// authMiddleware := middleware.JWTAuth()(authService)
		authenticated := api.Group("/")
		// authenticated.Use(authMiddleware)
		{
			// User routes
			// userGroup := authenticated.Group("/users")
			// {
			// 	userGroup.GET("/me", userHandler.GetMe)
			// 	userGroup.GET("/search", userHandler.SearchUsers)
			// }

			// Channel routes
			channelGroup := authenticated.Group("/channels")
			{
				channelGroup.GET("/", channelHandler.GetAll)
				channelGroup.POST("/", channelHandler.Create)
				channelGroup.PUT("/:id", channelHandler.Update)
				channelGroup.DELETE("/:id", channelHandler.Delete)
			}

			// Category routes
			categoryGroup := authenticated.Group("/categories")
			{
				categoryGroup.GET("/", categoryHandler.GetAllCategories)
				categoryGroup.POST("/", categoryHandler.CreateNewCategory)
				categoryGroup.PUT("/:id", categoryHandler.UpdateCategory)
				categoryGroup.DELETE("/:id", categoryHandler.DeleteCategory)
			}

			// Message routes
			// messageGroup := authenticated.Group("/messages")
			// {
			// 	messageGroup.GET("/", messageHandler.GetChannelMessages)
			// 	messageGroup.GET("/direct", messageHandler.GetDirectMessages)
			// 	messageGroup.POST("/", messageHandler.CreateMessage)
			// }

			// WebSocket route
			router.GET("/ws", ws.ServeWs(wsHub))
			router.POST("/dm/send", directmsg.SendDirectMessage(directMsgService, wsHub)) // optional REST endpoint
		}
	}

	return &App{
		router:      router,
		postgresDB:  postgresDB,
		mongoDB:     mongoDB,
		authHandler: authHandler,
		wsHub:       wsHub,
	}, nil
}

func (a *App) Run() error {
	return a.router.Run(":" + "8080")
}
