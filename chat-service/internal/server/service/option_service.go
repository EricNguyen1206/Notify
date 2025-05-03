package service

import (
	"chat-service/internal/ports/models"
	"chat-service/internal/server/repository"
	"context"
)

type OptionService struct {
	optionRepo *repository.OptionRepository
}

func NewOptionService(optionRepo *repository.OptionRepository) *OptionService {
	return &OptionService{optionRepo: optionRepo}
}

// AddOption adds a new option to a topic
func (s *OptionService) AddOption(ctx context.Context, req models.AddOptionRequest) (*models.Option, error) {
	option := &models.Option{
		TopicID:  req.TopicID,
		Title:    req.Title,
		ImageURL: req.ImageURL,
		Link:     req.Link,
	}

	if err := s.optionRepo.AddOption(ctx, option); err != nil {
		return nil, err
	}

	return option, nil
}

// GetOptionsByTopic retrieves all options for a topic
func (s *OptionService) GetOptionsByTopic(ctx context.Context, topicID uint) ([]models.Option, error) {
	return s.optionRepo.GetOptionsByTopic(ctx, topicID)
}
