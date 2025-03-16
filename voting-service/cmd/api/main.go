package main

import (
	"log"

	"voting-service/internal/adapters/database"
	"voting-service/internal/config"
	"voting-service/internal/server"
)

func main() {
	// Load configuration
	cfg := config.LoadConfig()

	// Initialize database
	db, err := database.NewMySQLDB(cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Run database migrations
	if err := database.Migrate(db); err != nil {
		log.Fatalf("Failed to run database migrations: %v", err)
	}

	// Initialize server
	srv := server.NewServer(db)

	// Start server
	log.Printf("Server is running on port %s\n", cfg.Port)
	if err := srv.Start(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
