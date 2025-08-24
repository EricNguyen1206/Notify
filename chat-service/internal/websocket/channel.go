package websocket

import (
	"chat-service/internal/services"
	"context"
	"fmt"
	"time"
)

/*
==============================================================================
  Channel-Specific WebSocket Logic
==============================================================================
*/

type ChannelManager struct {
	hub          *Hub
	redisService *services.RedisService
}

func NewChannelManager(hub *Hub, redisService *services.RedisService) *ChannelManager {
	return &ChannelManager{
		hub:          hub,
		redisService: redisService,
	}
}

func (cm *ChannelManager) GetChannelInfo(ctx context.Context, channelID string) (*ChannelInfo, error) {
	members, err := cm.redisService.GetChannelMembers(ctx, channelID)
	if err != nil {
		return nil, err
	}

	// Get online members
	onlineMembers := make([]string, 0)
	for _, memberID := range members {
		if online, err := cm.redisService.IsUserOnline(ctx, memberID); err == nil && online {
			onlineMembers = append(onlineMembers, memberID)
		}
	}

	return &ChannelInfo{
		ChannelID:     channelID,
		TotalMembers:  len(members),
		OnlineMembers: len(onlineMembers),
		Members:       members,
		Online:        onlineMembers,
	}, nil
}

func (cm *ChannelManager) BroadcastChannelEvent(ctx context.Context, channelID string, eventType MessageType, data map[string]interface{}) error {
	event := NewMessage(generateMessageID(), eventType, "", data)
	return cm.redisService.PublishChannelEvent(ctx, channelID, event)
}

func (cm *ChannelManager) BroadcastChannelMessage(ctx context.Context, userID, channelID string, message *Message) error {
	return cm.redisService.PublishChannelMessage(ctx, channelID, message)
}

type ChannelInfo struct {
	ChannelID     string   `json:"channel_id"`
	TotalMembers  int      `json:"total_members"`
	OnlineMembers int      `json:"online_members"`
	Members       []string `json:"members"`
	Online        []string `json:"online"`
}

func generateMessageID() string {
	return fmt.Sprintf("msg_%d_%d", time.Now().Unix(), time.Now().UnixNano())
}
