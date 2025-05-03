package handlers

import (
	"context"
	"encoding/binary"
	"encoding/json"
	"net/http"

	"chat-service/configs"
	"chat-service/internal/ports/models"
	"chat-service/internal/server/middleware"
	"chat-service/internal/server/service"

	"github.com/gin-gonic/gin"
	"github.com/segmentio/kafka-go"
)

type VoteHandler struct {
	voteService *service.VoteService
}

func NewVoteHandler(voteService *service.VoteService) *VoteHandler {
	return &VoteHandler{
		voteService: voteService,
	}
}

func (h *VoteHandler) CastVote(c *gin.Context) {
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

	// Prepare Kafka message
	voteMessage := models.VoteMessage{
		UserID:   user.ID,
		TopicID:  req.TopicID,
		OptionID: req.OptionID,
	}

	// Load configuration
	cfg := configs.Load()
	writer := kafka.NewWriter(kafka.WriterConfig{
		Brokers: cfg.Kafka.Brokers,
		Topic:   cfg.Kafka.Topic,
	})
	defer writer.Close()

	messageBytes, err := json.Marshal(voteMessage)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "vote recorded failed", "error": err.Error(), "messageBytes": messageBytes})
		return
	}
	idBytes := make([]byte, 8) // Assuming uint64 or uint size
	binary.BigEndian.PutUint64(idBytes, uint64(user.ID))
	kafkaErr := writer.WriteMessages(context.Background(),
		kafka.Message{
			Key:   idBytes,
			Value: messageBytes,
		})
	if kafkaErr != nil {
		c.JSON(http.StatusConflict, gin.H{"message": "vote recorded failed", "error": kafkaErr.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "vote recorded successfully"})
}
