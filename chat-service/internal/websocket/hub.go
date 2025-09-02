package websocket

import (
	"chat-service/internal/models"
	"chat-service/internal/repositories/postgres"
	"chat-service/internal/services"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"strconv"
	"sync"

	"github.com/google/uuid"
)

var (
	ErrClientDisconnected = fmt.Errorf("client disconnected")
	ErrChannelNotFound    = fmt.Errorf("channel not found")
	ErrClientNotFound     = fmt.Errorf("client not found")
)

type ClientMessage struct {
	Client  *Client
	Message *Message
}

type Hub struct {
	channels map[string]map[string]*Client // channelID -> userID -> client
	clients  map[string]*Client            // userID -> client

	// Chat repository for message storage
	chatRepo *postgres.ChatRepository

	// Message broadcasting
	register   chan *Client
	unregister chan *Client
	broadcast  chan []byte

	// Context for graceful shutdown
	ctx    context.Context
	cancel context.CancelFunc

	// Mutex for thread safety
	mu sync.RWMutex
}

func NewHub(redisService *services.RedisService, chatRepo *postgres.ChatRepository) *Hub {
	ctx, cancel := context.WithCancel(context.Background())

	hub := &Hub{
		channels:   make(map[string]map[string]*Client),
		clients:    make(map[string]*Client),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan []byte),
		chatRepo:   chatRepo,
		ctx:        ctx,
		cancel:     cancel,
	}

	return hub
}

func (h *Hub) Run() {
	for {
		select {
		case c := <-h.register:
			h.mu.Lock()
			// Check if client already exists and clean up if necessary
			if existingClient, exists := h.clients[c.userID]; exists {
				slog.Warn("Client already exists, cleaning up old connection", "userID", c.userID)
				// Clean up existing client
				existingClient.cancel()
				close(existingClient.send)
			}

			// Register new client
			h.clients[c.userID] = c

			// Send connection confirmation
			connectMsg := NewConnectMessage(uuid.New().String(), c.conn.RemoteAddr().String(), c.userID)
			c.send <- h.messageToBytes(connectMsg)
			h.mu.Unlock()

			slog.Info("Client registered successfully", "userID", c.userID, "remoteAddr", c.conn.RemoteAddr().String())

		case c := <-h.unregister:
			h.mu.Lock()
			// Check if this is the current client (not an old one)
			if currentClient, exists := h.clients[c.userID]; exists && currentClient == c {
				// Remove client from all channels
				for channelID, clients := range h.channels {
					if _, exists := clients[c.userID]; exists {
						delete(clients, c.userID)
						// Notify other clients in the channel
						h.notifyChannelMembers(channelID, c.userID, "left")

						// Clean up empty channels
						if len(clients) == 0 {
							delete(h.channels, channelID)
						}
					}
				}
				delete(h.clients, c.userID)
				slog.Info("Client unregistered", "userID", c.userID)
			} else {
				slog.Debug("Ignoring unregister for old client", "userID", c.userID)
			}
			h.mu.Unlock()

		case messageBytes := <-h.broadcast:
			h.handleClientMessage(messageBytes)

		case <-h.ctx.Done():
			slog.Info("WebSocket hub shutting down...")
			return
		}
	}
}

func (h *Hub) Stop() {
	h.cancel()
}

func (h *Hub) JoinChannel(userID string, channelID string) error {
	h.mu.Lock()
	defer h.mu.Unlock()

	// Get or create channel
	if h.channels[channelID] == nil {
		h.channels[channelID] = make(map[string]*Client)
	}

	// Get client
	client, exists := h.clients[userID]
	if !exists {
		return ErrClientNotFound
	}

	// Add user to channel
	h.channels[channelID][userID] = client

	// Notify other clients in the channel
	h.notifyChannelMembers(channelID, userID, "joined")

	slog.Info("User joined channel", "userID", userID, "channelID", channelID)
	return nil
}

func (h *Hub) LeaveChannel(userID string, channelID string) error {
	h.mu.Lock()
	defer h.mu.Unlock()

	if clients, ok := h.channels[channelID]; ok {
		if _, exists := clients[userID]; exists {
			delete(clients, userID)

			// Notify other clients in the channel
			h.notifyChannelMembers(channelID, userID, "left")

			// Clean up empty channels
			if len(clients) == 0 {
				delete(h.channels, channelID)
			}

			slog.Info("User left channel", "userID", userID, "channelID", channelID)
			return nil
		}
	}

	return ErrChannelNotFound
}

func (h *Hub) notifyChannelMembers(channelID, userID, action string) {
	clients := h.channels[channelID]
	if clients == nil {
		return
	}

	messageType := MessageTypeJoinChannel
	if action == "left" {
		messageType = MessageTypeLeaveChannel
	}

	notification := NewMessage(uuid.New().String(), messageType, userID, map[string]interface{}{
		"channel_id": channelID,
		"user_id":    userID,
		"action":     action,
	})

	// Broadcast to all clients in the channel except the one who triggered the action
	for clientUserID, client := range clients {
		if clientUserID != userID {
			select {
			case client.send <- h.messageToBytes(notification):
			default:
				slog.Warn("Failed to send notification to client", "userID", clientUserID)
			}
		}
	}
}

func (h *Hub) broadcastToChannel(channelID string, message *Message) {
	h.mu.RLock()
	clients := h.channels[channelID]
	h.mu.RUnlock()

	if clients == nil {
		return
	}

	messageBytes := h.messageToBytes(message)
	for userID, client := range clients {
		select {
		case client.send <- messageBytes:
		default:
			slog.Warn("Failed to send message to client", "userID", userID, "channelID", channelID)
		}
	}
}

func (h *Hub) handleClientMessage(msgByte []byte) {
	message := &Message{}
	if err := json.Unmarshal(msgByte, message); err != nil {
		slog.Error("Failed to unmarshal message", "error", err)
		return
	}

	// Validate message before processing
	if err := message.Validate(); err != nil {
		slog.Error("Invalid message received", "error", err, "message", message)
		return
	}

	// Get client
	h.mu.RLock()
	client, exists := h.clients[message.UserID]
	h.mu.RUnlock()

	if !exists {
		slog.Warn("Client not found for userID", "userID", message.UserID)
		return
	}

	switch message.Type {
	case MessageTypeJoinChannel:
		h.handleJoinChannel(client, message)
	case MessageTypeLeaveChannel:
		h.handleLeaveChannel(client, message)
	case MessageTypeChannelMessage:
		h.handleChannelMessage(client, message)
	default:
		errMsg := NewErrorMessage(uuid.New().String(), client.userID, "UNKNOWN_MESSAGE_TYPE", "Unknown message type")
		client.send <- h.messageToBytes(errMsg)
	}
}

func (h *Hub) handleJoinChannel(client *Client, message *Message) {
	var data ChannelJoinLeaveData
	if err := h.mapToStruct(message.Data, &data); err != nil {
		client.send <- h.messageToBytes(NewErrorMessage(message.ID, client.userID, "INVALID_DATA", "Invalid join channel data"))
		return
	}

	if err := h.JoinChannel(client.userID, data.ChannelID); err != nil {
		client.send <- h.messageToBytes(NewErrorMessage(message.ID, client.userID, "JOIN_FAILED", err.Error()))
		return
	}

	// Send success confirmation
	successMsg := NewJoinChannelMessage(uuid.New().String(), client.userID, data.ChannelID)
	client.send <- h.messageToBytes(successMsg)
}

func (h *Hub) handleLeaveChannel(client *Client, message *Message) {
	var data ChannelJoinLeaveData
	slog.Info("TEST Handle Leave Channel", "message", message)
	slog.Info("TEST Hub Channels", "channels", h.channels)
	if err := h.mapToStruct(message.Data, &data); err != nil {
		client.send <- h.messageToBytes(NewErrorMessage(message.ID, client.userID, "INVALID_DATA", "Invalid leave channel data"))
		return
	}

	if err := h.LeaveChannel(client.userID, data.ChannelID); err != nil {
		client.send <- h.messageToBytes(NewErrorMessage(message.ID, client.userID, "LEAVE_FAILED", err.Error()))
		return
	}

	// Send success confirmation
	successMsg := NewLeaveChannelMessage(uuid.New().String(), client.userID, data.ChannelID)
	client.send <- h.messageToBytes(successMsg)
}

func (h *Hub) handleChannelMessage(client *Client, message *Message) {
	var data ChannelMessageData
	if err := h.mapToStruct(message.Data, &data); err != nil {
		client.send <- h.messageToBytes(NewErrorMessage(message.ID, client.userID, "INVALID_DATA", "Invalid message data"))
		return
	}

	// Check if client is in channel
	h.mu.RLock()
	channelClients := h.channels[data.ChannelID]
	_, inChannel := channelClients[client.userID]
	h.mu.RUnlock()

	if !inChannel {
		client.send <- h.messageToBytes(NewErrorMessage(message.ID, client.userID, "NOT_IN_CHANNEL", "You are not in this channel"))
		return
	}

	// Convert client.userID (string) to uint
	senderIDUint, err := strconv.ParseUint(client.userID, 10, 64)
	if err != nil {
		client.send <- h.messageToBytes(NewErrorMessage(message.ID, client.userID, "INVALID_USER_ID", "Invalid user ID format"))
		return
	}

	// Convert channelID (string) to uint
	channelIDUint, err := strconv.ParseUint(data.ChannelID, 10, 64)
	if err != nil {
		client.send <- h.messageToBytes(NewErrorMessage(message.ID, client.userID, "INVALID_CHANNEL_ID", "Invalid channel ID format"))
		return
	}

	// Save message to database
	chat := &models.Chat{
		SenderID:  uint(senderIDUint),
		ChannelID: uint(channelIDUint),
		Text:      data.Text,
		URL:       data.URL,
		FileName:  data.FileName,
	}

	if err := h.chatRepo.Create(chat); err != nil {
		slog.Error("Failed to save message to database", "error", err, "userID", client.userID, "channelID", data.ChannelID)
		client.send <- h.messageToBytes(NewErrorMessage(message.ID, client.userID, "SAVE_FAILED", "Failed to save message"))
		return
	}

	// Preload sender data
	chat, err = h.chatRepo.FindByID(chat.ID)
	if err != nil {
		slog.Error("Failed to load chat data", "error", err, "chatID", chat.ID)
		// Continue anyway, we can still broadcast the message
	}

	// Prepare message for broadcast
	broadcastMessage := NewChannelMessage(message.ID, client.userID, chat)

	// Broadcast to all clients in the channel
	h.broadcastToChannel(data.ChannelID, broadcastMessage)
}

// =============================================================================
// Helper Functions
// =============================================================================

func (h *Hub) messageToBytes(message *Message) []byte {
	data, err := json.Marshal(message)
	if err != nil {
		slog.Error("Failed to marshal message", "error", err)
		return nil
	}
	return data
}

func (h *Hub) mapToStruct(data map[string]interface{}, dest interface{}) error {
	jsonBytes, err := json.Marshal(data)
	if err != nil {
		return err
	}
	return json.Unmarshal(jsonBytes, dest)
}
