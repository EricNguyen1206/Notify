package service

import (
	"context"
	"voting-service/internal/ports/models"
	"voting-service/internal/server/repository"
)

type VotingService struct {
	repo repository.VotingRepository
}

func NewVotingService(repo repository.VotingRepository) *VotingService {
	return &VotingService{repo: repo}
}

// func (s *VotingService) CreateTopic(ctx context.Context, req models.CreateTopicRequest) (*models.Topic, error) {
// 	startTime, err := time.Parse(time.RFC3339, req.StartTime)
// 	if err != nil {
// 		return nil, fmt.Errorf("invalid start time format: %w", err)
// 	}

// 	endTime, err := time.Parse(time.RFC3339, req.EndTime)
// 	if err != nil {
// 		return nil, fmt.Errorf("invalid end time format: %w", err)
// 	}

// 	topic := &models.Topic{
// 		Title:       req.Title,
// 		Description: req.Description,
// 		StartTime:   startTime,
// 		EndTime:     endTime,
// 	}

// 	if err := s.repo.CreateTopic(ctx, topic); err != nil {
// 		return nil, err
// 	}

// 	return topic, nil
// }

// func (s *VotingService) AddOption(ctx context.Context, topicID string, req dao.AddOptionRequest) error {
// 	option := &models.Option{
// 		TopicID:  topicID,
// 		Title:    req.Title,
// 		ImageURL: req.ImageURL,
// 		Link:     req.Link,
// 	}

// 	return s.repo.AddOption(ctx, option)
// }

func (s *VotingService) CastVote(ctx context.Context, voterID, topicID, optionID uint) error {
	vote := &models.Vote{
		TopicID:  topicID,
		OptionID: optionID,
		UserID:   voterID,
	}

	return s.repo.RecordVote(ctx, vote)
}
