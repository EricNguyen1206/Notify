package handlers

import (
	"net/http"

	config "voting-service/internal/adapters/websocket"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all connections (update for production)
	},
}

type WebSocketHandler struct {
	hub *config.Hub
}

func NewWebSocketHandler(hub *config.Hub) *WebSocketHandler {
	return &WebSocketHandler{hub: hub}
}

// HandleWebSocket upgrades HTTP to WebSocket and handles connections
func (h *WebSocketHandler) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}

	h.hub.HandleWebSocket(conn)
}
