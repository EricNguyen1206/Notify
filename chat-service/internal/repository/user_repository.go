package repository

import (
	"chat-service/internal/models"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"
)

type UserRepository interface {
	Create(ctx context.Context, user *models.User) error
	FindByEmail(ctx context.Context, email string) (*models.User, error)
	FindByID(ctx context.Context, userId uint) (*models.User, error)
	Update(ctx context.Context, user *models.User) error
	Delete(ctx context.Context, userId uint) error
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(ctx context.Context, user *models.User) error {
	// Begin transaction
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Check email exist
		var existingUser models.User
		if err := tx.Where("email = ? AND deleted_at IS NULL", user.Email).First(&existingUser).Error; err == nil {
			return errors.New("email already exists")
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}

		// Create user in transaction
		if err := tx.Create(user).Error; err != nil {
			// Transaction auto rollback if err
			return errors.New("failed to create user: " + err.Error())
		}

		// Transaction commit if not err
		return nil
	})
}

func (r *userRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	err := r.db.Where("email = ? AND deleted_at IS NULL", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) FindByID(ctx context.Context, id uint) (*models.User, error) {
	var user models.User
	err := r.db.Where("id = ? AND deleted_at IS NULL", id).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) Update(ctx context.Context, user *models.User) error {
	// Get raw database connection
	sqlDB, err := r.db.DB()
	if err != nil {
		return fmt.Errorf("failed to get database connection: %w", err)
	}

	// Begin transaction
	tx, err := sqlDB.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}

	// Defer a rollback in case anything fails
	defer tx.Rollback()

	// Update user using raw SQL
	query := `
        UPDATE users 
        SET email = $1, username = $2, password = $3
        WHERE id = $4 AND deleted_at IS NULL
    `

	result, err := tx.ExecContext(ctx, query,
		user.Email,
		user.Username,
		user.Password,
		user.ID,
	)

	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	// Check if any row was affected
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rows == 0 {
		return gorm.ErrRecordNotFound
	}

	// Commit the transaction
	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

func (r *userRepository) Delete(ctx context.Context, userId uint) error {
	// Get raw database connection
	sqlDB, err := r.db.DB()
	if err != nil {
		return fmt.Errorf("failed to get database connection: %w", err)
	}

	// Begin transaction
	tx, err := sqlDB.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}

	// Defer a rollback in case anything fails
	defer tx.Rollback()

	// In GORM soft delete just updates the deleted_at column
	now := time.Now()
	query := `
        UPDATE users 
        SET deleted_at = $1 
        WHERE id = $2 AND deleted_at IS NULL
    `

	result, err := tx.ExecContext(ctx, query, now, userId)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	// Check if any row was affected
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rows == 0 {
		return gorm.ErrRecordNotFound
	}

	// Commit the transaction
	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}
