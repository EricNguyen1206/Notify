package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"voting-service/internal/ports/models"
	"voting-service/internal/server/middleware"
	"voting-service/internal/server/service"

	"github.com/IBM/sarama"
	"github.com/gin-gonic/gin"
)

type VoteHandler struct {
	voteService *service.VoteService
	producer    sarama.SyncProducer
}

func NewVoteHandler(voteService *service.VoteService, producer sarama.SyncProducer) *VoteHandler {
	return &VoteHandler{
		voteService: voteService,
		producer:    producer,
	}
}

// @Summary Cast a vote for an option
// @Description Submit a vote for a specific option
// @Tags votes
// @Accept json
// @Produce json
// @Param request body models.VoteRequest true "Vote Request"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /topics/{topic_id}/options/{option_id}/vote [post]
func (h *VoteHandler) CastVote(c *gin.Context) {
	// Get authenticated user
	user, err := middleware.GetUserFromContext(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req models.VoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Prepare vote event data for Kafka
	voteEvent := map[string]interface{}{
		"user_id":   user.ID,
		"option_id": req.OptionID,
		"topic_id":  req.TopicID,
		"timestamp": time.Now().Unix(),
	}

	eventBytes, err := json.Marshal(voteEvent)
	if err != nil {
		log.Printf("Error marshalling vote event: %v", err)
		// Don't return error to client as vote was successful
		return
	}

	// Publish the vote event to Kafka asynchronously
	go func() {
		msg := &sarama.ProducerMessage{
			Topic: "votes",
			Value: sarama.ByteEncoder(eventBytes),
			Key:   sarama.StringEncoder(req.TopicID), // Use topicID as key for partitioning
		}

		partition, offset, err := h.producer.SendMessage(msg)
		if err != nil {
			log.Printf("Failed to send vote event to Kafka: %v", err)
			return
		}
		log.Printf("Vote event sent to Kafka partition %d at offset %d", partition, offset)
	}()

	c.JSON(http.StatusOK, gin.H{
		"message": "vote recorded successfully",
	})
}
