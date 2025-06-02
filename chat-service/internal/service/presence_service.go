package service

import (
	"chat-service/configs/utils/ws"
	"chat-service/internal/repository"
)

type PresenceService struct {
	presenceRepo repository.PresenceRepository
	friendRepo   repository.FriendRepository
	hub          *ws.Hub
}

func NewPresenceService(
	presenceRepo repository.PresenceRepository,
	friendRepo repository.FriendRepository,
	hub *ws.Hub,
) *PresenceService {
	return &PresenceService{
		presenceRepo: presenceRepo,
		friendRepo:   friendRepo,
		hub:          hub,
	}
}

func (s *PresenceService) SetOnline(userID string) error {
	if err := s.presenceRepo.SetOnline(userID); err != nil {
		return err
	}
	// Broadcast cho bạn bè biết user này online
	s.hub.BroadcastFriendStatus(userID, "online")
	return nil
}

func (s *PresenceService) SetOffline(userID string) error {
	if err := s.presenceRepo.SetOffline(userID); err != nil {
		return err
	}
	// Broadcast cho bạn bè biết user này offline
	s.hub.BroadcastFriendStatus(userID, "offline")
	return nil
}

func (s *PresenceService) GetOnlineFriends(userIDs []uint) ([]uint, error) {
	return s.presenceRepo.GetOnlineFriends(userIDs)
}
