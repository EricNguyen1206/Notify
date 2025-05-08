package user

import (
	"chat-service/internal/models"
	"context"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
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
	GetProfile(ctx context.Context, userID string) (*models.UserResponse, error)
	UpdateProfile(ctx context.Context, userID string, req *models.RegisterRequest) (*models.UserResponse, error)
	SendFriendRequest(ctx context.Context, senderEmail string, req *models.FriendRequest) error
	AcceptFriendRequest(ctx context.Context, requestID string) error
	RejectFriendRequest(ctx context.Context, requestID string) error
	GetFriends(ctx context.Context, email string) ([]*models.FriendResponse, error)
	GetPendingFriends(ctx context.Context, email string) ([]*models.FriendResponse, error)
	RemoveFriend(ctx context.Context, friendID string) error
}

type userService struct {
	repo      UserRepository
	jwtSecret string
}

func NewUserService(repo UserRepository, jwtSecret string) UserService {
	return &userService{
		repo:      repo,
		jwtSecret: jwtSecret,
	}
}

// generateJWT creates a new JWT token for the user
func (s *userService) generateJWT(user *models.User) (string, error) {
	claims := jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"name":    user.Name,
		"exp":     time.Now().Add(time.Hour * 24 * 7).Unix(), // Token expires in 7 days
		"iat":     time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}

func (s *userService) Register(ctx context.Context, req *models.RegisterRequest) (*models.UserResponse, error) {
	// Check if user exists
	existingUser, _ := s.repo.FindByEmail(ctx, req.Email)
	if existingUser != nil {
		return nil, ErrUserAlreadyExists
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Create user
	user := &models.User{
		ID:       uuid.New().String(),
		Provider: req.Provider,
		Email:    req.Email,
		Name:     req.Name,
		Password: string(hashedPassword),
		Created:  time.Now(),
	}

	if err := s.repo.Create(ctx, user); err != nil {
		return nil, err
	}

	return &models.UserResponse{
		ID:      user.ID,
		Email:   user.Email,
		Name:    user.Name,
		Avatar:  user.Avatar,
		IsAdmin: user.IsAdmin,
		Created: user.Created,
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

func (s *userService) GetProfile(ctx context.Context, userID string) (*models.UserResponse, error) {
	user, err := s.repo.FindByID(ctx, userID)
	if err != nil {
		return nil, ErrUserNotFound
	}

	return &models.UserResponse{
		ID:      user.ID,
		Email:   user.Email,
		Name:    user.Name,
		Avatar:  user.Avatar,
		IsAdmin: user.IsAdmin,
		Created: user.Created,
	}, nil
}

func (s *userService) UpdateProfile(ctx context.Context, userID string, req *models.RegisterRequest) (*models.UserResponse, error) {
	user, err := s.repo.FindByID(ctx, userID)
	if err != nil {
		return nil, ErrUserNotFound
	}

	// Update user fields
	user.Name = req.Name
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
		ID:      user.ID,
		Email:   user.Email,
		Name:    user.Name,
		Avatar:  user.Avatar,
		IsAdmin: user.IsAdmin,
		Created: user.Created,
	}, nil
}

func (s *userService) SendFriendRequest(ctx context.Context, senderEmail string, req *models.FriendRequest) error {
	// Check if users exist
	sender, err := s.repo.FindByEmail(ctx, senderEmail)
	if err != nil {
		return ErrUserNotFound
	}

	receiver, err := s.repo.FindByEmail(ctx, req.ReceiverEmail)
	if err != nil {
		return ErrUserNotFound
	}

	// Check if friend request already exists
	pending, err := s.repo.GetPendingFriends(ctx, req.ReceiverEmail)
	if err != nil {
		return err
	}
	for _, p := range pending {
		if p.SenderEmail == senderEmail {
			return ErrFriendRequestExists
		}
	}

	// Check if they are already friends
	friends, err := s.repo.GetFriends(ctx, senderEmail)
	if err != nil {
		return err
	}
	for _, f := range friends {
		if f.SenderEmail == req.ReceiverEmail || f.ReceiverEmail == req.ReceiverEmail {
			return ErrFriendExists
		}
	}

	// Create friend request
	friendPending := &models.FriendPending{
		ID:            uuid.New().String(),
		SenderEmail:   sender.Email,
		ReceiverEmail: receiver.Email,
		DateSended:    time.Now(),
	}

	return s.repo.AddFriendPending(ctx, friendPending)
}

func (s *userService) AcceptFriendRequest(ctx context.Context, requestID string) error {
	// Get the friend request
	pending, err := s.repo.GetPendingFriends(ctx, "")
	if err != nil {
		return err
	}

	var targetPending *models.FriendPending
	for _, p := range pending {
		if p.ID == requestID {
			targetPending = p
			break
		}
	}

	if targetPending == nil {
		return ErrFriendRequestNotFound
	}

	// Create friend relationship
	friend := &models.Friend{
		ID:            uuid.New().String(),
		SenderEmail:   targetPending.SenderEmail,
		ReceiverEmail: targetPending.ReceiverEmail,
		Created:       time.Now(),
	}

	// Start transaction
	if err := s.repo.AddFriend(ctx, friend); err != nil {
		return err
	}

	// Remove the pending request
	return s.repo.RemoveFriendPending(ctx, requestID)
}

func (s *userService) RejectFriendRequest(ctx context.Context, requestID string) error {
	// Get the friend request
	pending, err := s.repo.GetPendingFriends(ctx, "")
	if err != nil {
		return err
	}

	var exists bool
	for _, p := range pending {
		if p.ID == requestID {
			exists = true
			break
		}
	}

	if !exists {
		return ErrFriendRequestNotFound
	}

	return s.repo.RemoveFriendPending(ctx, requestID)
}

func (s *userService) GetFriends(ctx context.Context, email string) ([]*models.FriendResponse, error) {
	friends, err := s.repo.GetFriends(ctx, email)
	if err != nil {
		return nil, err
	}

	var response []*models.FriendResponse
	for _, f := range friends {
		response = append(response, &models.FriendResponse{
			ID:            f.ID,
			SenderEmail:   f.SenderEmail,
			ReceiverEmail: f.ReceiverEmail,
			Created:       f.Created,
		})
	}

	return response, nil
}

func (s *userService) GetPendingFriends(ctx context.Context, email string) ([]*models.FriendResponse, error) {
	pending, err := s.repo.GetPendingFriends(ctx, email)
	if err != nil {
		return nil, err
	}

	var response []*models.FriendResponse
	for _, p := range pending {
		response = append(response, &models.FriendResponse{
			ID:            p.ID,
			SenderEmail:   p.SenderEmail,
			ReceiverEmail: p.ReceiverEmail,
			Created:       p.DateSended,
		})
	}

	return response, nil
}

func (s *userService) RemoveFriend(ctx context.Context, friendID string) error {
	// Get all friends
	friends, err := s.repo.GetFriends(ctx, "")
	if err != nil {
		return err
	}

	// Check if friend relationship exists
	var exists bool
	for _, f := range friends {
		if f.ID == friendID {
			exists = true
			break
		}
	}

	if !exists {
		return ErrFriendRequestNotFound
	}

	return s.repo.RemoveFriend(ctx, friendID)
}
