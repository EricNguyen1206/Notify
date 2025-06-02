package service

import (
	"chat-service/internal/models"
	"chat-service/internal/repository"
)

type FriendService struct {
	friendRepo repository.FriendRepository
}

func NewFriendService(friendRepo repository.FriendRepository) *FriendService {
	return &FriendService{friendRepo: friendRepo}
}

func (s *FriendService) AddFriend(userID, friendID uint) error {
	return s.friendRepo.AddFriend(userID, friendID)
}

func (s *FriendService) GetFriends(userID uint) ([]models.Friend, error) {
	return s.friendRepo.GetFriends(userID)
}

func (s *FriendService) RemoveFriend(userID, friendID uint) error {
	return s.friendRepo.RemoveFriend(userID, friendID)
}
