package websocket

import (
	"chat-service/internal/auth"
	"log"
	"net/http"

	"github.com/coder/websocket"
)

type Client struct {
	Hub  *Hub
	Conn *websocket.Conn
	Send chan []byte
	User *auth.UserModel
}

type Hub struct {
	Clients    map[*Client]bool
	Broadcast  chan []byte
	Register   chan *Client
	Unregister chan *Client
}

func NewHub() *Hub {
	return &Hub{
		Broadcast:  make(chan []byte),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Clients:    make(map[*Client]bool),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.Clients[client] = true
		case client := <-h.Unregister:
			if _, ok := h.Clients[client]; ok {
				delete(h.Clients, client)
				close(client.Send)
			}
		case message := <-h.Broadcast:
			for client := range h.Clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.Clients, client)
				}
			}
		}
	}
}

func ServeWs(hub *Hub, w http.ResponseWriter, r *http.Request, authRepo *auth.AuthRepository) {
	// Upgrade HTTP to WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	// Authenticate user from query token
	token := r.URL.Query().Get("token")
	if token == "" {
		conn.Close()
		return
	}

	// jwtToken, err := authService.ValidateJWT(token)
	// if err != nil || !jwtToken.Valid {
	// 	conn.Close()
	// 	return
	// }

	// claims, ok := jwtToken.Claims.(jwt.MapClaims)
	// if !ok {
	// 	conn.Close()
	// 	return
	// }

	// userID, ok := claims["id"].(string)
	// if !ok {
	// 	conn.Close()
	// 	return
	// }

	user, err := authRepo.FindByEmail(context, "abc")
	if err != nil || user == nil {
		conn.Close()
		return
	}

	client := &Client{
		Hub:  hub,
		Conn: conn,
		Send: make(chan []byte, 256),
		User: user,
	}

	client.Hub.Register <- client

	go client.writePump()
	go client.readPump()
}
