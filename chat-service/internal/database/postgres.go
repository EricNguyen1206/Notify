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
)

func NewPostgresConnection(dburi string) (*gorm.DB, error) {
	// Configure GORM with even more strict settings for statement handling
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
		log.Printf("TEST Warning: failed to cleanup stale connections: %v", err)
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

// handlePreMigration handles existing data before running migrations
func handlePreMigration(db *gorm.DB) error {
	// Check if users table exists
	var exists bool
	err := db.Raw("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')").Scan(&exists).Error
	if err != nil {
		return err
	}

	if !exists {
		// Table doesn't exist, no need to handle pre-migration
		return nil
	}

	// Check if username column exists
	var columnExists bool
	err = db.Raw("SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'username')").Scan(&columnExists).Error
	if err != nil {
		return err
	}

	if !columnExists {
		// Add username column without constraint first
		log.Println("Adding username column...")
		err = db.Exec("ALTER TABLE users ADD COLUMN username TEXT").Error
		if err != nil {
			return err
		}
	}

	// Update existing rows to have meaningful usernames
	log.Println("Updating existing users with default usernames...")
	err = db.Exec("UPDATE users SET username = 'user_' || id::text WHERE username IS NULL OR username = ''").Error
	if err != nil {
		return err
	}

	// Check and handle existing constraints
	if err := handleExistingConstraints(db); err != nil {
		log.Printf("Warning: Failed to handle existing constraints: %v", err)
	}

	// Handle column type conflicts
	if err := handleColumnTypeConflicts(db); err != nil {
		log.Printf("Warning: Failed to handle column type conflicts: %v", err)
	}

	return nil
}

// handleExistingConstraints handles existing constraints that might conflict with migration
func handleExistingConstraints(db *gorm.DB) error {
	// Check if email constraint exists with different name
	var constraintExists bool
	err := db.Raw(`
		SELECT EXISTS (
			SELECT 1 FROM information_schema.table_constraints 
			WHERE table_name = 'users' 
			AND constraint_type = 'UNIQUE'
			AND constraint_name LIKE '%email%'
		)
	`).Scan(&constraintExists).Error
	if err != nil {
		return err
	}

	if constraintExists {
		// Drop existing email constraint if it exists
		log.Println("Dropping existing email constraint...")
		// Find the actual constraint name
		var constraintName string
		err = db.Raw(`
			SELECT constraint_name FROM information_schema.table_constraints 
			WHERE table_name = 'users' 
			AND constraint_type = 'UNIQUE'
			AND constraint_name LIKE '%email%'
			LIMIT 1
		`).Scan(&constraintName).Error
		if err == nil && constraintName != "" {
			// Drop the constraint
			dropSQL := fmt.Sprintf("ALTER TABLE users DROP CONSTRAINT IF EXISTS %s", constraintName)
			if err := db.Exec(dropSQL).Error; err != nil {
				log.Printf("Warning: Failed to drop constraint %s: %v", constraintName, err)
			}
		}
	}

	return nil
}

// handleColumnTypeConflicts handles column type changes needed before running migrations
func handleColumnTypeConflicts(db *gorm.DB) error {
	// Handle ChannelID in Chats Table
	var columnType string
	err := db.Raw("SELECT data_type FROM information_schema.columns WHERE table_name = 'chats' AND column_name = 'channel_id'").Scan(&columnType).Error
	if err != nil {
		return err
	}

	if columnType == "uuid" {
		log.Println("Changing ChannelID column type from UUID to BIGINT...")
		// Remove foreign key if exists
		if err := db.Exec("ALTER TABLE chats DROP CONSTRAINT IF EXISTS fk_channel_channel_id").Error; err != nil {
			return err
		}

		// Change the column type
		if err := db.Exec("ALTER TABLE chats ALTER COLUMN channel_id TYPE BIGINT USING channel_id::bigint").Error; err != nil {
			return err
		}

		// Add foreign key back
		log.Println("Re-adding foreign key constraint...")
		fkSQL := "ALTER TABLE chats ADD CONSTRAINT fk_channel_channel_id FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE"
		if err := db.Exec(fkSQL).Error; err != nil {
			return err
		}
	}

	return nil
}

// ensureChatTableCompatibility ensures chat table exists with correct schema
func ensureChatTableCompatibility(db *gorm.DB) error {
	// Check if chats table exists
	var exists bool
	err := db.Raw("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'chats')").Scan(&exists).Error
	if err != nil {
		return err
	}

	if exists {
		// Check if column types are incompatible
		var channelIDType string
		err = db.Raw("SELECT data_type FROM information_schema.columns WHERE table_name = 'chats' AND column_name = 'channel_id'").Scan(&channelIDType).Error
		if err == nil && channelIDType == "uuid" {
			log.Println("Chat table has incompatible UUID columns, skipping auto-migration for now")
			return nil // Skip for now to allow app to start
		}
	}

	// If table doesn't exist or has compatible types, migrate normally
	if err := db.AutoMigrate(&models.Chat{}); err != nil {
		log.Printf("Warning: Failed to migrate chat table: %v", err)
		return err
	}

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
