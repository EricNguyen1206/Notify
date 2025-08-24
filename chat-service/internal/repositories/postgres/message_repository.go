package postgres

import (
	"chat-service/internal/models"

	"gorm.io/gorm"
)

type ChatRepository struct {
	db *gorm.DB
}

func NewChatRepository(db *gorm.DB) *ChatRepository {
	return &ChatRepository{db}
}

func (r *ChatRepository) Create(chat *models.Chat) error {
	return r.db.Create(chat).Error
}

func (r *ChatRepository) GetFriendMessages(userID, friendID uint) ([]*models.Chat, error) {
	var chats []*models.Chat
	err := r.db.Where("(sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)",
		userID, friendID, friendID, userID).
		Order("created_at").
		Find(&chats).Error
	return chats, err
}

func (r *ChatRepository) FindByID(id uint) (*models.Chat, error) {
	var chat models.Chat
	err := r.db.Preload("Sender").First(&chat, "id = ?", id).Error
	return &chat, err
}

func (r *ChatRepository) FindByUserID(userID uint) ([]*models.Chat, error) {
	var chats []*models.Chat
	err := r.db.Where("user_id = ?", userID).Find(&chats).Error
	return chats, err
}

func (r *ChatRepository) FindByChannelID(channelID uint) ([]*models.Chat, error) {
	var chats []*models.Chat
	err := r.db.Where("channel_id = ?", channelID).Find(&chats).Error
	return chats, err
}

func (r *ChatRepository) FindByFriendID(friendID uint) ([]*models.Chat, error) {
	var chats []*models.Chat
	err := r.db.Where("friend_id = ?", friendID).Find(&chats).Error
	return chats, err
}

func (r *ChatRepository) Delete(id uint) error {
	return r.db.Delete(&models.Chat{}, "id = ?", id).Error
}
