package category

import (
	"chat-service/internal/models"
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
)

var (
	ErrCategoryNotFound   = errors.New("category not found")
	ErrChannelNotFound    = errors.New("channel not found")
	ErrInvalidChannelType = errors.New("invalid channel type")
	ErrNotAuthorized      = errors.New("not authorized")
)

type CategoryService interface {
	CreateCategory(ctx context.Context, req *models.CreateCategoryRequest) (*models.CategoryResponse, error)
	GetCategory(ctx context.Context, id string) (*models.CategoryResponse, error)
	GetCategoriesByServer(ctx context.Context, serverID string) ([]*models.CategoryResponse, error)
	UpdateCategory(ctx context.Context, id string, req *models.UpdateCategoryRequest) (*models.CategoryResponse, error)
	DeleteCategory(ctx context.Context, id string) error
	CreateChannel(ctx context.Context, req *models.CreateChannelRequest) (*models.ChannelResponse, error)
	GetChannel(ctx context.Context, id string) (*models.ChannelResponse, error)
	GetChannelsByCategory(ctx context.Context, categoryID string) ([]*models.ChannelResponse, error)
	UpdateChannel(ctx context.Context, id string, req *models.UpdateChannelRequest) (*models.ChannelResponse, error)
	DeleteChannel(ctx context.Context, id string) error
}

type categoryService struct {
	repo CategoryRepository
}

func NewCategoryService(repo CategoryRepository) CategoryService {
	return &categoryService{repo: repo}
}

func (s *categoryService) CreateCategory(ctx context.Context, req *models.CreateCategoryRequest) (*models.CategoryResponse, error) {
	category := &models.Category{
		ID:        uuid.New().String(),
		ServerID:  req.ServerID,
		Name:      req.Name,
		IsPrivate: req.IsPrivate,
		Created:   time.Now(),
	}

	if err := s.repo.Create(ctx, category); err != nil {
		return nil, err
	}

	return &models.CategoryResponse{
		ID:        category.ID,
		ServerID:  category.ServerID,
		Name:      category.Name,
		IsPrivate: category.IsPrivate,
		Created:   category.Created,
	}, nil
}

func (s *categoryService) GetCategory(ctx context.Context, id string) (*models.CategoryResponse, error) {
	category, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, ErrCategoryNotFound
	}

	channels, err := s.repo.FindChannelsByCategoryID(ctx, id)
	if err != nil {
		return nil, err
	}

	channelResponses := make([]models.ChannelResponse, len(channels))
	for i, channel := range channels {
		channelResponses[i] = models.ChannelResponse{
			ID:         channel.ID,
			CategoryID: channel.CategoryID,
			Name:       channel.Name,
			Type:       channel.Type,
			Created:    channel.Created,
		}
	}

	return &models.CategoryResponse{
		ID:        category.ID,
		ServerID:  category.ServerID,
		Name:      category.Name,
		IsPrivate: category.IsPrivate,
		Created:   category.Created,
		Channels:  channelResponses,
	}, nil
}

func (s *categoryService) GetCategoriesByServer(ctx context.Context, serverID string) ([]*models.CategoryResponse, error) {
	categories, err := s.repo.FindByServerID(ctx, serverID)
	if err != nil {
		return nil, err
	}

	var responses []*models.CategoryResponse
	for _, category := range categories {
		channels, err := s.repo.FindChannelsByCategoryID(ctx, category.ID)
		if err != nil {
			return nil, err
		}

		channelResponses := make([]models.ChannelResponse, len(channels))
		for i, channel := range channels {
			channelResponses[i] = models.ChannelResponse{
				ID:         channel.ID,
				CategoryID: channel.CategoryID,
				Name:       channel.Name,
				Type:       channel.Type,
				Created:    channel.Created,
			}
		}

		responses = append(responses, &models.CategoryResponse{
			ID:        category.ID,
			ServerID:  category.ServerID,
			Name:      category.Name,
			IsPrivate: category.IsPrivate,
			Created:   category.Created,
			Channels:  channelResponses,
		})
	}

	return responses, nil
}

func (s *categoryService) UpdateCategory(ctx context.Context, id string, req *models.UpdateCategoryRequest) (*models.CategoryResponse, error) {
	category, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, ErrCategoryNotFound
	}

	category.Name = req.Name
	category.IsPrivate = req.IsPrivate

	if err := s.repo.Update(ctx, category); err != nil {
		return nil, err
	}

	return &models.CategoryResponse{
		ID:        category.ID,
		ServerID:  category.ServerID,
		Name:      category.Name,
		IsPrivate: category.IsPrivate,
		Created:   category.Created,
	}, nil
}

func (s *categoryService) DeleteCategory(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

func (s *categoryService) CreateChannel(ctx context.Context, req *models.CreateChannelRequest) (*models.ChannelResponse, error) {
	if req.Type != "text" && req.Type != "voice" {
		return nil, ErrInvalidChannelType
	}

	channel := &models.Channel{
		ID:         uuid.New().String(),
		CategoryID: req.CategoryID,
		Name:       req.Name,
		Type:       req.Type,
		Created:    time.Now(),
	}

	if err := s.repo.CreateChannel(ctx, channel); err != nil {
		return nil, err
	}

	return &models.ChannelResponse{
		ID:         channel.ID,
		CategoryID: channel.CategoryID,
		Name:       channel.Name,
		Type:       channel.Type,
		Created:    channel.Created,
	}, nil
}

func (s *categoryService) GetChannel(ctx context.Context, id string) (*models.ChannelResponse, error) {
	channel, err := s.repo.FindChannelByID(ctx, id)
	if err != nil {
		return nil, ErrChannelNotFound
	}

	return &models.ChannelResponse{
		ID:         channel.ID,
		CategoryID: channel.CategoryID,
		Name:       channel.Name,
		Type:       channel.Type,
		Created:    channel.Created,
	}, nil
}

func (s *categoryService) GetChannelsByCategory(ctx context.Context, categoryID string) ([]*models.ChannelResponse, error) {
	channels, err := s.repo.FindChannelsByCategoryID(ctx, categoryID)
	if err != nil {
		return nil, err
	}

	var responses []*models.ChannelResponse
	for _, channel := range channels {
		responses = append(responses, &models.ChannelResponse{
			ID:         channel.ID,
			CategoryID: channel.CategoryID,
			Name:       channel.Name,
			Type:       channel.Type,
			Created:    channel.Created,
		})
	}

	return responses, nil
}

func (s *categoryService) UpdateChannel(ctx context.Context, id string, req *models.UpdateChannelRequest) (*models.ChannelResponse, error) {
	if req.Type != "text" && req.Type != "voice" {
		return nil, ErrInvalidChannelType
	}

	channel, err := s.repo.FindChannelByID(ctx, id)
	if err != nil {
		return nil, ErrChannelNotFound
	}

	channel.Name = req.Name
	channel.Type = req.Type

	if err := s.repo.UpdateChannel(ctx, channel); err != nil {
		return nil, err
	}

	return &models.ChannelResponse{
		ID:         channel.ID,
		CategoryID: channel.CategoryID,
		Name:       channel.Name,
		Type:       channel.Type,
		Created:    channel.Created,
	}, nil
}

func (s *categoryService) DeleteChannel(ctx context.Context, id string) error {
	return s.repo.DeleteChannel(ctx, id)
}
