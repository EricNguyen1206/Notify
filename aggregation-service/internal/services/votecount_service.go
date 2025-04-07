package services

import (
	"aggregation-service/configs"
	"log"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"github.com/gorilla/websocket"
)

type subscription struct {
	topicID string
	conn    *websocket.Conn
}

type VoteUpdate struct {
	TopicID  string `json:"topic_id"`
	OptionID string `json:"option_id"`
	Count    int64  `json:"count"`
}

type VoteCountService struct {
	cfg        *configs.Config
	redis      *redis.Client
	clients    map[string]map[*websocket.Conn]bool
	clientsMu  sync.RWMutex
	register   chan subscription
	unregister chan subscription
	broadcast  chan VoteUpdate
}

func NewVoteCountService(cfg *configs.Config, redis *redis.Client) *VoteCountService {
	svc := &VoteCountService{
		cfg:        cfg,
		redis:      redis,
		clients:    make(map[string]map[*websocket.Conn]bool),
		register:   make(chan subscription),
		unregister: make(chan subscription),
		broadcast:  make(chan VoteUpdate),
	}
	go svc.run()
	return svc
}

func (s *VoteCountService) RegisterRoutes(router *gin.Engine) {
	router.GET("/ws/topics/:topic_id", s.handleWebSocket)
}

func (s *VoteCountService) handleWebSocket(c *gin.Context) {
	topicID := c.Param("topic_id")

	upgrader := websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println("WebSocket upgrade failed:", err)
		return
	}

	sub := subscription{topicID: topicID, conn: conn}
	s.register <- sub
	defer func() {
		s.unregister <- sub
	}()

	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			break
		}
	}
}

func (s *VoteCountService) run() {
	for {
		select {
		case sub := <-s.register:
			s.clientsMu.Lock()
			if s.clients[sub.topicID] == nil {
				s.clients[sub.topicID] = make(map[*websocket.Conn]bool)
			}
			s.clients[sub.topicID][sub.conn] = true
			s.clientsMu.Unlock()

		case sub := <-s.unregister:
			s.clientsMu.Lock()
			if clients, ok := s.clients[sub.topicID]; ok {
				if _, exists := clients[sub.conn]; exists {
					delete(clients, sub.conn)
					sub.conn.Close()
				}
			}
			s.clientsMu.Unlock()

		case msg := <-s.broadcast:
			s.clientsMu.RLock()
			conns := s.clients[msg.TopicID]
			for conn := range conns {
				err := conn.WriteJSON(msg)
				if err != nil {
					log.Println("Write error:", err)
					s.unregister <- subscription{topicID: msg.TopicID, conn: conn}
				}
			}
			s.clientsMu.RUnlock()
		}
	}
}
