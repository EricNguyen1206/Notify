package database

import (
	"chat-service/internal/auth"
	"fmt"

	"gorm.io/gorm"
)

// Migrate runs database migrations for all models
func Migrate(db *gorm.DB) error {
	// List all models to migrate
	modelsToMigrate := []interface{}{
		&auth.UserModel{},
	}

	// Run migrations
	for _, model := range modelsToMigrate {
		if err := db.AutoMigrate(model); err != nil {
			return fmt.Errorf("failed to migrate model: %w", err)
		}
	}

	return nil
}
