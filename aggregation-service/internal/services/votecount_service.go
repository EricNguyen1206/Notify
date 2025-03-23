package services

import (
	"aggregation-service/configs"
	"context"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"github.com/gorilla/websocket"
)

type VoteCountService struct {
	cfg   *configs.Config
	redis *redis.Client
}

func NewVoteCountService(cfg *configs.Config, redis *redis.Client) *VoteCountService {
	return &VoteCountService{
		cfg:   cfg,
		redis: redis,
	}
}

func (s *VoteCountService) RegisterRoutes(router *gin.Engine) {
	router.GET("/ws/ranking/:topic_id", s.handleWebSocket)
}

func (s *VoteCountService) handleWebSocket(c *gin.Context) {
	topicID := c.Param("topic_id")

	upgrader := websocket.Upgrader{
		ReadBufferSize:  s.cfg.WebSocket.ReadBufferSize,
		WriteBufferSize: s.cfg.WebSocket.WriteBufferSize,
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	ctx := context.Background()
	pubsub := s.redis.Subscribe(ctx, fmt.Sprintf("votes_update:%s", topicID))
	defer pubsub.Close()

	s.sendCurrentRanking(conn, topicID)

	// go func() {
	// 	for i = 0; i < len(pubsub.Channel()); i++ {
	// 		s.sendCurrentRanking(conn, topicID)

	// 	}
	// }()

	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			break
		}
	}
}

func (s *VoteCountService) sendCurrentRanking(conn *websocket.Conn, topicID string) {
	ctx := context.Background()
	rankingKey := fmt.Sprintf("ranking:%s", topicID)

	results, err := s.redis.ZRevRangeWithScores(ctx, rankingKey, 0, 2).Result()
	if err != nil {
		return
	}

	conn.WriteJSON(s.convertRankingResults(results))
}

func (s *VoteCountService) convertRankingResults(results []redis.Z) []map[string]interface{} {
	rankings := make([]map[string]interface{}, 0)
	for _, res := range results {
		rankings = append(rankings, map[string]interface{}{
			"option_id": res.Member,
			"count":     int(res.Score),
		})
	}
	return rankings
}
