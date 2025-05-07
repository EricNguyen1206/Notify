package chat

import (
	"chat-service/internal/ws"
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
)

var (
	ErrChatNotFound    = errors.New("chat not found")
	ErrInvalidType     = errors.New("invalid chat type")
	ErrInvalidProvider = errors.New("invalid provider")
	ErrNotAuthorized   = errors.New("not authorized")
)

type ChatService interface {
	CreateChat(ctx context.Context, userID string, req *CreateChatRequest) (*ChatResponse, error)
	GetChat(ctx context.Context, id string) (*ChatResponse, error)
	GetUserChats(ctx context.Context, userID string) ([]*ChatResponse, error)
	GetServerChats(ctx context.Context, serverID string) ([]*ChatResponse, error)
	GetChannelChats(ctx context.Context, channelID string) ([]*ChatResponse, error)
	GetFriendChats(ctx context.Context, friendID string) ([]*ChatResponse, error)
	DeleteChat(ctx context.Context, id string, userID string) error
	BroadcastMessage(hub *ws.Hub, message *ChatMessage) error
}

type chatService struct {
	repo ChatRepository
}

func NewChatService(repo ChatRepository) ChatService {
	return &chatService{repo: repo}
}

func (s *chatService) CreateChat(ctx context.Context, userID string, req *CreateChatRequest) (*ChatResponse, error) {
	// Validate chat type and provider
	if req.Type != "direct_messages" && req.Type != "server_messages" {
		return nil, ErrInvalidType
	}

	if req.Provider != "text" && req.Provider != "image" && req.Provider != "file" {
		return nil, ErrInvalidProvider
	}

	// Validate required fields based on type and provider
	if req.Type == "direct_messages" && req.FriendID == "" {
		return nil, errors.New("friendId is required for direct messages")
	}

	if req.Type == "server_messages" && (req.ServerID == "" || req.ChannelID == "") {
		return nil, errors.New("serverId and channelId are required for server messages")
	}

	if req.Provider == "text" && req.Text == "" {
		return nil, errors.New("text is required for text provider")
	}

	if (req.Provider == "image" || req.Provider == "file") && req.URL == "" {
		return nil, errors.New("url is required for image/file provider")
	}

	chat := &Chat{
		ID:        uuid.New().String(),
		UserID:    userID,
		Type:      req.Type,
		Provider:  req.Provider,
		FriendID:  req.FriendID,
		ServerID:  req.ServerID,
		ChannelID: req.ChannelID,
		Text:      req.Text,
		URL:       req.URL,
		FileName:  req.FileName,
		Sended:    time.Now(),
	}

	if err := s.repo.Create(ctx, chat); err != nil {
		return nil, err
	}

	return &ChatResponse{
		ID:        chat.ID,
		UserID:    chat.UserID,
		Type:      chat.Type,
		Provider:  chat.Provider,
		FriendID:  chat.FriendID,
		ServerID:  chat.ServerID,
		ChannelID: chat.ChannelID,
		Text:      chat.Text,
		URL:       chat.URL,
		FileName:  chat.FileName,
		Sended:    chat.Sended,
	}, nil
}

func (s *chatService) GetChat(ctx context.Context, id string) (*ChatResponse, error) {
	chat, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, ErrChatNotFound
	}

	return &ChatResponse{
		ID:        chat.ID,
		UserID:    chat.UserID,
		Type:      chat.Type,
		Provider:  chat.Provider,
		FriendID:  chat.FriendID,
		ServerID:  chat.ServerID,
		ChannelID: chat.ChannelID,
		Text:      chat.Text,
		URL:       chat.URL,
		FileName:  chat.FileName,
		Sended:    chat.Sended,
	}, nil
}

func (s *chatService) GetUserChats(ctx context.Context, userID string) ([]*ChatResponse, error) {
	chats, err := s.repo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	var responses []*ChatResponse
	for _, chat := range chats {
		responses = append(responses, &ChatResponse{
			ID:        chat.ID,
			UserID:    chat.UserID,
			Type:      chat.Type,
			Provider:  chat.Provider,
			FriendID:  chat.FriendID,
			ServerID:  chat.ServerID,
			ChannelID: chat.ChannelID,
			Text:      chat.Text,
			URL:       chat.URL,
			FileName:  chat.FileName,
			Sended:    chat.Sended,
		})
	}

	return responses, nil
}

func (s *chatService) GetServerChats(ctx context.Context, serverID string) ([]*ChatResponse, error) {
	chats, err := s.repo.FindByServerID(ctx, serverID)
	if err != nil {
		return nil, err
	}

	var responses []*ChatResponse
	for _, chat := range chats {
		responses = append(responses, &ChatResponse{
			ID:        chat.ID,
			UserID:    chat.UserID,
			Type:      chat.Type,
			Provider:  chat.Provider,
			FriendID:  chat.FriendID,
			ServerID:  chat.ServerID,
			ChannelID: chat.ChannelID,
			Text:      chat.Text,
			URL:       chat.URL,
			FileName:  chat.FileName,
			Sended:    chat.Sended,
		})
	}

	return responses, nil
}

func (s *chatService) GetChannelChats(ctx context.Context, channelID string) ([]*ChatResponse, error) {
	chats, err := s.repo.FindByChannelID(ctx, channelID)
	if err != nil {
		return nil, err
	}

	var responses []*ChatResponse
	for _, chat := range chats {
		responses = append(responses, &ChatResponse{
			ID:        chat.ID,
			UserID:    chat.UserID,
			Type:      chat.Type,
			Provider:  chat.Provider,
			FriendID:  chat.FriendID,
			ServerID:  chat.ServerID,
			ChannelID: chat.ChannelID,
			Text:      chat.Text,
			URL:       chat.URL,
			FileName:  chat.FileName,
			Sended:    chat.Sended,
		})
	}

	return responses, nil
}

func (s *chatService) GetFriendChats(ctx context.Context, friendID string) ([]*ChatResponse, error) {
	chats, err := s.repo.FindByFriendID(ctx, friendID)
	if err != nil {
		return nil, err
	}

	var responses []*ChatResponse
	for _, chat := range chats {
		responses = append(responses, &ChatResponse{
			ID:        chat.ID,
			UserID:    chat.UserID,
			Type:      chat.Type,
			Provider:  chat.Provider,
			FriendID:  chat.FriendID,
			ServerID:  chat.ServerID,
			ChannelID: chat.ChannelID,
			Text:      chat.Text,
			URL:       chat.URL,
			FileName:  chat.FileName,
			Sended:    chat.Sended,
		})
	}

	return responses, nil
}

func (s *chatService) DeleteChat(ctx context.Context, id string, userID string) error {
	chat, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return ErrChatNotFound
	}

	if chat.UserID != userID {
		return ErrNotAuthorized
	}

	return s.repo.Delete(ctx, id)
}

func (s *chatService) BroadcastMessage(hub *ws.Hub, message *ChatMessage) error {
	// Convert message to JSON
	data, err := json.Marshal(message)
	if err != nil {
		return err
	}

	// Broadcast to all clients
	hub.Broadcast <- data
	return nil
}
