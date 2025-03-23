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

	"github.com/IBM/sarama"
	"github.com/go-redis/redis/v8"
	"gorm.io/gorm"
)

type VoteConsumerService struct {
	cfg   *configs.Config
	redis *redis.Client
	db    *gorm.DB
}

func NewVoteConsumerService(cfg *configs.Config, redis *redis.Client, db *gorm.DB) *VoteConsumerService {
	return &VoteConsumerService{
		cfg:   cfg,
		redis: redis,
		db:    db,
	}
}

func (s *VoteConsumerService) Start() {
	config := sarama.NewConfig()
	consumer, err := sarama.NewConsumer(s.cfg.Kafka.Brokers, config)
	if err != nil {
		log.Fatal("Error creating consumer:", err)
	}

	partitionConsumer, err := consumer.ConsumePartition(
		s.cfg.Kafka.Topic, 0, sarama.OffsetNewest)
	if err != nil {
		log.Fatal("Error creating partition consumer:", err)
	}

	for msg := range partitionConsumer.Messages() {
		s.processMessage(msg)
	}
}

func (s *VoteConsumerService) processMessage(msg *sarama.ConsumerMessage) {
	var vote models.Vote
	if err := json.Unmarshal(msg.Value, &vote); err != nil {
		log.Println("Error decoding message:", err)
		return
	}

	ctx := context.Background()
	userKey := fmt.Sprintf("vote:%d:%d", vote.UserID, vote.TopicID)
	if s.redis.Exists(ctx, userKey).Val() == 1 {
		return
	}

	if err := s.db.Create(&vote).Error; err != nil {
		log.Println("DB write error:", err)
		return
	}

	rankingKey := fmt.Sprintf("ranking:%d", vote.TopicID)
	s.redis.ZIncrBy(ctx, rankingKey, 1, strconv.FormatUint(uint64(vote.OptionID), 10))
	s.redis.Set(ctx, userKey, 1, 24*time.Hour)
}
