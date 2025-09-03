package postgres

import (
	"chat-service/internal/models"
	"errors"
	"fmt"
	"log"
	"time"

	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(user *models.User) error {
	log.Printf("🔄 Repository: Starting user creation for email: %s", user.Email)

	// Begin transaction
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Check email existence with better error handling
		var existingUser models.User
		if err := tx.Where("email = ? AND deleted_at IS NULL", user.Email).First(&existingUser).Error; err == nil {
			log.Printf("❌ Repository: Email already exists - %s", user.Email)
			return errors.New("email already exists")
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			log.Printf("❌ Repository: Database error checking email existence - %s: %v", user.Email, err)
			return fmt.Errorf("failed to check email existence: %w", err)
		}

		// Create user in transaction
		if err := tx.Create(user).Error; err != nil {
			log.Printf("❌ Repository: Failed to create user - %s: %v", user.Email, err)
			// Transaction auto rollback if err
			return fmt.Errorf("failed to create user: %w", err)
		}

		log.Printf("✅ Repository: User created successfully - ID: %d, Email: %s", user.ID, user.Email)
		// Transaction commit if not err
		return nil
	})
}

func (r *UserRepository) FindByEmail(email string) (*models.User, error) {
	var user models.User
	err := r.db.Where("email = ? AND deleted_at IS NULL", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) FindByID(id uint) (*models.User, error) {
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

func (r *UserRepository) Update(user *models.User) error {
	// Get raw database connection
	sqlDB, err := r.db.DB()
	if err != nil {
		return fmt.Errorf("failed to get database connection: %w", err)
	}

	// Begin transaction (without context)
	tx, err := sqlDB.Begin()
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

	result, err := tx.Exec(query,
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

func (r *UserRepository) Delete(userId uint) error {
	// Get raw database connection
	sqlDB, err := r.db.DB()
	if err != nil {
		return fmt.Errorf("failed to get database connection: %w", err)
	}

	// Begin transaction (without context)
	tx, err := sqlDB.Begin()
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

	result, err := tx.Exec(query, now, userId)
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

func (r *UserRepository) GetFriendsByChannelID(channelID uint, userId uint) ([]models.User, error) {
	var users []models.User
	err := r.db.Table("users").
		Joins("JOIN channel_members ON channel_members.user_id = users.id").
		Where("users.id != ? AND channel_members.channel_id = ? AND users.deleted_at IS NULL", userId, channelID).
		Find(&users).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get friends by channel ID: %w", err)
	}
	return users, nil
}

// SearchUsersByUsername searches for users by username (partial match)
func (r *UserRepository) SearchUsersByUsername(username string) ([]models.User, error) {
	var users []models.User
	err := r.db.Where("username ILIKE ? AND deleted_at IS NULL", "%"+username+"%").
		Limit(10). // Limit results to prevent abuse
		Find(&users).Error
	if err != nil {
		return nil, fmt.Errorf("failed to search users by username: %w", err)
	}
	return users, nil
}
