package auth

import (
	"context"

	"gorm.io/gorm"
)

type AuthRepository struct {
	db *gorm.DB
}

func NewAuthRepository(db *gorm.DB) AuthRepository {
	return AuthRepository{db: db}
}

// CreateUser creates a new user in the database
func (r *AuthRepository) CreateUser(ctx context.Context, user *UserModel) error {
	return r.db.WithContext(ctx).Create(user).Error
}

// FindByEmail finds a user by email
func (r *AuthRepository) FindByEmail(ctx context.Context, email string) (*UserModel, error) {
	var user UserModel
	err := r.db.WithContext(ctx).Where("email = ?", email).First(&user).Error
	return &user, err
}

// UpdateUser updates user details
func (r *AuthRepository) UpdateUser(ctx context.Context, user *UserModel) error {
	return r.db.WithContext(ctx).Save(user).Error
}
