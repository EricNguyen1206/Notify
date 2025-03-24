package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
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

	// Validate vote first
	if err := h.voteService.CastVote(c.Request.Context(), user.ID, req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to record vote"})
		return
	}

	// Prepare Kafka message
	voteMessage := models.VoteMessage{
		UserID:    user.ID,
		TopicID:   req.TopicID,
		OptionID:  req.OptionID,
		Timestamp: time.Now().Unix(),
	}

	messageBytes, err := json.Marshal(voteMessage)
	if err != nil {
		log.Printf("Error marshalling vote message: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	// Send to Kafka
	msg := &sarama.ProducerMessage{
		Topic: "votes",
		Value: sarama.ByteEncoder(messageBytes),
		Key:   sarama.StringEncoder(strconv.FormatUint(uint64(req.TopicID), 10)), // Partition by topic
	}

	if _, _, err := h.producer.SendMessage(msg); err != nil {
		log.Printf("Failed to send vote to Kafka: %v", err)
		// Consider how to handle this - maybe retry queue?
	}

	c.JSON(http.StatusOK, gin.H{"message": "vote recorded successfully"})
}

func (h *VoteHandler) sendToKafkaWithRetry(msg *sarama.ProducerMessage, maxRetries int) error {
	var err error
	for i := 0; i < maxRetries; i++ {
		_, _, err = h.producer.SendMessage(msg)
		if err == nil {
			return nil
		}

		log.Printf("Attempt %d: Failed to send to Kafka: %v", i+1, err)
		time.Sleep(time.Second * time.Duration(i+1)) // Exponential backoff
	}
	return err
}
