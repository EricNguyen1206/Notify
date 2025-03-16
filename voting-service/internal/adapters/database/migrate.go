package database

import (
	"fmt"
	"voting-service/internal/ports/models"

	"gorm.io/gorm"
)

// Migrate runs database migrations for all models
func Migrate(db *gorm.DB) error {
	// List all models to migrate
	modelsToMigrate := []interface{}{
		&models.User{},
		&models.Topic{},
		&models.Option{},
		&models.Vote{},
	}

	// Run migrations
	for _, model := range modelsToMigrate {
		if err := db.AutoMigrate(model); err != nil {
			return fmt.Errorf("failed to migrate model: %w", err)
		}
	}

	return nil
}
