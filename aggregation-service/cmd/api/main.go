package main

import (
	"aggregation-service/configs"
	"aggregation-service/internal/services"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	// Load config
	cfg := configs.Load()

	// Init Redis
	rdb := redis.NewClient(&redis.Options{
		Addr:     cfg.Redis.Addr,
		Password: cfg.Redis.Password,
		DB:       cfg.Redis.DB,
	})

	// Init MySQL
	db, err := gorm.Open(mysql.Open(cfg.MySQL.DSN), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Create services
	voteCountSvc := services.NewVoteCountService(cfg, rdb)
	consumerSvc := services.NewVoteConsumerService(cfg, rdb, db, voteCountSvc)

	// Start consumer
	go consumerSvc.Start()

	// Start API server
	router := gin.Default()
	// Health check route
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
	voteCountSvc.RegisterRoutes(router)
	log.Fatal(router.Run(":" + cfg.App.Port))
}
