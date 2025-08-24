package websocket

import (
	"context"
	"encoding/json"
	"net/http"
	"sync"
	"sync/atomic"
	"time"

	"log/slog"

	"github.com/google/uuid"
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

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// In production, implement proper origin checking
		return true
	},
}

type Client struct {
	id       string
	hub      *Hub
	conn     *websocket.Conn
	send     chan []byte
	userID   string
	channels map[string]bool // Set of channel IDs the client is subscribed to
	mu       sync.RWMutex

	// Connection state management
	ctx        context.Context
	cancel     context.CancelFunc
	closed     int32 // atomic flag to track if client is closed
	sendClosed int32 // atomic flag to track if send channel is closed

	// Goroutine coordination
	wg sync.WaitGroup // Wait group for goroutine coordination
}

func NewClient(hub *Hub, conn *websocket.Conn, userID string) *Client {
	ctx, cancel := context.WithCancel(context.Background())

	return &Client{
		id:         uuid.New().String(),
		hub:        hub,
		conn:       conn,
		send:       make(chan []byte, 256),
		userID:     userID,
		channels:   make(map[string]bool),
		ctx:        ctx,
		cancel:     cancel,
		closed:     0,
		sendClosed: 0,
	}
}

func (c *Client) GetID() string {
	return c.id
}

func (c *Client) GetUserID() string {
	return c.userID
}

func (c *Client) GetChannels() []string {
	c.mu.RLock()
	defer c.mu.RUnlock()

	channels := make([]string, 0, len(c.channels))
	for channelID := range c.channels {
		channels = append(channels, channelID)
	}
	return channels
}

func (c *Client) AddChannel(channelID string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.channels[channelID] = true
}

func (c *Client) RemoveChannel(channelID string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.channels, channelID)
}

func (c *Client) IsInChannel(channelID string) bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.channels[channelID]
}

// isClosed returns true if the client is closed
func (c *Client) isClosed() bool {
	return atomic.LoadInt32(&c.closed) == 1
}

// close marks the client as closed and cancels the context
func (c *Client) close() {
	if atomic.CompareAndSwapInt32(&c.closed, 0, 1) {
		c.cancel()
		slog.Debug("Client marked as closed", "clientID", c.id, "userID", c.userID)
	}
}

// closeSendChannel safely closes the send channel
func (c *Client) closeSendChannel() {
	if atomic.CompareAndSwapInt32(&c.sendClosed, 0, 1) {
		close(c.send)
		slog.Debug("Send channel closed", "clientID", c.id, "userID", c.userID)
	}
}

// waitForGoroutines waits for all client goroutines to finish with timeout
func (c *Client) waitForGoroutines(timeout time.Duration) {
	done := make(chan struct{})
	go func() {
		c.wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		slog.Debug("All goroutines finished", "clientID", c.id, "userID", c.userID)
	case <-time.After(timeout):
		slog.Warn("Timeout waiting for goroutines to finish", "clientID", c.id, "userID", c.userID, "timeout", timeout)
	}
}

func (c *Client) readPump() {
	c.wg.Add(1)
	defer func() {
		c.wg.Done()
		c.close() // Mark client as closed and cancel context

		// Send unregister request to hub
		select {
		case c.hub.unregister <- c:
			slog.Debug("Client unregister request sent", "clientID", c.id, "userID", c.userID)
		case <-time.After(5 * time.Second):
			slog.Warn("Timeout sending unregister request", "clientID", c.id, "userID", c.userID)
		}

		// Close connection
		if err := c.conn.Close(); err != nil {
			slog.Debug("Error closing connection", "clientID", c.id, "userID", c.userID, "error", err)
		}
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		if c.isClosed() {
			return websocket.ErrCloseSent
		}
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	slog.Debug("ReadPump started", "clientID", c.id, "userID", c.userID)

	for {
		select {
		case <-c.ctx.Done():
			slog.Debug("ReadPump context cancelled", "clientID", c.id, "userID", c.userID)
			return
		default:
		}

		_, messageBytes, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				slog.Error("WebSocket error", "clientID", c.id, "userID", c.userID, "error", err)
			} else {
				slog.Debug("WebSocket connection closed", "clientID", c.id, "userID", c.userID, "error", err)
			}
			break
		}

		slog.Debug("Received message", "clientID", c.id, "userID", c.userID, "message", string(messageBytes))

		var msg Message
		if err := json.Unmarshal(messageBytes, &msg); err != nil {
			slog.Error("Failed to unmarshal message", "clientID", c.id, "userID", c.userID, "error", err)
			c.sendError("INVALID_MESSAGE", "Invalid message format")
			continue
		}

		// Set user ID and timestamp
		msg.UserID = c.userID
		msg.Timestamp = time.Now().Unix()
		if msg.ID == "" {
			msg.ID = uuid.New().String()
		}

		// Handle the message with timeout
		select {
		case c.hub.handleMessage <- &ClientMessage{
			Client:  c,
			Message: &msg,
		}:
		case <-time.After(5 * time.Second):
			slog.Warn("Timeout sending message to hub", "clientID", c.id, "userID", c.userID)
		case <-c.ctx.Done():
			slog.Debug("ReadPump context cancelled while sending message", "clientID", c.id, "userID", c.userID)
			return
		}
	}
}

func (c *Client) writePump() {
	c.wg.Add(1)
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		c.wg.Done()
		ticker.Stop()

		// Don't close connection here as readPump handles it
		slog.Debug("WritePump finished", "clientID", c.id, "userID", c.userID)
	}()

	slog.Debug("WritePump started", "clientID", c.id, "userID", c.userID)

	for {
		select {
		case message, ok := <-c.send:
			if c.isClosed() {
				return
			}

			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// Send channel was closed, send close message and exit
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				slog.Debug("Error getting next writer", "clientID", c.id, "userID", c.userID, "error", err)
				return
			}

			if _, err := w.Write(message); err != nil {
				slog.Debug("Error writing message", "clientID", c.id, "userID", c.userID, "error", err)
				w.Close()
				return
			}

			// Add queued messages to the current WebSocket message
			n := len(c.send)
			for i := 0; i < n; i++ {
				select {
				case queuedMsg := <-c.send:
					w.Write([]byte{'\n'})
					w.Write(queuedMsg)
				default:
					// No more messages in queue
					goto writeComplete
				}
			}
		writeComplete:

			if err := w.Close(); err != nil {
				slog.Debug("Error closing writer", "clientID", c.id, "userID", c.userID, "error", err)
				return
			}

		case <-ticker.C:
			if c.isClosed() {
				return
			}

			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				slog.Debug("Error sending ping", "clientID", c.id, "userID", c.userID, "error", err)
				return
			}

		case <-c.ctx.Done():
			slog.Debug("WritePump context cancelled", "clientID", c.id, "userID", c.userID)
			return
		}
	}
}

func (c *Client) SendMessage(message *Message) error {
	if c.isClosed() {
		return ErrClientDisconnected
	}

	data, err := json.Marshal(message)
	if err != nil {
		return err
	}

	select {
	case c.send <- data:
		return nil
	default:
		// Send buffer is full, close the client
		slog.Warn("Send buffer full, closing client", "clientID", c.id, "userID", c.userID)
		c.closeSendChannel()
		return ErrClientDisconnected
	case <-c.ctx.Done():
		return ErrClientDisconnected
	}
}

func (c *Client) sendError(code, message string) {
	errorMsg := NewErrorMessage(uuid.New().String(), c.userID, code, message)
	c.SendMessage(errorMsg)
}

func ServeWS(hub *Hub, w http.ResponseWriter, r *http.Request, userID string) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		slog.Error("Failed to upgrade WebSocket connection", "userID", userID, "error", err)
		return
	}

	client := NewClient(hub, conn, userID)
	slog.Info("New WebSocket connection established", "clientID", client.id, "userID", client.userID)

	// Send register request to hub with timeout
	select {
	case client.hub.register <- client:
		slog.Debug("Client registration request sent", "clientID", client.id, "userID", client.userID)
	case <-time.After(5 * time.Second):
		slog.Error("Timeout sending registration request", "clientID", client.id, "userID", client.userID)
		conn.Close()
		return
	}

	// Start goroutines for handling WebSocket communication
	go client.writePump()
	go client.readPump()

	slog.Debug("WebSocket goroutines started", "clientID", client.id, "userID", client.userID)
}
