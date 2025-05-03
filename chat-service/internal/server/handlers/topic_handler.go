package handlers

import (
	"net/http"

	"chat-service/internal/ports/models"
	"chat-service/internal/server/service"

	"github.com/gin-gonic/gin"
)

type TopicHandler struct {
	topicService *service.TopicService
}

func NewTopicHandler(topicService *service.TopicService) *TopicHandler {
	return &TopicHandler{topicService: topicService}
}

// @Summary Create a new topic
// @Description Create a new voting topic with an image
// @Tags topics
// @Accept multipart/form-data
// @Produce json
// @Param title formData string true "Topic Title"
// @Param description formData string true "Topic Description"
// @Param image formData file true "Topic Image"
// @Param start_time formData string true "Start Time (YYYY-MM-DD HH:mm:ss)"
// @Param end_time formData string true "End Time (YYYY-MM-DD HH:mm:ss)"
// @Success 201 {object} models.Topic
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /topics [post]
func (h *TopicHandler) CreateTopic(c *gin.Context) {
	var req models.CreateTopicRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	topic, err := h.topicService.CreateTopic(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, topic)
}

// @Summary Get all topics
// @Description Get all voting topics
// @Tags topics
// @Produce json
// @Success 200 {array} models.Topic
// @Failure 500 {object} map[string]string
// @Router /topics [get]
func (h *TopicHandler) GetAllTopics(c *gin.Context) {
	topics, err := h.topicService.GetAllTopics(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, topics)
}
