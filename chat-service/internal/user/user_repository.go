package user

import (
	"context"

	"gorm.io/gorm"
)

type UserRepository interface {
	Create(ctx context.Context, user *User) error
	FindByEmail(ctx context.Context, email string) (*User, error)
	FindByID(ctx context.Context, id string) (*User, error)
	Update(ctx context.Context, user *User) error
	Delete(ctx context.Context, id string) error
	AddFriend(ctx context.Context, friend *Friend) error
	AddFriendPending(ctx context.Context, pending *FriendPending) error
	GetFriends(ctx context.Context, email string) ([]*Friend, error)
	GetPendingFriends(ctx context.Context, email string) ([]*FriendPending, error)
	RemoveFriend(ctx context.Context, id string) error
	RemoveFriendPending(ctx context.Context, id string) error
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(ctx context.Context, user *User) error {
	return r.db.WithContext(ctx).Create(user).Error
}

func (r *userRepository) FindByEmail(ctx context.Context, email string) (*User, error) {
	var user User
	err := r.db.WithContext(ctx).Where("email = ?", email).First(&user).Error
	return &user, err
}

func (r *userRepository) FindByID(ctx context.Context, id string) (*User, error) {
	var user User
	err := r.db.WithContext(ctx).First(&user, "id = ?", id).Error
	return &user, err
}

func (r *userRepository) Update(ctx context.Context, user *User) error {
	return r.db.WithContext(ctx).Save(user).Error
}

func (r *userRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&User{}, "id = ?", id).Error
}

func (r *userRepository) AddFriend(ctx context.Context, friend *Friend) error {
	return r.db.WithContext(ctx).Create(friend).Error
}

func (r *userRepository) AddFriendPending(ctx context.Context, pending *FriendPending) error {
	return r.db.WithContext(ctx).Create(pending).Error
}

func (r *userRepository) GetFriends(ctx context.Context, email string) ([]*Friend, error) {
	var friends []*Friend
	err := r.db.WithContext(ctx).
		Where("sender_email = ? OR receiver_email = ?", email, email).
		Find(&friends).Error
	return friends, err
}

func (r *userRepository) GetPendingFriends(ctx context.Context, email string) ([]*FriendPending, error) {
	var pending []*FriendPending
	err := r.db.WithContext(ctx).
		Where("receiver_email = ?", email).
		Find(&pending).Error
	return pending, err
}

func (r *userRepository) RemoveFriend(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&Friend{}, "id = ?", id).Error
}

func (r *userRepository) RemoveFriendPending(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&FriendPending{}, "id = ?", id).Error
}
