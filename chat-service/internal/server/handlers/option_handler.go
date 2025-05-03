package handlers

import (
	"net/http"
	"strconv"

	"chat-service/internal/ports/models"
	"chat-service/internal/server/service"

	"github.com/gin-gonic/gin"
)

type OptionHandler struct {
	optionService *service.OptionService
}

func NewOptionHandler(optionService *service.OptionService) *OptionHandler {
	return &OptionHandler{optionService: optionService}
}

// @Summary Add an option to a topic
// @Description Add a new voting option to a topic
// @Tags options
// @Accept json
// @Produce json
// @Param request body models.AddOptionRequest true "Add Option Request"
// @Success 201 {object} models.Option
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /topics/{topic_id}/options [post]
func (h *OptionHandler) AddOption(c *gin.Context) {
	var req models.AddOptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	option, err := h.optionService.AddOption(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, option)
}

func (h *OptionHandler) GetOptions(c *gin.Context) {
	topicID := c.Param("topic_id")
	if topicID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "topic_id is required"})
		return
	}

	topicIDUint, err := strconv.ParseUint(topicID, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid topic_id format"})
		return
	}
	options, err := h.optionService.GetOptionsByTopic(c.Request.Context(), uint(topicIDUint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, options)
}
