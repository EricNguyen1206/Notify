package main

import (
	"chat-service/internal/config"
	"chat-service/internal/database"
	"chat-service/internal/models"
	"fmt"
	"log"
	"log/slog"

	"gorm.io/gorm"
)

func main() {
	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatal("Failed to load config:", err)
	}

	slog.Info("Starting database migration...")

	// Connect to database
	db, err := database.NewPostgresConnection(cfg.Database.URI)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	slog.Info("Database connection established")

	// Auto migrate the schema
	slog.Info("Running GORM auto-migration...")

	// Get the underlying *sql.DB for better control
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatal("Failed to get database instance:", err)
	}

	// Test the connection
	if err := sqlDB.Ping(); err != nil {
		log.Fatal("Failed to ping database:", err)
	}

	// Run auto migration for all models (order matters for foreign keys)
	slog.Info("Migrating User model...")
	if err := db.AutoMigrate(&models.User{}); err != nil {
		log.Fatal("Failed to migrate User model:", err)
	}

	slog.Info("Migrating Channel model...")
	if err := db.AutoMigrate(&models.Channel{}); err != nil {
		log.Fatal("Failed to migrate Channel model:", err)
	}

	slog.Info("Migrating Chat (message) model...")
	if err := db.AutoMigrate(&models.Chat{}); err != nil {
		log.Fatal("Failed to migrate Chat model:", err)
	}

	// Create indexes for better performance
	slog.Info("Creating database indexes...")
	if err := createIndexes(db); err != nil {
		log.Fatal("Failed to create indexes:", err)
	}

	slog.Info("Database migration completed successfully!")
}

func createIndexes(db *gorm.DB) error {
	// Create indexes for better query performance
	indexes := []string{
		"CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);",
		"CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);",
		"CREATE INDEX IF NOT EXISTS idx_channels_owner_id ON channels (owner_id);",
		"CREATE INDEX IF NOT EXISTS idx_channels_type ON channels (type);",
		"CREATE INDEX IF NOT EXISTS idx_chats_sender_id ON chats (sender_id);",
		"CREATE INDEX IF NOT EXISTS idx_chats_receiver_id ON chats (receiver_id);",
		"CREATE INDEX IF NOT EXISTS idx_chats_channel_id ON chats (channel_id);",
		"CREATE INDEX IF NOT EXISTS idx_chats_created_at ON chats (created_at);",
	}

	for _, indexSQL := range indexes {
		slog.Info("Creating index", "sql", indexSQL)
		if err := db.Exec(indexSQL).Error; err != nil {
			return fmt.Errorf("failed to create index: %v", err)
		}
	}

	return nil
}
