package repository

import (
	"chat-service/internal/ports/models"
	"context"

	"gorm.io/gorm"
)

type TopicRepository struct {
	db *gorm.DB
}

func NewTopicRepository(db *gorm.DB) *TopicRepository {
	return &TopicRepository{db: db}
}

// CreateTopic creates a new topic in the database
func (r *TopicRepository) CreateTopic(ctx context.Context, topic *models.Topic) error {
	return r.db.WithContext(ctx).Create(topic).Error
}

// GetTopics retrieves all topics from the database
func (r *TopicRepository) GetTopics(ctx context.Context) ([]*models.Topic, error) {
	var topics []*models.Topic
	if err := r.db.WithContext(ctx).Find(&topics).Error; err != nil {
		return nil, err
	}
	return topics, nil
}
