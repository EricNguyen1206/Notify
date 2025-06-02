package repository

import "chat-service/internal/models"

type FriendRepository interface {
	AddFriend(userID, friendID uint) error
	GetFriends(userID uint) ([]models.Friend, error)
	RemoveFriend(userID, friendID uint) error
	IsFriend(userID, friendID uint) (bool, error)
}
