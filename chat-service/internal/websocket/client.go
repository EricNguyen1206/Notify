package websocket

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"log/slog"

	"github.com/gorilla/websocket"
)

const (
	// Time allowed to write a message to the peer
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer
	maxMessageSize = 512
)

type Client struct {
	hub    *Hub
	conn   *websocket.Conn
	send   chan []byte
	userID string
	// Connection state management
	ctx    context.Context
	cancel context.CancelFunc
}

func NewClient(hub *Hub, conn *websocket.Conn, userID string) *Client {
	ctx, cancel := context.WithCancel(context.Background())

	return &Client{
		hub:    hub,
		conn:   conn,
		send:   make(chan []byte, 256),
		userID: userID,
		ctx:    ctx,
		cancel: cancel,
	}
}

func (c *Client) readPump(h *Hub) {
	defer func() {
		h.unregister <- c
		_ = c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPingHandler(nil)
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, messageBytes, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				slog.Error("readPump error", "error", err, "userID", c.userID)
			}
			break
		}
		// push the message to the hub broadcast channel
		c.hub.broadcast <- messageBytes
	}
}

func (c *Client) writePump() {
	defer func() {
		_ = c.conn.Close()
	}()

	c.conn.SetWriteDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetWriteDeadline(time.Now().Add(pongWait))
		return nil
	})

	for msgByte := range c.send {
		c.conn.SetWriteDeadline(time.Now().Add(writeWait))
		// Convert the msg from byte[] to JSON and send
		var msg Message
		if err := json.Unmarshal(msgByte, &msg); err != nil {
			slog.Error("Failed to unmarshal message", "error", err)
			errMsg := NewErrorMessage(msg.ID, msg.UserID, "ERROR", "Failed to unmarshal message")
			if err := c.conn.WriteJSON(errMsg); err != nil {
				slog.Error("write error", "userID", c.userID, "error", err)
			}
			continue
		}
		if err := c.conn.WriteJSON(msg); err != nil {
			slog.Error("write error", "userID", c.userID, "error", err)
			return
		}
	}
}

/**
* ServeWS upgrades the HTTP server connection to the WebSocket protocol and serves the client.
* @param hub The WebSocket hub to register the client with.
* @param w The HTTP response writer.
* @param r The HTTP request.
* @param userID The validated user ID re-use for client in Hub.
 */
func ServeWS(hub *Hub, w http.ResponseWriter, r *http.Request, userID string) {
	// Upgrade the connection to WebSocket protocol from HTTP 1.1 to websocket
	conn, err := Upgrader.Upgrade(w, r, nil)
	if err != nil {
		slog.Error("Failed to upgrade WebSocket connection", "userID", userID, "error", err)
		return
	}

	client := NewClient(hub, conn, userID)

	// Register client with hub and wait for confirmation
	hub.register <- client

	// Start the pumps after registration
	go client.writePump()
	go client.readPump(hub)
}
