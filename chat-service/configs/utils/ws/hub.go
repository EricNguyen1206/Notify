package ws

import (
	"chat-service/internal/models"
	"log"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type Hub struct {
	clients map[uint]*websocket.Conn // userID -> connection
	mu      sync.RWMutex
}

func NewHub() *Hub {
	log.Printf("Creating new WebSocket hub")
	return &Hub{
		clients: make(map[uint]*websocket.Conn),
	}
}

// Register - Add connection to hub
func (h *Hub) Register(userID uint, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	log.Printf("Registering user %d in WebSocket hub", userID)
	h.clients[userID] = conn
}

// Unregister - Remove connection
func (h *Hub) Unregister(userID uint) {
	h.mu.Lock()
	defer h.mu.Unlock()
	log.Printf("Unregistering user %d from WebSocket hub", userID)
	delete(h.clients, userID)
}

// SendToUser - Send message to a specific user
func (h *Hub) SendToUser(userID uint, message interface{}) error {
	h.mu.RLock()
	defer h.mu.RUnlock()
	conn, ok := h.clients[userID]
	if !ok {
		log.Printf("User %d not found in WebSocket hub", userID)
		return nil // User not online
	}
	log.Printf("Sending message to user %d", userID)
	return conn.WriteJSON(message)
}

// BroadcastUserStatus - Notify when user goes online/offline
func (h *Hub) BroadcastUserStatus(id uint, status models.UserStatus) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	log.Printf("Broadcasting friend status: user %d is %s", id, status)

	message := gin.H{
		"type": "friend_status",
		"data": gin.H{
			"userId": id,
			"status": status,
		},
	}

	// Send to all online users
	for userID, conn := range h.clients {
		if userID != id { // Don't send to the user who changed status
			log.Printf("Sending status update to user %d", userID)
			if err := conn.WriteJSON(message); err != nil {
				log.Printf("Error sending status update to user %d: %v", userID, err)
				conn.Close()
				delete(h.clients, userID)
				continue
			}
		}
	}
}

// BroadcastFriendStatus - Notify when friend goes online/offline
func (h *Hub) BroadcastFriendStatus(friendID uint, status models.UserStatus) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	log.Printf("Broadcasting friend status: user %d is %s", friendID, status)

	message := gin.H{
		"type": "friend_status",
		"data": gin.H{
			"userId": friendID,
			"status": status,
		},
	}

	// Send to all online users
	for userID, conn := range h.clients {
		if userID != friendID { // Don't send to the user who changed status
			log.Printf("Sending status update to user %d", userID)
			if err := conn.WriteJSON(message); err != nil {
				log.Printf("Error sending status update to user %d: %v", userID, err)
				conn.Close()
				delete(h.clients, userID)
				continue
			}
		}
	}
}

// GetOnlineUsers - Get list of online users
func (h *Hub) GetOnlineUsers() []uint {
	h.mu.RLock()
	defer h.mu.RUnlock()

	users := make([]uint, 0, len(h.clients))
	for userID := range h.clients {
		users = append(users, userID)
	}
	return users
}
