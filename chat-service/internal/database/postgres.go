package database

import (
	"database/sql"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"chat-service/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func NewPostgresConnection(dburi string) (*gorm.DB, error) {
	// Configure GORM with even more strict settings for statement handling
	slog.Info("Connecting to database...", "dburi", dburi)
	db, err := gorm.Open(postgres.Open(dburi), &gorm.Config{
		DisableForeignKeyConstraintWhenMigrating: true,
		PrepareStmt:                              false, // Explicitly disable prepared statements
		SkipDefaultTransaction:                   true,  // Skip default transaction for better performance
		AllowGlobalUpdate:                        false, // Safety measure
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %v", err)
	}

	// Get underlying *sql.DB
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get database instance: %v", err)
	}

	// Additional cleanup of stale connections
	if err := cleanupStaleConnections(sqlDB); err != nil {
		slog.Warn("Warning: failed to cleanup stale connections", "error", err)
	}

	// Auto migrate the schema with proper error handling
	err = db.AutoMigrate(
		&models.User{},
		&models.Channel{},
		&models.Chat{},
	)
	if err != nil {
		// Check if the error is about existing tables
		if strings.Contains(err.Error(), "already exists") {
			// If tables exist, we can continue as the schema is already set up
			slog.Info("Tables already exist, continuing with existing schema")
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
