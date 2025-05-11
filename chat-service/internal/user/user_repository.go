package user

import (
	"chat-service/internal/models"
	"context"
	"database/sql"
	"fmt"
	"time"

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

	// Insert user using raw SQL
	query := `
        INSERT INTO users (id, provider, email, name, password, avatar, is_admin, created)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `

	_, err = tx.ExecContext(ctx, query,
		user.ID,
		user.Provider,
		user.Email,
		user.Name,
		user.Password,
		user.Avatar,
		user.IsAdmin,
		user.Created,
	)

	if err != nil {
		// Check for unique constraint violation
		if err.Error() == "ERROR: duplicate key value violates unique constraint \"users_pkey\" (SQLSTATE 23505)" {
			return fmt.Errorf("user already exists")
		}
		return fmt.Errorf("failed to create user: %w", err)
	}

	// Commit the transaction
	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

func (r *userRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User

	// Use raw SQL query to completely bypass GORM's query builder
	query := `
        SELECT id, provider, email, name, password, avatar, is_admin, created, deleted_at 
        FROM users 
        WHERE email = $1 AND deleted_at IS NULL 
        LIMIT 1
    `

	// Get raw database connection
	sqlDB, err := r.db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get database connection: %w", err)
	}

	// Execute raw query
	row := sqlDB.QueryRowContext(ctx, query, email)

	// Initialize variables for scanning
	var (
		id                                       string
		provider, email2, name, password, avatar string
		isAdmin                                  bool
		created                                  time.Time
		deletedAt                                sql.NullTime
	)

	// Scan the row into variables
	err = row.Scan(
		&id,
		&provider,
		&email2,
		&name,
		&password,
		&avatar,
		&isAdmin,
		&created,
		&deletedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, gorm.ErrRecordNotFound
		}
		return nil, fmt.Errorf("database error finding user by email: %w", err)
	}

	// Build the user object
	user = models.User{
		ID:       id,
		Provider: provider,
		Email:    email2,
		Name:     name,
		Password: password,
		Avatar:   avatar,
		IsAdmin:  isAdmin,
		Created:  created,
	}

	// Handle deleted_at if it's valid
	if deletedAt.Valid {
		user.DeletedAt = gorm.DeletedAt{
			Time:  deletedAt.Time,
			Valid: true,
		}
	}

	return &user, nil
}

func (r *userRepository) FindByID(ctx context.Context, id string) (*models.User, error) {
	// Use raw SQL query to completely bypass GORM's query builder
	query := `
        SELECT id, provider, email, name, password, avatar, is_admin, created, deleted_at 
        FROM users 
        WHERE id = $1 AND deleted_at IS NULL 
        LIMIT 1
    `

	// Get raw database connection
	sqlDB, err := r.db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get database connection: %w", err)
	}

	// Execute raw query
	row := sqlDB.QueryRowContext(ctx, query, id)

	// Initialize variables for scanning
	var (
		idVal                                   string
		provider, email, name, password, avatar string
		isAdmin                                 bool
		created                                 time.Time
		deletedAt                               sql.NullTime
	)

	// Scan the row into variables
	err = row.Scan(
		&idVal,
		&provider,
		&email,
		&name,
		&password,
		&avatar,
		&isAdmin,
		&created,
		&deletedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, gorm.ErrRecordNotFound
		}
		return nil, fmt.Errorf("database error finding user by id: %w", err)
	}

	// Build the user object
	user := &models.User{
		ID:       idVal,
		Provider: provider,
		Email:    email,
		Name:     name,
		Password: password,
		Avatar:   avatar,
		IsAdmin:  isAdmin,
		Created:  created,
	}

	// Handle deleted_at if it's valid
	if deletedAt.Valid {
		user.DeletedAt = gorm.DeletedAt{
			Time:  deletedAt.Time,
			Valid: true,
		}
	}

	return user, nil
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
        SET provider = $1, email = $2, name = $3, password = $4, avatar = $5, is_admin = $6
        WHERE id = $7 AND deleted_at IS NULL
    `

	result, err := tx.ExecContext(ctx, query,
		user.Provider,
		user.Email,
		user.Name,
		user.Password,
		user.Avatar,
		user.IsAdmin,
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

func (r *userRepository) Delete(ctx context.Context, id string) error {
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

	result, err := tx.ExecContext(ctx, query, now, id)
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

func (r *userRepository) AddFriend(ctx context.Context, friend *models.Friend) error {
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

	// Insert friend using raw SQL
	query := `
        INSERT INTO friends (id, sender_email, receiver_email, created)
        VALUES ($1, $2, $3, $4)
    `

	_, err = tx.ExecContext(ctx, query,
		friend.ID,
		friend.SenderEmail,
		friend.ReceiverEmail,
		friend.Created,
	)

	if err != nil {
		return fmt.Errorf("failed to create friend relationship: %w", err)
	}

	// Commit the transaction
	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

func (r *userRepository) AddFriendPending(ctx context.Context, pending *models.FriendPending) error {
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

	// Insert pending friend using raw SQL
	query := `
        INSERT INTO friend_pendings (id, sender_email, receiver_email, date_sended)
        VALUES ($1, $2, $3, $4)
    `

	_, err = tx.ExecContext(ctx, query,
		pending.ID,
		pending.SenderEmail,
		pending.ReceiverEmail,
		pending.DateSended,
	)

	if err != nil {
		return fmt.Errorf("failed to create pending friend request: %w", err)
	}

	// Commit the transaction
	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

func (r *userRepository) GetFriends(ctx context.Context, email string) ([]*models.Friend, error) {
	// Get raw database connection
	sqlDB, err := r.db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get database connection: %w", err)
	}

	// Query to get all friends for the given email
	query := `
        SELECT id, sender_email, receiver_email, created, deleted_at
        FROM friends
        WHERE (sender_email = $1 OR receiver_email = $1)
        AND deleted_at IS NULL
    `

	// Execute the query
	rows, err := sqlDB.QueryContext(ctx, query, email)
	if err != nil {
		return nil, fmt.Errorf("failed to query friends: %w", err)
	}
	defer rows.Close()

	// Process the results
	var friends []*models.Friend
	for rows.Next() {
		var friend models.Friend
		var deletedAt sql.NullTime

		err := rows.Scan(
			&friend.ID,
			&friend.SenderEmail,
			&friend.ReceiverEmail,
			&friend.Created,
			&deletedAt,
		)

		if err != nil {
			return nil, fmt.Errorf("failed to scan friend row: %w", err)
		}

		// Set deleted_at if it's valid
		if deletedAt.Valid {
			friend.DeletedAt = gorm.DeletedAt{
				Time:  deletedAt.Time,
				Valid: true,
			}
		}

		friends = append(friends, &friend)
	}

	// Check for errors during row iteration
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating friend rows: %w", err)
	}

	return friends, nil
}

func (r *userRepository) GetPendingFriends(ctx context.Context, email string) ([]*models.FriendPending, error) {
	// Get raw database connection
	sqlDB, err := r.db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get database connection: %w", err)
	}

	// Query to get all pending friend requests for the given email
	query := `
        SELECT id, sender_email, receiver_email, date_sended, deleted_at
        FROM friend_pendings
        WHERE receiver_email = $1 AND deleted_at IS NULL
    `

	// Execute the query
	rows, err := sqlDB.QueryContext(ctx, query, email)
	if err != nil {
		return nil, fmt.Errorf("failed to query pending friends: %w", err)
	}
	defer rows.Close()

	// Process the results
	var pendingFriends []*models.FriendPending
	for rows.Next() {
		var pending models.FriendPending
		var deletedAt sql.NullTime

		err := rows.Scan(
			&pending.ID,
			&pending.SenderEmail,
			&pending.ReceiverEmail,
			&pending.DateSended,
			&deletedAt,
		)

		if err != nil {
			return nil, fmt.Errorf("failed to scan pending friend row: %w", err)
		}

		// Set deleted_at if it's valid
		if deletedAt.Valid {
			pending.DeletedAt = gorm.DeletedAt{
				Time:  deletedAt.Time,
				Valid: true,
			}
		}

		pendingFriends = append(pendingFriends, &pending)
	}

	// Check for errors during row iteration
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating pending friend rows: %w", err)
	}

	return pendingFriends, nil
}

func (r *userRepository) RemoveFriend(ctx context.Context, id string) error {
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
        UPDATE friends
        SET deleted_at = $1
        WHERE id = $2 AND deleted_at IS NULL
    `

	result, err := tx.ExecContext(ctx, query, now, id)
	if err != nil {
		return fmt.Errorf("failed to remove friend: %w", err)
	}

	// Check if any row was affected
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}

	// Commit the transaction
	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

func (r *userRepository) RemoveFriendPending(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&models.FriendPending{}, "id = ?", id).Error
}
