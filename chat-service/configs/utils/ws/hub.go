package ws

import (
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type Hub struct {
	clients map[string]*websocket.Conn // userID -> connection
	mu      sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		clients: make(map[string]*websocket.Conn),
	}
}

// Register - Thêm kết nối vào hub
func (h *Hub) Register(userID string, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.clients[userID] = conn
}

// Unregister - Xóa kết nối
func (h *Hub) Unregister(userID string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.clients, userID)
}

// Broadcast - Gửi message đến một user cụ thể
func (h *Hub) SendToUser(userID string, message interface{}) error {
	h.mu.RLock()
	defer h.mu.RUnlock()
	conn, ok := h.clients[userID]
	if !ok {
		return nil // User không online
	}
	return conn.WriteJSON(message)
}

// BroadcastFriendStatus - Thông báo khi friend online/offline
func (h *Hub) BroadcastFriendStatus(friendID, status string) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for _, conn := range h.clients {
		// Logic kiểm tra userID và friendID có là bạn (cần query từ FriendService)
		// Ví dụ đơn giản: gửi cho tất cả
		conn.WriteJSON(gin.H{
			"event":  "friend_status",
			"userId": friendID,
			"status": status,
		})
	}
}
