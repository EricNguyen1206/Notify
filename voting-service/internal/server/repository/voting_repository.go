package repository

import (
	"context"
	"voting-service/internal/ports/models"
)

type VotingRepository interface {
	// Topics
	CreateTopic(ctx context.Context, topic *models.Topic) error
	GetTopicByID(ctx context.Context, id string) (*models.Topic, error)
	ListActiveTopics(ctx context.Context) ([]models.Topic, error)

	// Options
	AddOption(ctx context.Context, option *models.Option) error
	GetOptionsByTopic(ctx context.Context, topicID string) ([]models.Option, error)

	// Votes
	RecordVote(ctx context.Context, vote *models.Vote) error
	GetVoteCount(ctx context.Context, optionID string) (int, error)
	GetVoterHistory(ctx context.Context, voterID string) ([]models.Vote, error)

	// Results
	GetTopicResults(ctx context.Context, topicID string) ([]models.Option, error)
}
