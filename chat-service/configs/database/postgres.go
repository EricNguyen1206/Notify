package database

import (
	"database/sql"
	"fmt"
	"log"
	"strings"
	"time"

	"chat-service/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	// "gorm.io/gorm/logger"
)

func NewPostgresConnection() (*gorm.DB, error) {
	// user := "postgres.fnpwltjofxlcwvqqzgak"
	user := "postgres"
	// password := "1206Trongtin!"
	password := "password"
	// host := "aws-0-ap-southeast-1.pooler.supabase.com"
	host := "localhost"
	// port := "6543"
	port := "5432"
	dbname := "postgres"

	// Add statement_cache_mode=describe to disable prepared statement caching
	// dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=require statement_cache_mode=describe",
	// 	host, user, password, dbname, port)
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		host, user, password, dbname, port)

	// Configure GORM with even more strict settings for statement handling
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		DisableForeignKeyConstraintWhenMigrating: true,
		PrepareStmt:                              false, // Explicitly disable prepared statements
		SkipDefaultTransaction:                   true,  // Skip default transaction for better performance
		// Logger:                                   logger.Default.LogMode(logger.Info),
		AllowGlobalUpdate: false, // Safety measure
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %v", err)
	}

	// Get underlying *sql.DB
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get database instance: %v", err)
	}

	// Aggressively clean connections first
	sqlDB.SetMaxIdleConns(0)           // Force close all idle connections
	sqlDB.SetMaxOpenConns(10)          // Reduce maximum connections temporarily
	time.Sleep(100 * time.Millisecond) // Give connections time to close

	// Set optimized connection pool settings
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(50) // Reduced to prevent too many connections
	sqlDB.SetConnMaxLifetime(time.Hour)
	sqlDB.SetConnMaxIdleTime(30 * time.Minute) // Close idle connections after 30 minutes

	// Additional cleanup of stale connections
	if err := cleanupStaleConnections(sqlDB); err != nil {
		log.Printf("TEST Warning: failed to cleanup stale connections: %v", err)
	}

	// Enable UUID extension
	if err := db.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"").Error; err != nil {
		return nil, fmt.Errorf("failed to create uuid extension: %v", err)
	}

	// Auto migrate the schema with proper error handling
	err = db.AutoMigrate(
		&models.User{},
		// &models.Server{},
		// &models.Category{},
		// &models.Channel{},
		// &models.Chat{},
		&models.Friend{},
		// &models.FriendPending{},
		// &models.DirectMessage{},
		// &models.JoinServer{},
	)
	if err != nil {
		// Check if the error is about existing tables
		if strings.Contains(err.Error(), "already exists") {
			// If tables exist, we can continue as the schema is already set up
			log.Println("Tables already exist, continuing with existing schema")
		} else {
			return nil, fmt.Errorf("failed to migrate database: %v", err)
		}
	}

	// Add indexes
	if err := addIndexes(db); err != nil {
		return nil, fmt.Errorf("failed to add indexes: %v", err)
	}

	return db, nil
}

// cleanupStaleConnections helps prevent statement cache issues
func cleanupStaleConnections(db *sql.DB) error {
	// Force close all connections
	db.SetMaxIdleConns(0)
	db.SetMaxOpenConns(0)
	time.Sleep(100 * time.Millisecond)

	// Restore normal limits
	db.SetMaxIdleConns(10)
	db.SetMaxOpenConns(50)

	return nil
}

func addIndexes(db *gorm.DB) error {
	// Add indexes for better query performance
	indexes := []struct {
		table   string
		columns []string
	}{
		{"users", []string{"email"}},
		// {"servers", []string{"owner"}},
		// {"categories", []string{"server_id"}},
		// {"channels", []string{"category_id"}},
		// {"friend_pending", []string{"sender_email", "receiver_email"}},
		// {"friends", []string{"sender_email", "receiver_email"}},
		// {"direct_messages", []string{"owner_email", "friend_email"}},
		// {"join_server", []string{"server_id", "user_id"}},
		// {"chats", []string{"user_id"}},
		// {"chats", []string{"server_id", "channel_id"}},
	}

	for _, idx := range indexes {
		for _, column := range idx.columns {
			indexName := fmt.Sprintf("idx_%s_%s", idx.table, column)
			if err := db.Exec(fmt.Sprintf("CREATE INDEX IF NOT EXISTS %s ON %s (%s)",
				indexName, idx.table, column)).Error; err != nil {
				return err
			}
		}
	}

	return nil
}
