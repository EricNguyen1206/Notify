package services

import (
	"aggregation-service/configs"
	"context"
	"fmt"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"github.com/gorilla/websocket"
)

type VoteCountService struct {
	cfg       *configs.Config
	redis     *redis.Client
	clients   map[string]map[*websocket.Conn]bool // topicID -> clients
	clientsMu sync.RWMutex
}

func NewVoteCountService(cfg *configs.Config, redis *redis.Client) *VoteCountService {
	return &VoteCountService{
		cfg:     cfg,
		redis:   redis,
		clients: make(map[string]map[*websocket.Conn]bool),
	}
}

func (s *VoteCountService) RegisterRoutes(router *gin.Engine) {
	router.GET("/ws/ranking/:topic_id", s.handleWebSocket)
}

func (s *VoteCountService) handleWebSocket(c *gin.Context) {
	topicID := c.Param("topic_id")
	// TODO: Add authentication to verify user has access to this topic

	upgrader := websocket.Upgrader{
		ReadBufferSize:  s.cfg.WebSocket.ReadBufferSize,
		WriteBufferSize: s.cfg.WebSocket.WriteBufferSize,
		CheckOrigin: func(r *http.Request) bool {
			return true // In production, restrict to allowed origins
		},
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	// Register client
	s.registerClient(topicID, conn)
	defer s.unregisterClient(topicID, conn)

	// Send initial ranking
	s.sendCurrentRanking(conn, topicID)

	// Keep connection alive
	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			break
		}
	}
}

func (s *VoteCountService) registerClient(topicID string, conn *websocket.Conn) {
	s.clientsMu.Lock()
	defer s.clientsMu.Unlock()

	if _, exists := s.clients[topicID]; !exists {
		s.clients[topicID] = make(map[*websocket.Conn]bool)
	}
	s.clients[topicID][conn] = true
}

func (s *VoteCountService) unregisterClient(topicID string, conn *websocket.Conn) {
	s.clientsMu.Lock()
	defer s.clientsMu.Unlock()

	if clients, exists := s.clients[topicID]; exists {
		delete(clients, conn)
		if len(clients) == 0 {
			delete(s.clients, topicID)
		}
	}
	conn.Close()
}

func (s *VoteCountService) BroadcastUpdate(topicID string) {
	s.clientsMu.RLock()
	defer s.clientsMu.RUnlock()

	clients, exists := s.clients[topicID]
	if !exists {
		return
	}

	ctx := context.Background()
	rankingKey := fmt.Sprintf("ranking:%s", topicID)
	results, err := s.redis.ZRevRangeWithScores(ctx, rankingKey, 0, 2).Result()
	if err != nil {
		return
	}

	rankingData := s.convertRankingResults(results)

	for client := range clients {
		go func(c *websocket.Conn) {
			if err := c.WriteJSON(rankingData); err != nil {
				s.unregisterClient(topicID, c)
			}
		}(client)
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
	rankings := make([]map[string]interface{}, 0, len(results))
	for _, res := range results {
		rankings = append(rankings, map[string]interface{}{
			"option_id": res.Member,
			"count":     int(res.Score),
		})
	}
	return rankings
}