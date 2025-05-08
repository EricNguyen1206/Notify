package user

import (
	"chat-service/internal/models"
	"context"

	"gorm.io/gorm"
)

type UserRepository interface {
	Create(ctx context.Context, user *models.User) error
	FindByEmail(ctx context.Context, email string) (*models.User, error)
	FindByID(ctx context.Context, id string) (*models.User, error)
	Update(ctx context.Context, user *models.User) error
	Delete(ctx context.Context, id string) error
	AddFriend(ctx context.Context, friend *models.Friend) error
	AddFriendPending(ctx context.Context, pending *models.FriendPending) error
	GetFriends(ctx context.Context, email string) ([]*models.Friend, error)
	GetPendingFriends(ctx context.Context, email string) ([]*models.FriendPending, error)
	RemoveFriend(ctx context.Context, id string) error
	RemoveFriendPending(ctx context.Context, id string) error
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(ctx context.Context, user *models.User) error {
	return r.db.WithContext(ctx).Create(user).Error
}

func (r *userRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	err := r.db.WithContext(ctx).Where("email = ?", email).First(&user).Error
	return &user, err
}

func (r *userRepository) FindByID(ctx context.Context, id string) (*models.User, error) {
	var user models.User
	err := r.db.WithContext(ctx).First(&user, "id = ?", id).Error
	return &user, err
}

func (r *userRepository) Update(ctx context.Context, user *models.User) error {
	return r.db.WithContext(ctx).Save(user).Error
}

func (r *userRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&models.User{}, "id = ?", id).Error
}

func (r *userRepository) AddFriend(ctx context.Context, friend *models.Friend) error {
	return r.db.WithContext(ctx).Create(friend).Error
}

func (r *userRepository) AddFriendPending(ctx context.Context, pending *models.FriendPending) error {
	return r.db.WithContext(ctx).Create(pending).Error
}

func (r *userRepository) GetFriends(ctx context.Context, email string) ([]*models.Friend, error) {
	var friends []*models.Friend
	err := r.db.WithContext(ctx).
		Where("sender_email = ? OR receiver_email = ?", email, email).
		Find(&friends).Error
	return friends, err
}

func (r *userRepository) GetPendingFriends(ctx context.Context, email string) ([]*models.FriendPending, error) {
	var pending []*models.FriendPending
	err := r.db.WithContext(ctx).
		Where("receiver_email = ?", email).
		Find(&pending).Error
	return pending, err
}

func (r *userRepository) RemoveFriend(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&models.Friend{}, "id = ?", id).Error
}

func (r *userRepository) RemoveFriendPending(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&models.FriendPending{}, "id = ?", id).Error
}
