package services

import (
	"chat-service/internal/models"
	"chat-service/internal/repositories/postgres"
	"errors"
	"fmt"

	"gorm.io/gorm"
)

type ChannelService struct {
	repo     *postgres.ChannelRepository
	userRepo *postgres.UserRepository
}

func NewChannelService(repo *postgres.ChannelRepository, userRepo *postgres.UserRepository) *ChannelService {
	return &ChannelService{repo, userRepo}
}

// Refactored: GetAllChannel returns user's channels separated by type (direct/group)
func (s *ChannelService) GetAllChannel(userID uint) (direct []models.DirectChannelResponse, group []models.ChannelResponse, err error) {
	channels, err := s.repo.GetAllUserChannels(userID)
	if err != nil {
		return nil, nil, err
	}
	for _, channel := range channels {
		if channel.Type == models.ChannelTypeDirect {
			resp, err := s.buildDirectChannelResponse(&channel, userID)
			if err != nil {
				return nil, nil, err
			}
			direct = append(direct, resp)
		} else {
			resp := models.ChannelResponse{
				ID:      channel.ID,
				Name:    channel.Name,
				Type:    channel.Type,
				OwnerID: channel.OwnerID,
			}
			group = append(group, resp)
		}
	}
	return direct, group, nil
}

// buildDirectChannelResponse is a helper to reduce cognitive complexity in GetAllChannel
func (s *ChannelService) buildDirectChannelResponse(channel *models.Channel, userID uint) (models.DirectChannelResponse, error) {
	friends, err := s.userRepo.GetFriendsByChannelID(channel.ID, userID)
	if err != nil {
		return models.DirectChannelResponse{}, err
	}

	var usrEmail string
	var avatar string
	if len(friends) == 0 {
		usrEmail = "Unknown"
		avatar = ""
	} else if len(friends) == 1 {
		usrEmail = friends[0].Email
		avatar = friends[0].Avatar
	} else {
		// Multiple friends - avoid showing current user as channel name
		if friends[0].ID == userID {
			usrEmail = friends[1].Email
			avatar = friends[1].Avatar
		} else {
			usrEmail = friends[0].Email
			avatar = friends[0].Avatar
		}
	}
	resp := models.DirectChannelResponse{
		ID:      channel.ID,
		Name:    usrEmail,
		Avatar:  avatar,
		Type:    channel.Type,
		OwnerID: channel.OwnerID,
	}
	return resp, nil
}

func (s *ChannelService) CreateChannel(name string, ownerID uint, chanType string) (*models.Channel, error) {
	owner, err := s.userRepo.FindByID(ownerID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("owner not found")
		}
		return nil, errors.New("failed to find owner: " + err.Error())
	}
	channel := &models.Channel{
		Name:    name,
		OwnerID: ownerID,
		Members: []*models.User{owner},
		Type:    chanType,
	}
	err = s.repo.Create(channel)
	return channel, err
}

// CreateChannelWithUsers creates a new channel with specified users
func (s *ChannelService) CreateChannelWithUsers(name string, ownerID uint, chanType string, userIDs []uint) (*models.Channel, error) {
	// Validate owner exists
	_, err := s.userRepo.FindByID(ownerID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("owner not found")
		}
		return nil, errors.New("failed to find owner: " + err.Error())
	}

	// Validate all users exist
	users := make([]*models.User, 0, len(userIDs))
	for _, userID := range userIDs {
		user, err := s.userRepo.FindByID(userID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, fmt.Errorf("user with ID %d not found", userID)
			}
			return nil, fmt.Errorf("failed to find user %d: %w", userID, err)
		}
		users = append(users, user)
	}

	// Auto-generate name for direct messages if not provided
	channelName := name
	if chanType == models.ChannelTypeDirect && (name == "" || name == "Direct Message with User") {
		// Find the other user (not the owner) to use their email as channel name
		var otherUser *models.User
		for _, user := range users {
			if user.ID != ownerID {
				otherUser = user
				break
			}
		}
		if otherUser != nil {
			channelName = otherUser.Email
		}
	}

	// Create channel with all users
	channel := &models.Channel{
		Name:    channelName,
		OwnerID: ownerID,
		Members: users,
		Type:    chanType,
	}

	err = s.repo.Create(channel)
	return channel, err
}

func (s *ChannelService) UpdateChannel(channelID uint, name string) error {
	channel, err := s.repo.GetByID(channelID)
	if err != nil {
		return err
	}
	channel.Name = name
	return s.repo.Update(channel)
}

func (s *ChannelService) DeleteChannel(ownerId, channelID uint) error {
	// Check if channel exists and get channel details
	channel, err := s.repo.GetByID(channelID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("channel not found")
		}
		return errors.New("failed to find channel: " + err.Error())
	}

	// Check if the user is the owner of the channel
	if channel.OwnerID != ownerId {
		return errors.New("only channel owner can delete channel")
	}

	// Delete channel (cascade deletion will be handled by GORM)
	return s.repo.Delete(channelID)
}

func (s *ChannelService) GetChannelByID(channelID uint) (*models.Channel, error) {
	return s.repo.GetByID(channelID)
}

func (s *ChannelService) JoinChannel(channelID, userID uint) error {
	// Check if channel exists
	_, err := s.repo.GetByID(channelID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("channel not found")
		}
		return errors.New("failed to find channel: " + err.Error())
	}

	// Check if user exists
	_, err = s.userRepo.FindByID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("user not found")
		}
		return errors.New("failed to find user: " + err.Error())
	}

	// Add user to channel
	return s.repo.AddUser(channelID, userID)
}

func (s *ChannelService) LeaveChannel(channelID, userID uint) error {
	// Check if channel exists
	_, err := s.repo.GetByID(channelID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("channel not found")
		}
		return errors.New("failed to find channel: " + err.Error())
	}

	// Check if user exists
	_, err = s.userRepo.FindByID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("user not found")
		}
		return errors.New("failed to find user: " + err.Error())
	}

	// Remove user from channel
	return s.repo.RemoveUser(channelID, userID)
}

func (s *ChannelService) RemoveUserFromChannel(ownerId, channelID, targetUserID uint) error {
	// Check if channel exists and get channel details
	channel, err := s.repo.GetByID(channelID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("channel not found")
		}
		return errors.New("failed to find channel: " + err.Error())
	}

	// Check if the user is the owner of the channel
	if channel.OwnerID != ownerId {
		return errors.New("only channel owner can remove users")
	}

	// Check if target user exists
	_, err = s.userRepo.FindByID(targetUserID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("target user not found")
		}
		return errors.New("failed to find target user: " + err.Error())
	}

	// Check if trying to remove the owner
	if targetUserID == ownerId {
		return errors.New("cannot remove channel owner")
	}

	// Remove user from channel
	return s.repo.RemoveUser(channelID, targetUserID)
}

func (s *ChannelService) AddUserToChannel(ownerId, channelID, targetUserID uint) error {
	// Check if channel exists and get channel details
	channel, err := s.repo.GetByID(channelID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("channel not found")
		}
		return errors.New("failed to find channel: " + err.Error())
	}

	// Check if the user is the owner of the channel
	if channel.OwnerID != ownerId {
		return errors.New("only channel owner can add users")
	}

	// Check if target user exists
	_, err = s.userRepo.FindByID(targetUserID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("target user not found")
		}
		return errors.New("failed to find target user: " + err.Error())
	}

	// Add user to channel
	return s.repo.AddUser(channelID, targetUserID)
}

func (s *ChannelService) GetChatMessagesByChannel(channelID uint) ([]models.Chat, error) {
	return s.repo.GetChatMessages(channelID)
}

func (s *ChannelService) GetChatMessagesByChannelWithPagination(channelID uint, limit int, before *int64) ([]models.ChatResponse, error) {
	return s.repo.GetChatMessagesWithPagination(channelID, limit, before)
}
