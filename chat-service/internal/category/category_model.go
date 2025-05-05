package category

type CategoryModel struct {
	ID   uint   `gorm:"primaryKey" json:"id"`
	Name string `json:"name"`
	Slug string `json:"slug"`
}

type CreateCategoryDTO struct {
	Name string `json:"name" binding:"required"`
	Slug string `json:"slug" binding:"required"`
}

type UpdateCategoryDTO struct {
	Name string `json:"name"`
	Slug string `json:"slug"`
}
