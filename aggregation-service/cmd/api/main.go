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

	// Start services
	consumerService := services.NewVoteConsumerService(cfg, rdb, db)
	go consumerService.Start()

	voteCountService := services.NewVoteCountService(cfg, rdb)
	router := gin.Default()
	voteCountService.RegisterRoutes(router)

	// Start API server
	log.Fatal(router.Run(":" + "8080"))
}
