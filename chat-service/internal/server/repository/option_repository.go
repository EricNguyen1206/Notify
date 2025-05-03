package repository

import (
	"chat-service/internal/ports/models"
	"context"

	"gorm.io/gorm"
)

type OptionRepository struct {
	db *gorm.DB
}

func NewOptionRepository(db *gorm.DB) *OptionRepository {
	return &OptionRepository{db: db}
}

// AddOption adds a new option to a topic
func (r *OptionRepository) AddOption(ctx context.Context, option *models.Option) error {
	return r.db.WithContext(ctx).Create(option).Error
}

// GetOptionsByTopic retrieves all options for a topic
func (r *OptionRepository) GetOptionsByTopic(ctx context.Context, topicID uint) ([]models.Option, error) {
	var options []models.Option
	err := r.db.WithContext(ctx).Where("topic_id = ?", topicID).Find(&options).Error
	return options, err
}
