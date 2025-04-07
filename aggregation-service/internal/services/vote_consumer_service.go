package services

import (
	"aggregation-service/configs"
	"aggregation-service/internal/models"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strconv"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/segmentio/kafka-go"
	"gorm.io/gorm"
)

type VoteConsumerService struct {
	cfg          *configs.Config
	redis        *redis.Client
	db           *gorm.DB
	voteCountSvc *VoteCountService // Reference to vote count service
}

func NewVoteConsumerService(
	cfg *configs.Config,
	redis *redis.Client,
	db *gorm.DB,
	voteCountSvc *VoteCountService,
) *VoteConsumerService {
	return &VoteConsumerService{
		cfg:          cfg,
		redis:        redis,
		db:           db,
		voteCountSvc: voteCountSvc,
	}
}

func (s *VoteConsumerService) Start() {
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers: []string{"localhost:29092"},
		Topic:   "votes",
		GroupID: "vote-group",
	})
	defer reader.Close()

	go func() {
		for {
			msg, err := reader.ReadMessage(context.Background())
			if err != nil {
				log.Println("❌ Kafka read error:", err)
				continue
			}

			var message models.VoteMessage
			if err := json.Unmarshal(msg.Value, &message); err != nil {
				log.Println("Invalid message format:", err)
				continue
			}
			s.processMessage(message)
		}
	}()
}

func (s *VoteConsumerService) processMessage(msg models.VoteMessage) {
	ctx := context.Background()
	userKey := fmt.Sprintf("vote:%d:%d", msg.UserID, msg.TopicID)

	// Check for duplicate vote
	exists, err := s.redis.Exists(ctx, userKey).Result()
	if err != nil {
		log.Println("Redis exists error:", err)
		return
	}
	if exists == 1 {
		return
	}

	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			log.Println("Recovered from panic:", r)
			tx.Rollback()
		}
	}()

	// Save to DB
	if err := tx.Create(&msg).Error; err != nil {
		tx.Rollback()
		log.Println("DB write error:", err)
		return
	}

	// Update Redis vote count
	voteKey := fmt.Sprintf("votes:%d", msg.TopicID)
	field := strconv.Itoa(int(msg.OptionID))

	if _, err := s.redis.HIncrBy(ctx, voteKey, field, 1).Result(); err != nil {
		tx.Rollback()
		log.Println("Redis HIncrBy error:", err)
		return
	}

	// Optional: only set expire if key has no TTL
	if ttl := s.redis.TTL(ctx, voteKey).Val(); ttl == -1 {
		s.redis.Expire(ctx, voteKey, 12*time.Hour)
	}

	// Mark user as voted
	s.redis.Set(ctx, userKey, true, 24*time.Hour)

	tx.Commit()
}
