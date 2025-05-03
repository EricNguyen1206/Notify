package service

import (
	"chat-service/internal/ports/models"
	"chat-service/internal/server/repository"
	"context"
)

type VoteService struct {
	voteRepo *repository.VoteRepository
}

func NewVoteService(voteRepo *repository.VoteRepository) *VoteService {
	return &VoteService{voteRepo: voteRepo}
}

// CastVote records a user's vote and broadcasts the update
func (s *VoteService) CastVote(ctx context.Context, userID uint, req models.VoteRequest) error {
	vote := &models.Vote{
		UserID:   userID,
		TopicID:  req.TopicID,
		OptionID: req.OptionID,
	}

	if err := s.voteRepo.CastVote(ctx, vote); err != nil {
		return err
	}

	return nil
}
