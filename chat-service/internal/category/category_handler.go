package category

import (
	"github.com/gin-gonic/gin"
)

type CategoryHandler struct {
	categoryService *CategoryService
}

func NewCategoryHandler(categoryService *CategoryService) *CategoryHandler {
	return &CategoryHandler{categoryService: categoryService}
}

func (h *CategoryHandler) GetAllCategories(c *gin.Context) {
	categories, err := h.categoryService.FindAll()
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, categories)
}

func (h *CategoryHandler) CreateNewCategory(c *gin.Context) {
	var dto CreateCategoryDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	category, err := h.categoryService.Create(dto)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(201, category)
}

func (h *CategoryHandler) UpdateCategory(c *gin.Context) {
	var dto UpdateCategoryDTO
	var id uint
	if err := c.ShouldBindUri(&id); err != nil {
		c.JSON(400, gin.H{"error": "invalid id"})
		return
	}

	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	category, err := h.categoryService.Update(id, dto)
	if err != nil {
		c.JSON(404, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, category)
}

func (h *CategoryHandler) DeleteCategory(c *gin.Context) {
	var id uint
	if err := c.ShouldBindUri(&id); err != nil {
		c.JSON(400, gin.H{"error": "invalid id"})
		return
	}

	err := h.categoryService.Delete(id)
	if err != nil {
		c.JSON(404, gin.H{"error": err.Error()})
		return
	}
	c.Status(204)
}
