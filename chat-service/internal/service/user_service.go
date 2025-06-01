package service

import (
	"chat-service/internal/models"
	"chat-service/internal/repository"
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// Custom errors
var (
	ErrUserNotFound          = errors.New("user not found")
	ErrUserAlreadyExists     = errors.New("user already exists")
	ErrInvalidCredentials    = errors.New("invalid credentials")
	ErrFriendRequestExists   = errors.New("friend request already exists")
	ErrFriendRequestNotFound = errors.New("friend request not found")
	ErrFriendExists          = errors.New("friend relationship already exists")
	ErrInvalidRequest        = errors.New("invalid request")
)

type UserService interface {
	Register(ctx context.Context, req *models.RegisterRequest) (*models.UserResponse, error)
	Login(ctx context.Context, req *models.LoginRequest) (string, error)
	GetProfile(ctx context.Context, userID uint) (*models.UserResponse, error)
	UpdateProfile(ctx context.Context, userID uint, req *models.RegisterRequest) (*models.UserResponse, error)
}

type userService struct {
	repo        repository.UserRepository
	jwtSecret   string
	redisClient *redis.Client
}

func NewUserService(repo repository.UserRepository, jwtSecret string, redisClient *redis.Client) UserService {
	return &userService{
		repo:        repo,
		jwtSecret:   jwtSecret,
		redisClient: redisClient,
	}
}

// generateJWT creates a new JWT token for the user
func (s *userService) generateJWT(user *models.User) (string, error) {
	claims := jwt.MapClaims{
		"user_id":  user.ID,
		"email":    user.Email,
		"username": user.Username,
		"exp":      time.Now().Add(time.Hour * 24 * 7).Unix(), // Token expires in 7 days
		"iat":      time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}

func (s *userService) Register(ctx context.Context, req *models.RegisterRequest) (*models.UserResponse, error) {
	// Validate request
	if req.Email == "" || req.Password == "" {
		return nil, ErrInvalidRequest
	}

	// Use a session to prevent prepared statement issues
	existingUser, err := s.repo.FindByEmail(ctx, req.Email)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("failed to check existing user: %w", err)
	}
	if existingUser != nil {
		return nil, ErrUserAlreadyExists
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user with UUID
	user := models.User{Username: req.Username, Email: req.Email, Password: string(hashedPassword)}

	// Create user in database
	if err := s.repo.Create(ctx, &user); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return &models.UserResponse{
		ID:        user.ID,
		Email:     user.Email,
		Username:  user.Username,
		CreatedAt: user.CreatedAt,
	}, nil
}

func (s *userService) Login(ctx context.Context, req *models.LoginRequest) (string, error) {
	user, err := s.repo.FindByEmail(ctx, req.Email)
	if err != nil {
		return "", ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return "", ErrInvalidCredentials
	}

	return s.generateJWT(user)
}

func (s *userService) GetProfile(ctx context.Context, userID uint) (*models.UserResponse, error) {
	user, err := s.repo.FindByID(ctx, userID)
	if err != nil {
		return nil, ErrUserNotFound
	}

	return &models.UserResponse{
		ID:        user.ID,
		Email:     user.Email,
		Username:  user.Username,
		CreatedAt: user.CreatedAt,
	}, nil
}

func (s *userService) UpdateProfile(ctx context.Context, userID uint, req *models.RegisterRequest) (*models.UserResponse, error) {
	user, err := s.repo.FindByID(ctx, userID)
	if err != nil {
		return nil, ErrUserNotFound
	}

	// Update user fields
	user.Username = req.Username
	if req.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			return nil, err
		}
		user.Password = string(hashedPassword)
	}

	if err := s.repo.Update(ctx, user); err != nil {
		return nil, err
	}

	return &models.UserResponse{
		ID:        user.ID,
		Email:     user.Email,
		Username:  user.Username,
		CreatedAt: user.CreatedAt,
	}, nil
}
