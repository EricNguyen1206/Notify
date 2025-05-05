package category

import (
	"errors"

	"gorm.io/gorm"
)

type CategoryService struct {
	DB *gorm.DB
}

func NewCategoryService(db *gorm.DB) *CategoryService {
	return &CategoryService{DB: db}
}

func (s *CategoryService) FindAll() ([]CategoryModel, error) {
	var categories []CategoryModel
	result := s.DB.Find(&categories)
	return categories, result.Error
}

func (s *CategoryService) Create(data CreateCategoryDTO) (CategoryModel, error) {
	category := CategoryModel{Name: data.Name, Slug: data.Slug}
	result := s.DB.Create(&category)
	return category, result.Error
}

func (s *CategoryService) Update(id uint, data UpdateCategoryDTO) (CategoryModel, error) {
	var category CategoryModel
	if err := s.DB.First(&category, id).Error; err != nil {
		return category, err
	}

	s.DB.Model(&category).Updates(data)
	return category, nil
}

func (s *CategoryService) Delete(id uint) error {
	result := s.DB.Delete(&CategoryModel{}, id)
	if result.RowsAffected == 0 {
		return errors.New("category not found")
	}
	return result.Error
}
