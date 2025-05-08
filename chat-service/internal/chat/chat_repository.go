package chat

import (
	"chat-service/internal/models"
	"context"

	"gorm.io/gorm"
)

type ChatRepository interface {
	Create(ctx context.Context, chat *models.Chat) error
	FindByID(ctx context.Context, id string) (*models.Chat, error)
	FindByUserID(ctx context.Context, userID string) ([]*models.Chat, error)
	FindByServerID(ctx context.Context, serverID string) ([]*models.Chat, error)
	FindByChannelID(ctx context.Context, channelID string) ([]*models.Chat, error)
	FindByFriendID(ctx context.Context, friendID string) ([]*models.Chat, error)
	Delete(ctx context.Context, id string) error
}

type chatRepository struct {
	db *gorm.DB
}

func NewChatRepository(db *gorm.DB) ChatRepository {
	return &chatRepository{db: db}
}

func (r *chatRepository) Create(ctx context.Context, chat *models.Chat) error {
	return r.db.WithContext(ctx).Create(chat).Error
}

func (r *chatRepository) FindByID(ctx context.Context, id string) (*models.Chat, error) {
	var chat models.Chat
	err := r.db.WithContext(ctx).First(&chat, "id = ?", id).Error
	return &chat, err
}

func (r *chatRepository) FindByUserID(ctx context.Context, userID string) ([]*models.Chat, error) {
	var chats []*models.Chat
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).Find(&chats).Error
	return chats, err
}

func (r *chatRepository) FindByServerID(ctx context.Context, serverID string) ([]*models.Chat, error) {
	var chats []*models.Chat
	err := r.db.WithContext(ctx).Where("server_id = ?", serverID).Find(&chats).Error
	return chats, err
}

func (r *chatRepository) FindByChannelID(ctx context.Context, channelID string) ([]*models.Chat, error) {
	var chats []*models.Chat
	err := r.db.WithContext(ctx).Where("channel_id = ?", channelID).Find(&chats).Error
	return chats, err
}

func (r *chatRepository) FindByFriendID(ctx context.Context, friendID string) ([]*models.Chat, error) {
	var chats []*models.Chat
	err := r.db.WithContext(ctx).Where("friend_id = ?", friendID).Find(&chats).Error
	return chats, err
}

func (r *chatRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&models.Chat{}, "id = ?", id).Error
}
