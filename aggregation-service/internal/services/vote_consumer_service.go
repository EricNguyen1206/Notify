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
	config := sarama.NewConfig()
	config.Consumer.Offsets.Initial = sarama.OffsetOldest

	consumer, err := sarama.NewConsumerGroup(s.cfg.Kafka.Brokers, "aggregation-group", config)
	if err != nil {
		log.Fatal("Error creating consumer group:", err)
	}

	go func() {
		for {
			if err := consumer.Consume(
				context.Background(),
				[]string{s.cfg.Kafka.Topic},
				s,
			); err != nil {
				log.Printf("Error from consumer: %v", err)
			}
		}
	}()
}

func (s *VoteConsumerService) Setup(sarama.ConsumerGroupSession) error {
	return nil
}

func (s *VoteConsumerService) Cleanup(sarama.ConsumerGroupSession) error {
	return nil
}

func (s *VoteConsumerService) ConsumeClaim(
	session sarama.ConsumerGroupSession,
	claim sarama.ConsumerGroupClaim,
) error {
	for msg := range claim.Messages() {
		s.processMessage(msg)
		session.MarkMessage(msg, "")
	}
	return nil
}

func (s *VoteConsumerService) processMessage(msg *sarama.ConsumerMessage) {
	var vote models.Vote
	if err := json.Unmarshal(msg.Value, &vote); err != nil {
		log.Println("Error decoding message:", err)
		return
	}

	ctx := context.Background()
	userKey := fmt.Sprintf("vote:%d:%d", vote.UserID, vote.TopicID)

	// Check for duplicate vote
	if s.redis.Exists(ctx, userKey).Val() == 1 {
		return
	}

	// Start transaction
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Save to database
	if err := tx.Create(&vote).Error; err != nil {
		tx.Rollback()
		log.Println("DB write error:", err)
		return
	}

	// Update Redis
	rankingKey := fmt.Sprintf("ranking:%d", vote.TopicID)
	prevScore := s.redis.ZScore(ctx, rankingKey, strconv.FormatUint(uint64(vote.OptionID), 10)).Val()

	if _, err := s.redis.ZIncrBy(ctx, rankingKey, 1, strconv.FormatUint(uint64(vote.OptionID), 10)).Result(); err != nil {
		tx.Rollback()
		log.Println("Redis update error:", err)
		return
	}

	// Only broadcast if score changed
	if newScore := s.redis.ZScore(ctx, rankingKey, strconv.FormatUint(uint64(vote.OptionID), 10)).Val(); newScore != prevScore {
		s.voteCountSvc.BroadcastUpdate(strconv.FormatUint(uint64(vote.TopicID), 10))
	}

	s.redis.Set(ctx, userKey, 1, 24*time.Hour)
	tx.Commit()
}
