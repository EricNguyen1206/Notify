package services

import (
	"chat-service/internal/models"
	"chat-service/internal/repositories/postgres"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
)

// Custom errors
var (
	ErrUserNotFound       = errors.New("user not found")
	ErrUserAlreadyExists  = errors.New("user already exists")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrInvalidRequest     = errors.New("invalid request")
)

// type UserService interface {
// 	Register(req *models.RegisterRequest) (*models.UserResponse, error)
// 	Login(req *models.LoginRequest) (*models.LoginResponse, error)
// 	GetProfile(userID uint) (*models.UserResponse, error)
// 	GetUserByEmail(email string) (*models.UserResponse, error)
// }

type UserService struct {
	repo        *postgres.UserRepository
	jwtSecret   string
	redisClient *redis.Client
}

func NewUserService(repo *postgres.UserRepository, jwtSecret string, redisClient *redis.Client) *UserService {
	return &UserService{
		repo:        repo,
		jwtSecret:   jwtSecret,
		redisClient: redisClient,
	}
}

// generateJWT creates a new JWT token for the user
func (s *UserService) generateJWT(user *models.User) (string, error) {
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

func (s *UserService) Register(req *models.RegisterRequest) (*models.UserResponse, error) {
	// Validate request
	if req.Email == "" || req.Password == "" || req.Username == "" {
		log.Printf("❌ Registration failed: invalid request - email: %s, username: %s", req.Email, req.Username)
		return nil, ErrInvalidRequest
	}

	log.Printf("🔄 Starting registration process for email: %s, username: %s", req.Email, req.Username)

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("❌ Registration failed: password hashing error for email %s: %v", req.Email, err)
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user object
	user := models.User{
		Username: req.Username,
		Email:    req.Email,
		Password: string(hashedPassword),
	}

	// Create user in database (repository handles email uniqueness check)
	if err := s.repo.Create(&user); err != nil {
		if errors.Is(err, errors.New("email already exists")) {
			log.Printf("❌ Registration failed: email already exists - %s", req.Email)
			return nil, ErrUserAlreadyExists
		}
		log.Printf("❌ Registration failed: database error for email %s: %v", req.Email, err)
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	log.Printf("✅ User registered successfully - ID: %d, Email: %s, Username: %s", user.ID, user.Email, user.Username)

	return &models.UserResponse{
		ID:        user.ID,
		Email:     user.Email,
		Username:  user.Username,
		CreatedAt: user.CreatedAt,
	}, nil
}

func (s *UserService) Login(req *models.LoginRequest) (*models.LoginResponse, error) {
	user, err := s.repo.FindByEmail(req.Email)
	if err != nil {
		return nil, ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	token, err := s.generateJWT(user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	return &models.LoginResponse{
		Token: token,
		User: models.UserResponse{
			ID:        user.ID,
			Email:     user.Email,
			Username:  user.Username,
			CreatedAt: user.CreatedAt,
		},
	}, nil
}

func (s *UserService) GetProfile(userID uint) (*models.UserResponse, error) {
	user, err := s.repo.FindByID(userID)
	if err != nil {
		return nil, ErrUserNotFound
	}

	return &models.UserResponse{
		ID:        user.ID,
		Email:     user.Email,
		Username:  user.Username,
		CreatedAt: user.CreatedAt,
		Avatar:    user.Avatar, // Assuming Avatar field exists
	}, nil
}

func (s *UserService) GetUserByEmail(email string) (*models.UserResponse, error) {
	user, err := s.repo.FindByEmail(email)
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

// SearchUsersByUsername searches for users by username (partial match)
func (s *UserService) SearchUsersByUsername(username string) ([]models.UserResponse, error) {
	users, err := s.repo.SearchUsersByUsername(username)
	if err != nil {
		return nil, fmt.Errorf("failed to search users: %w", err)
	}

	// Convert to response format
	responses := make([]models.UserResponse, len(users))
	for i, user := range users {
		responses[i] = models.UserResponse{
			ID:        user.ID,
			Email:     user.Email,
			Username:  user.Username,
			CreatedAt: user.CreatedAt,
			Avatar:    user.Avatar,
		}
	}

	return responses, nil
}

// UpdateProfile updates the user's profile information
func (s *UserService) UpdateProfile(userID uint, req *models.UpdateProfileRequest) (*models.UserResponse, error) {
	// Get current user
	user, err := s.repo.FindByID(userID)
	if err != nil {
		return nil, ErrUserNotFound
	}

	// Verify current password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.CurrentPassword)); err != nil {
		return nil, errors.New("current password is incorrect")
	}

	// Update fields if provided
	if req.Username != nil {
		user.Username = *req.Username
	}
	if req.Avatar != nil {
		user.Avatar = *req.Avatar
	}
	if req.Password != nil {
		// Hash new password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(*req.Password), bcrypt.DefaultCost)
		if err != nil {
			return nil, fmt.Errorf("failed to hash new password: %w", err)
		}
		user.Password = string(hashedPassword)
	}

	// Save updated user
	if err := s.repo.Update(user); err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	return &models.UserResponse{
		ID:        user.ID,
		Email:     user.Email,
		Username:  user.Username,
		CreatedAt: user.CreatedAt,
		Avatar:    user.Avatar,
	}, nil
}
