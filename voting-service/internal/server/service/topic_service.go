package service

import (
	"context"
	"fmt"

	"voting-service/internal/adapters/database"
	"voting-service/internal/ports/models"
	"voting-service/internal/server/repository"
)

type TopicService struct {
	topicRepo *repository.TopicRepository
	minio     *database.MinIOClient
}

func NewTopicService(topicRepo *repository.TopicRepository, minio *database.MinIOClient) *TopicService {
	return &TopicService{
		topicRepo: topicRepo,
		minio:     minio,
	}
}

// CreateTopic creates a new topic with an uploaded image
func (s *TopicService) CreateTopic(ctx context.Context, req models.CreateTopicRequest) (*models.Topic, error) {
	// Upload image to MinIO

	// Create topic
	topic := &models.Topic{
		Title:       req.Title,
		Description: req.Description,
		StartTime:   req.StartTime,
		EndTime:     req.EndTime,
	}

	if err := s.topicRepo.CreateTopic(ctx, topic); err != nil {
		return nil, fmt.Errorf("failed to create topic: %w", err)
	}

	return topic, nil
}

func (s *TopicService) GetAllTopics(ctx context.Context) ([]*models.Topic, error) {
	// Get all topics
	topics, err := s.topicRepo.GetTopics(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get topics: %w", err)
	}
	return topics, nil
}
