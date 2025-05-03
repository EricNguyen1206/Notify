package repository

import (
	"chat-service/internal/ports/models"
	"context"

	"gorm.io/gorm"
)

type VoteRepository struct {
	db *gorm.DB
}

func NewVoteRepository(db *gorm.DB) *VoteRepository {
	return &VoteRepository{db: db}
}

// CastVote records a user's vote for an option
func (r *VoteRepository) CastVote(ctx context.Context, vote *models.Vote) error {
	return r.db.WithContext(ctx).Create(vote).Error
}

// GetVoteCount retrieves the vote count for an option
func (r *VoteRepository) GetVoteCount(ctx context.Context, optionID uint) (uint, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.Vote{}).Where("option_id = ?", optionID).Count(&count).Error
	return uint(count), err
}
