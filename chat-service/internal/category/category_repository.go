package category

import (
	"chat-service/internal/models"
	"context"

	"gorm.io/gorm"
)

type CategoryRepository interface {
	Create(ctx context.Context, category *models.Category) error
	FindByID(ctx context.Context, id string) (*models.Category, error)
	FindByServerID(ctx context.Context, serverID string) ([]*models.Category, error)
	Update(ctx context.Context, category *models.Category) error
	Delete(ctx context.Context, id string) error
	CreateChannel(ctx context.Context, channel *models.Channel) error
	FindChannelByID(ctx context.Context, id string) (*models.Channel, error)
	FindChannelsByCategoryID(ctx context.Context, categoryID string) ([]*models.Channel, error)
	UpdateChannel(ctx context.Context, channel *models.Channel) error
	DeleteChannel(ctx context.Context, id string) error
}

type categoryRepository struct {
	db *gorm.DB
}

func NewCategoryRepository(db *gorm.DB) CategoryRepository {
	return &categoryRepository{db: db}
}

func (r *categoryRepository) Create(ctx context.Context, category *models.Category) error {
	return r.db.WithContext(ctx).Create(category).Error
}

func (r *categoryRepository) FindByID(ctx context.Context, id string) (*models.Category, error) {
	var category models.Category
	err := r.db.WithContext(ctx).First(&category, "id = ?", id).Error
	return &category, err
}

func (r *categoryRepository) FindByServerID(ctx context.Context, serverID string) ([]*models.Category, error) {
	var categories []*models.Category
	err := r.db.WithContext(ctx).Where("server_id = ?", serverID).Find(&categories).Error
	return categories, err
}

func (r *categoryRepository) Update(ctx context.Context, category *models.Category) error {
	return r.db.WithContext(ctx).Save(category).Error
}

func (r *categoryRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&models.Category{}, "id = ?", id).Error
}

func (r *categoryRepository) CreateChannel(ctx context.Context, channel *models.Channel) error {
	return r.db.WithContext(ctx).Create(channel).Error
}

func (r *categoryRepository) FindChannelByID(ctx context.Context, id string) (*models.Channel, error) {
	var channel models.Channel
	err := r.db.WithContext(ctx).First(&channel, "id = ?", id).Error
	return &channel, err
}

func (r *categoryRepository) FindChannelsByCategoryID(ctx context.Context, categoryID string) ([]*models.Channel, error) {
	var channels []*models.Channel
	err := r.db.WithContext(ctx).Where("category_id = ?", categoryID).Find(&channels).Error
	return channels, err
}

func (r *categoryRepository) UpdateChannel(ctx context.Context, channel *models.Channel) error {
	return r.db.WithContext(ctx).Save(channel).Error
}

func (r *categoryRepository) DeleteChannel(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&models.Channel{}, "id = ?", id).Error
}
