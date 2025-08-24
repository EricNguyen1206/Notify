package postgres

import (
	"chat-service/internal/models"

	"gorm.io/gorm"
)

type ChannelRepository struct {
	db *gorm.DB
}

func NewChannelRepository(db *gorm.DB) *ChannelRepository {
	return &ChannelRepository{db}
}

func (r *ChannelRepository) Create(channel *models.Channel) error {
	return r.db.Create(channel).Error
}

func (r *ChannelRepository) Update(channel *models.Channel) error {
	return r.db.Save(channel).Error
}

func (r *ChannelRepository) Delete(channelID uint) error {
	// First, clear the many-to-many association to ensure cascade deletion
	err := r.db.Model(&models.Channel{Model: gorm.Model{ID: channelID}}).Association("Members").Clear()
	if err != nil {
		return err
	}

	// Then delete the channel
	return r.db.Delete(&models.Channel{}, channelID).Error
}

func (r *ChannelRepository) GetAllChannels() ([]models.Channel, error) {
	var c []models.Channel
	err := r.db.Preload("Members", func(db *gorm.DB) *gorm.DB {
		return db.Select("id, username, email, created_at, updated_at, deleted_at")
	}).Find(&c).Error
	return c, err
}

func (r *ChannelRepository) GetAllUserChannels(userID uint) ([]models.Channel, error) {
	var c []models.Channel
	err := r.db.
		Preload("Members", func(db *gorm.DB) *gorm.DB {
			return db.Select("id, username, email, created_at, updated_at, deleted_at")
		}).
		Joins("JOIN channel_members ON channels.id = channel_members.channel_id").
		Where("channel_members.user_id = ?", userID).
		Find(&c).Error
	return c, err
}

func (r *ChannelRepository) GetByID(channelID uint) (*models.Channel, error) {
	var c models.Channel
	err := r.db.Preload("Members", func(db *gorm.DB) *gorm.DB {
		return db.Select("id, username, email, created_at, updated_at, deleted_at")
	}).First(&c, channelID).Error
	return &c, err
}

func (r *ChannelRepository) AddUser(channelID uint, userID uint) error {
	return r.db.Model(&models.Channel{Model: gorm.Model{ID: channelID}}).Association("Members").Append(&models.User{Model: gorm.Model{ID: userID}})
}

func (r *ChannelRepository) RemoveUser(channelID uint, userID uint) error {
	return r.db.Model(&models.Channel{Model: gorm.Model{ID: channelID}}).Association("Members").Delete(&models.User{Model: gorm.Model{ID: userID}})
}

func (r *ChannelRepository) GetChatMessages(channelID uint) ([]models.Chat, error) {
	var messages []models.Chat
	err := r.db.
		Where("channel_id = ?", channelID).
		Order("created_at ASC").
		Find(&messages).Error
	return messages, err
}

// GetChatMessagesWithPagination returns chat messages for a channel with pagination and time-based infinite scroll
func (r *ChannelRepository) GetChatMessagesWithPagination(channelID uint, limit int, before *int64) ([]models.ChatResponse, error) {
	var chatResponses []models.ChatResponse
	db := r.db.Table("chats").
		Select(`chats.id, chats.text, chats.sender_id, users.username as sender_name, users.avatar as sender_avatar, chats.url, chats.file_name, chats.created_at, chats.channel_id`).
		Joins("JOIN users ON users.id = chats.sender_id").
		Where("chats.channel_id = ?", channelID)

	if limit <= 0 || limit > 100 {
		limit = 20 // default limit
	}

	if before != nil {
		// When "before" is provided, get messages before that timestamp in ascending order
		db = db.Where("chats.created_at < to_timestamp(?)", *before).
			Order("chats.created_at ASC").
			Limit(limit)
	} else {
		// When no "before" parameter, get the latest messages in descending order, then reverse
		db = db.Order("chats.created_at DESC").Limit(limit)
	}

	err := db.Scan(&chatResponses).Error
	if err != nil {
		return nil, err
	}

	// If no "before" parameter was provided, reverse the slice to maintain chronological order
	if before == nil {
		for i, j := 0, len(chatResponses)-1; i < j; i, j = i+1, j-1 {
			chatResponses[i], chatResponses[j] = chatResponses[j], chatResponses[i]
		}
	}

	return chatResponses, nil
}
