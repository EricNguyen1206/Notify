package router

import (
	"chat-service/configs"
	"chat-service/configs/database"
	"chat-service/configs/middleware"
	"chat-service/internal/user"
	"chat-service/internal/ws"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type App struct {
	router     *gin.Engine
	postgresDB *gorm.DB
	// mongoDB      *database.MongoDB
	websocketHub *ws.Hub
}

func NewApp() (*App, error) {
	config := configs.Load()
	// Initialize databases
	postgresDB, err := database.NewPostgresConnection()
	if err != nil {
		return nil, err
	}
	database.InitRedis()

	// mongoDB, err := database.NewMongoConnection()
	// if err != nil {
	// 	return nil, err
	// }

	// Initialize WebSocket hub
	// websocketHub := ws.NewHub()
	// wsHandler := ws.NewWsHandler(websocketHub)
	// go websocketHub.Run()

	// Initialize user domain
	userRepo := user.NewUserRepository(postgresDB)
	userService := user.NewUserService(userRepo, config.App.JWTSecret, database.RedisClient)
	userHandler := user.NewUserHandler(userService, database.RedisClient)

	// Initialize category domain
	// categoryRepo := category.NewCategoryRepository(postgresDB)
	// categoryService := category.NewCategoryService(categoryRepo)
	// categoryHandler := category.NewCategoryHandler(categoryService)

	// Initialize server domain
	// serverRepo := server.NewServerRepository(postgresDB)
	// serverService := server.NewServerService(serverRepo)
	// serverHandler := server.NewServerHandler(serverService)

	// Setup router
	router := gin.Default()
	router.Use(middleware.CORS())
	// wsHandler.RegisterRoutes(router)

	// Register routes
	api := router.Group("/api")
	{
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"status": "UP",
			})
		})

		userHandler.RegisterRoutes(api)
		// categoryHandler.RegisterRoutes(api)
		// serverHandler.RegisterRoutes(api)
	}

	return &App{
		router:     router,
		postgresDB: postgresDB,
		// mongoDB:      mongoDB,
		// websocketHub: websocketHub,
	}, nil
}

func (a *App) Run() error {
	return a.router.Run(":" + "8080")
}
