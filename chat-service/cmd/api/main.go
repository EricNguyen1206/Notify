package main

import (
	"log"

	"chat-service/configs"
	"chat-service/internal/adapters/database"
	"chat-service/internal/server"
)

func main() {
	// Load configuration
	cfg := configs.Load()

	// Initialize database
	db, mySqlErr := database.NewMySQLDB(cfg.MySQL.DBUser, cfg.MySQL.DBPassword, cfg.MySQL.DBHost, cfg.MySQL.DBPort, cfg.MySQL.DBName)
	if mySqlErr != nil {
		log.Fatalf("Failed to connect to database: %v", mySqlErr)
	}

	// Run database migrations
	if dbMigrateErr := database.Migrate(db); dbMigrateErr != nil {
		log.Fatalf("Failed to run database migrations: %v", dbMigrateErr)
	}

	// Initialize MinIO client
	minioClient, minIOErr := database.NewMinIOClient(
		cfg.MinIO.Endpoint, // MinIO endpoint
		cfg.MinIO.User,     // MinIO access key
		cfg.MinIO.Password, // MinIO secret key
		cfg.MinIO.Bucket,   // Bucket name
	)
	if minIOErr != nil {
		log.Fatalf("Failed to initialize MinIO client: %v", minIOErr)
	}

	// Initialize server
	srv := server.NewServer(db, minioClient)

	// Start server
	if err := srv.Start(":" + cfg.App.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
