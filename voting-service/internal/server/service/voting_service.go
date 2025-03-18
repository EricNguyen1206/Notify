package service

import (
	"context"
	"encoding/json"
	"voting-service/internal/adapters/websocket"
	"voting-service/internal/ports/models"
	"voting-service/internal/server/repository"
)

type VoteService struct {
	voteRepo *repository.VoteRepository
	hub      *websocket.Hub
}

func NewVoteService(voteRepo *repository.VoteRepository, hub *websocket.Hub) *VoteService {
	return &VoteService{voteRepo: voteRepo, hub: hub}
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

	// Get updated vote count
	count, err := s.voteRepo.GetVoteCount(ctx, req.OptionID)
	if err != nil {
		return err
	}

	// Broadcast vote update
	update := map[string]interface{}{
		"option_id":  req.OptionID,
		"vote_count": count,
	}
	message, _ := json.Marshal(update)
	s.hub.Broadcast <- message

	return nil
}
