package category

import (
	"context"

	"gorm.io/gorm"
)

type CategoryRepository interface {
	Create(ctx context.Context, category *Category) error
	FindByID(ctx context.Context, id string) (*Category, error)
	FindByServerID(ctx context.Context, serverID string) ([]*Category, error)
	Update(ctx context.Context, category *Category) error
	Delete(ctx context.Context, id string) error
	CreateChannel(ctx context.Context, channel *Channel) error
	FindChannelByID(ctx context.Context, id string) (*Channel, error)
	FindChannelsByCategoryID(ctx context.Context, categoryID string) ([]*Channel, error)
	UpdateChannel(ctx context.Context, channel *Channel) error
	DeleteChannel(ctx context.Context, id string) error
}

type categoryRepository struct {
	db *gorm.DB
}

func NewCategoryRepository(db *gorm.DB) CategoryRepository {
	return &categoryRepository{db: db}
}

func (r *categoryRepository) Create(ctx context.Context, category *Category) error {
	return r.db.WithContext(ctx).Create(category).Error
}

func (r *categoryRepository) FindByID(ctx context.Context, id string) (*Category, error) {
	var category Category
	err := r.db.WithContext(ctx).First(&category, "id = ?", id).Error
	return &category, err
}

func (r *categoryRepository) FindByServerID(ctx context.Context, serverID string) ([]*Category, error) {
	var categories []*Category
	err := r.db.WithContext(ctx).Where("server_id = ?", serverID).Find(&categories).Error
	return categories, err
}

func (r *categoryRepository) Update(ctx context.Context, category *Category) error {
	return r.db.WithContext(ctx).Save(category).Error
}

func (r *categoryRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&Category{}, "id = ?", id).Error
}

func (r *categoryRepository) CreateChannel(ctx context.Context, channel *Channel) error {
	return r.db.WithContext(ctx).Create(channel).Error
}

func (r *categoryRepository) FindChannelByID(ctx context.Context, id string) (*Channel, error) {
	var channel Channel
	err := r.db.WithContext(ctx).First(&channel, "id = ?", id).Error
	return &channel, err
}

func (r *categoryRepository) FindChannelsByCategoryID(ctx context.Context, categoryID string) ([]*Channel, error) {
	var channels []*Channel
	err := r.db.WithContext(ctx).Where("category_id = ?", categoryID).Find(&channels).Error
	return channels, err
}

func (r *categoryRepository) UpdateChannel(ctx context.Context, channel *Channel) error {
	return r.db.WithContext(ctx).Save(channel).Error
}

func (r *categoryRepository) DeleteChannel(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&Channel{}, "id = ?", id).Error
}
