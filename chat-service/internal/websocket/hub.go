package websocket

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"strconv"
	"sync"
	"time"

	"chat-service/internal/models"
	"chat-service/internal/repositories/postgres"
	"chat-service/internal/services"

	"github.com/redis/go-redis/v9"
)

var (
	ErrClientDisconnected = fmt.Errorf("client disconnected")
	ErrChannelNotFound    = fmt.Errorf("channel not found")
)

type ClientMessage struct {
	Client  *Client
	Message *Message
}

type Hub struct {
	// Registered clients
	clients map[*Client]bool

	// Client lookup by user ID
	userClients map[string]map[*Client]bool

	// Channel subscriptions
	channelClients map[string]map[*Client]bool

	// Register requests from the clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Handle messages from clients
	handleMessage chan *ClientMessage

	// Redis service for PubSub
	redisService *services.RedisService

	// Chat repository for message storage
	chatRepo *postgres.ChatRepository

	// Redis PubSub connection
	pubsub *redis.PubSub

	// Context for graceful shutdown
	ctx    context.Context
	cancel context.CancelFunc

	// Mutex for thread safety
	mu sync.RWMutex

	// Connection state management
	clientRegistrationTime map[*Client]time.Time // Track when clients were registered
	cleanupTicker          *time.Ticker          // Periodic cleanup of stale connections
}

func NewHub(redisService *services.RedisService, chatRepo *postgres.ChatRepository) *Hub {
	ctx, cancel := context.WithCancel(context.Background())

	hub := &Hub{
		clients:                make(map[*Client]bool),
		userClients:            make(map[string]map[*Client]bool),
		channelClients:         make(map[string]map[*Client]bool),
		register:               make(chan *Client),
		unregister:             make(chan *Client),
		handleMessage:          make(chan *ClientMessage),
		redisService:           redisService,
		chatRepo:               chatRepo,
		ctx:                    ctx,
		cancel:                 cancel,
		clientRegistrationTime: make(map[*Client]time.Time),
		cleanupTicker:          time.NewTicker(30 * time.Second), // Cleanup every 30 seconds
	}

	return hub
}

func (h *Hub) Run() {
	// Subscribe to Redis channels
	h.subscribeToRedis()

	slog.Info("WebSocket hub started")

	for {
		select {
		case client := <-h.register:
			h.registerClient(client)

		case client := <-h.unregister:
			h.unregisterClient(client)

		case clientMsg := <-h.handleMessage:
			h.handleClientMessage(clientMsg)

		case <-h.cleanupTicker.C:
			h.cleanupStaleConnections()

		case <-h.ctx.Done():
			slog.Info("WebSocket hub shutting down")
			h.cleanupTicker.Stop()
			return
		}
	}
}

func (h *Hub) Stop() {
	h.cancel()
	if h.pubsub != nil {
		h.pubsub.Close()
	}
}

func (h *Hub) registerClient(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	// Check if client is already closed (race condition protection)
	if client.isClosed() {
		slog.Warn("Attempted to register closed client", "clientID", client.id, "userID", client.userID)
		return
	}

	slog.Info("Registering new WebSocket client", "clientID", client.id, "userID", client.userID)

	// Check for existing clients for this user
	existingClients := len(h.userClients[client.userID])
	wasUserOnline := existingClients > 0

	h.clients[client] = true
	h.clientRegistrationTime[client] = time.Now()

	// Add to user clients map
	if h.userClients[client.userID] == nil {
		h.userClients[client.userID] = make(map[*Client]bool)
	}
	h.userClients[client.userID][client] = true

	// Set user online in Redis only if this is the first client for the user
	if !wasUserOnline {
		if err := h.redisService.SetUserOnline(h.ctx, client.userID); err != nil {
			slog.Error("Failed to set user online", "userID", client.userID, "error", err)
		} else {
			slog.Debug("User set online in Redis", "userID", client.userID)
		}
	} else {
		slog.Debug("User already online, skipping Redis update", "userID", client.userID, "existingClients", existingClients)
	}

	// Send connection success message
	connMsg := NewConnectMessage(
		fmt.Sprintf("conn_%d", time.Now().UnixNano()),
		client.id,
		client.userID,
	)

	if err := client.SendMessage(connMsg); err != nil {
		slog.Error("Failed to send connection message", "clientID", client.id, "userID", client.userID, "error", err)
	}

	slog.Debug("Client registered successfully", "clientID", client.id, "userID", client.userID, "totalClients", len(h.clients))
}

func (h *Hub) unregisterClient(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if _, ok := h.clients[client]; ok {
		slog.Debug("Unregistering client", "clientID", client.id, "userID", client.userID)

		// Remove from clients map
		delete(h.clients, client)
		delete(h.clientRegistrationTime, client)

		// Handle user clients map with careful Redis state management
		shouldSetOffline := false
		if userClients, exists := h.userClients[client.userID]; exists {
			delete(userClients, client)
			remainingClients := len(userClients)

			if remainingClients == 0 {
				delete(h.userClients, client.userID)
				shouldSetOffline = true
				slog.Debug("Last client for user removed", "userID", client.userID)
			} else {
				slog.Debug("User still has active clients", "userID", client.userID, "remainingClients", remainingClients)
			}
		}

		// Remove from all channel subscriptions
		channelCount := len(client.channels)
		for channelID := range client.channels {
			h.removeClientFromChannel(client, channelID)
		}

		if channelCount > 0 {
			slog.Debug("Removed client from channels", "clientID", client.id, "userID", client.userID, "channelCount", channelCount)
		}

		// Close send channel safely
		client.closeSendChannel()

		// Set user offline in Redis only if no more clients remain
		// Do this after all cleanup to avoid race conditions
		if shouldSetOffline {
			// Add a small delay to handle rapid reconnections
			go func() {
				time.Sleep(100 * time.Millisecond)

				// Double-check that user is still offline after delay
				h.mu.RLock()
				stillOffline := len(h.userClients[client.userID]) == 0
				h.mu.RUnlock()

				if stillOffline {
					if err := h.redisService.SetUserOffline(h.ctx, client.userID); err != nil {
						slog.Error("Failed to set user offline", "userID", client.userID, "error", err)
					} else {
						slog.Debug("User set offline in Redis", "userID", client.userID)
					}
				} else {
					slog.Debug("User reconnected during cleanup, skipping offline status", "userID", client.userID)
				}
			}()
		}

		// Wait for client goroutines to finish with timeout
		go func() {
			client.waitForGoroutines(10 * time.Second)
			slog.Debug("Client cleanup completed", "clientID", client.id, "userID", client.userID)
		}()

		slog.Debug("Client unregistered successfully", "clientID", client.id, "userID", client.userID, "totalClients", len(h.clients))
	} else {
		slog.Debug("Client not found in registry", "clientID", client.id, "userID", client.userID)
	}
}

func (h *Hub) handleClientMessage(clientMsg *ClientMessage) {
	client := clientMsg.Client
	message := clientMsg.Message

	// Validate message before processing
	if err := message.Validate(); err != nil {
		slog.Error("Invalid message", "error", err, "userID", client.userID)
		client.sendError("INVALID_MESSAGE", err.Error())
		return
	}

	switch message.Type {
	case MessageTypeJoinChannel:
		h.handleJoinChannel(client, message)
	case MessageTypeLeaveChannel:
		h.handleLeaveChannel(client, message)
	case MessageTypeChannelMessage:
		h.handleChannelMessage(client, message)
	case MessageTypeTyping:
		h.handleTyping(client, message)
	case MessageTypeStopTyping:
		h.handleStopTyping(client, message)
	case MessageTypePing:
		h.handlePing(client, message)
	default:
		slog.Warn("Unknown message type", "type", message.Type)
		client.sendError("UNKNOWN_MESSAGE_TYPE", "Unknown message type")
	}
}

func (h *Hub) handleJoinChannel(client *Client, message *Message) {
	var data JoinChannelData
	if err := h.mapToStruct(message.Data, &data); err != nil {
		client.sendError("INVALID_DATA", "Invalid join channel data")
		return
	}

	// Check if user can join channel (implement permission checks here)
	canJoin, err := h.canUserJoinChannel(client.userID, data.ChannelID)
	if err != nil {
		slog.Error("Failed to check channel permissions", "error", err)
		client.sendError("PERMISSION_ERROR", "Failed to check permissions")
		return
	}

	if !canJoin {
		client.sendError("PERMISSION_DENIED", "Permission denied to join channel")
		return
	}

	// Add client to channel
	h.addClientToChannel(client, data.ChannelID)

	// Update Redis
	if err := h.redisService.JoinChannel(h.ctx, client.userID, data.ChannelID); err != nil {
		slog.Error("Failed to join channel in Redis", "error", err)
		client.sendError("JOIN_FAILED", "Failed to join channel")
		return
	}

	// Send success response
	joinResponse := NewMessage(
		fmt.Sprintf("join_%d", time.Now().UnixNano()),
		MessageTypeJoinChannel,
		client.userID,
		map[string]interface{}{
			"channel_id": data.ChannelID,
			"status":     "joined",
		},
	)
	client.SendMessage(joinResponse)
}

func (h *Hub) handleLeaveChannel(client *Client, message *Message) {
	var data LeaveChannelData
	if err := h.mapToStruct(message.Data, &data); err != nil {
		client.sendError("INVALID_DATA", "Invalid leave channel data")
		return
	}

	// Remove client from channel
	h.removeClientFromChannel(client, data.ChannelID)

	// Update Redis
	if err := h.redisService.LeaveChannel(h.ctx, client.userID, data.ChannelID); err != nil {
		slog.Error("Failed to leave channel in Redis", "error", err)
	}

	// Send success response
	leaveResponse := NewMessage(
		fmt.Sprintf("leave_%d", time.Now().UnixNano()),
		MessageTypeLeaveChannel,
		client.userID,
		map[string]interface{}{
			"channel_id": data.ChannelID,
			"status":     "left",
		},
	)
	client.SendMessage(leaveResponse)
}

func (h *Hub) handleChannelMessage(client *Client, message *Message) {
	var data models.ChatRequest
	if err := h.mapToStruct(message.Data, &data); err != nil {
		client.sendError("INVALID_DATA", "Invalid message data")
		return
	}
	slog.Info("Received channel message", "channelID", data.ChannelID, "userID", client.userID)

	// Check if client is in channel
	if !client.IsInChannel(data.ChannelID) {
		client.sendError("NOT_IN_CHANNEL", "You are not in this channel")
		return
	}

	// Check rate limit
	rateLimitKey := fmt.Sprintf("rate_limit:message:%s:%s", client.userID, data.ChannelID)
	allowed, err := h.redisService.CheckRateLimit(h.ctx, rateLimitKey, 10, time.Minute)
	if err != nil {
		slog.Error("Failed to check rate limit", "error", err)
		client.sendError("RATE_LIMIT_ERROR", "Failed to check rate limit")
		return
	}

	if !allowed {
		client.sendError("RATE_LIMITED", "Rate limit exceeded")
		return
	}

	// Convert client.userID (string) to uint
	senderIDUint, err := strconv.ParseUint(client.userID, 10, 64)
	if err != nil {
		slog.Error("Failed to convert userID to uint", "userID", client.userID, "error", err)
		client.sendError("INVALID_USER_ID", "Invalid user ID")
		return
	}

	// Convert channelID (string) to uint
	channelIDUint, err := strconv.ParseUint(data.ChannelID, 10, 64)
	if err != nil {
		slog.Error("Failed to convert channelID to uint", "channelID", data.ChannelID, "error", err)
		client.sendError("INVALID_CHANNEL_ID", "Invalid channel ID")
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
	slog.Debug("❤️ Creating chat message", "chat", chat)
	if err := h.chatRepo.Create(chat); err != nil {
		slog.Error("Failed to save chat message to DB", "userID", client.userID, "error", err)
		client.sendError("ERROR", "Failed to create chat message")
		return
	}

	// Preload sender data
	chat, err = h.chatRepo.FindByID(chat.ID)
	if err != nil {
		slog.Error("Failed to preload chat sender data", "chatID", chat.ID, "error", err)
		client.sendError("ERROR", "Failed to preload chat sender data")
		return
	}

	// Prepare message for broadcast
	broadcastMessage := NewChannelMessage(message.ID, client.userID, chat)

	// Publish to Redis for other server instances
	if err := h.redisService.PublishChannelMessage(h.ctx, data.ChannelID, broadcastMessage); err != nil {
		slog.Error("Failed to publish message to Redis", "error", err)
		client.sendError("PUBLISH_FAILED", "Failed to send message")
		return
	}
}

func (h *Hub) handleTyping(client *Client, message *Message) {
	var data TypingData
	if err := h.mapToStruct(message.Data, &data); err != nil {
		client.sendError("INVALID_DATA", "Invalid typing data")
		return
	}

	// Check if client is in channel
	if !client.IsInChannel(data.ChannelID) {
		return
	}

	// Create typing message
	typingMessage := NewMessage(
		fmt.Sprintf("typing_%d", time.Now().UnixNano()),
		MessageTypeTyping,
		client.userID,
		map[string]interface{}{
			"channel_id": data.ChannelID,
			"is_typing":  data.IsTyping,
		},
	)

	// Broadcast to channel (excluding sender)
	h.broadcastToChannelExcept(data.ChannelID, typingMessage, client)
}

func (h *Hub) handleStopTyping(client *Client, message *Message) {
	var data TypingData
	if err := h.mapToStruct(message.Data, &data); err != nil {
		client.sendError("INVALID_DATA", "Invalid typing data")
		return
	}

	// Check if client is in channel
	if !client.IsInChannel(data.ChannelID) {
		return
	}

	// Create typing message
	typingMessage := NewMessage(
		fmt.Sprintf("typing_%d", time.Now().UnixNano()),
		MessageTypeStopTyping,
		client.userID,
		map[string]interface{}{
			"channel_id": data.ChannelID,
			"is_typing":  data.IsTyping,
		},
	)

	// Broadcast to channel (excluding sender)
	h.broadcastToChannelExcept(data.ChannelID, typingMessage, client)
}

func (h *Hub) handlePing(client *Client, message *Message) {
	pongMessage := NewPongMessage(
		fmt.Sprintf("pong_%d", time.Now().UnixNano()),
		client.userID,
		message.ID,
	)
	client.SendMessage(pongMessage)
}

func (h *Hub) addClientToChannel(client *Client, channelID string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.channelClients[channelID] == nil {
		h.channelClients[channelID] = make(map[*Client]bool)
	}

	h.channelClients[channelID][client] = true
	client.AddChannel(channelID)

	slog.Debug("Client added to channel", "clientID", client.id, "channelID", channelID)
}

func (h *Hub) removeClientFromChannel(client *Client, channelID string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if channelClients, exists := h.channelClients[channelID]; exists {
		delete(channelClients, client)
		if len(channelClients) == 0 {
			delete(h.channelClients, channelID)
		}
	}

	client.RemoveChannel(channelID)

	slog.Debug("Client removed from channel", "clientID", client.id, "channelID", channelID)
}

func (h *Hub) broadcastToChannel(channelID string, message *Message) {
	h.mu.RLock()
	clients := h.channelClients[channelID]
	h.mu.RUnlock()

	for client := range clients {
		select {
		case client.send <- h.messageToBytes(message):
		default:
			h.unregisterClient(client)
		}
	}
}

func (h *Hub) broadcastToChannelExcept(channelID string, message *Message, exceptClient *Client) {
	h.mu.RLock()
	clients := h.channelClients[channelID]
	h.mu.RUnlock()

	for client := range clients {
		if client != exceptClient {
			select {
			case client.send <- h.messageToBytes(message):
			default:
				h.unregisterClient(client)
			}
		}
	}
}

func (h *Hub) broadcastToUser(userID string, message *Message) {
	h.mu.RLock()
	clients := h.userClients[userID]
	h.mu.RUnlock()

	for client := range clients {
		select {
		case client.send <- h.messageToBytes(message):
		default:
			h.unregisterClient(client)
		}
	}
}

// =============================================================================
// STEP 7: Redis PubSub Integration
// =============================================================================

func (h *Hub) subscribeToRedis() {
	// Subscribe to all channel patterns
	h.pubsub = h.redisService.PSubscribe(h.ctx, "chat:channel:*", "channel:*:events", "user:*:notifications")

	go h.handleRedisMessages()
}

func (h *Hub) handleRedisMessages() {
	ch := h.pubsub.Channel()

	for {
		select {
		case msg := <-ch:
			h.processRedisMessage(msg)
		case <-h.ctx.Done():
			return
		}
	}
}

func (h *Hub) processRedisMessage(msg *redis.Message) {
	var message Message
	if err := json.Unmarshal([]byte(msg.Payload), &message); err != nil {
		slog.Error("Failed to unmarshal Redis message", "error", err)
		return
	}

	// Determine routing based on channel pattern
	switch {
	case len(msg.Channel) > 13 && msg.Channel[:13] == "chat:channel:":
		// Channel message: chat:channel:{channel_id}
		channelID := msg.Channel[13:]
		h.broadcastToChannel(channelID, &message)

	case len(msg.Channel) > 8 && msg.Channel[:8] == "channel:":
		// Channel events: channel:{channel_id}:events
		if len(msg.Channel) > 15 && msg.Channel[len(msg.Channel)-7:] == ":events" {
			channelID := msg.Channel[8 : len(msg.Channel)-7]
			h.broadcastToChannel(channelID, &message)
		}

	case len(msg.Channel) > 5 && msg.Channel[:5] == "user:":
		// User notifications: user:{user_id}:notifications
		if len(msg.Channel) > 18 && msg.Channel[len(msg.Channel)-13:] == ":notifications" {
			userID := msg.Channel[5 : len(msg.Channel)-14]
			h.broadcastToUser(userID, &message)
		}
	}
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

func (h *Hub) canUserJoinChannel(userID, channelID string) (bool, error) {
	// Implement your channel permission logic here
	// For now, allow all users to join all channels
	// TODO: Add proper permission checks based on userID and channelID
	slog.Debug("Checking channel permissions", "userID", userID, "channelID", channelID)
	return true, nil
}

// cleanupStaleConnections removes clients that have been inactive for too long
func (h *Hub) cleanupStaleConnections() {
	h.mu.Lock()
	defer h.mu.Unlock()

	now := time.Now()
	staleThreshold := 5 * time.Minute // Consider connections stale after 5 minutes
	var staleClients []*Client

	// Find stale clients
	for client, registrationTime := range h.clientRegistrationTime {
		if now.Sub(registrationTime) > staleThreshold {
			// Check if client is actually closed or unresponsive
			if client.isClosed() {
				staleClients = append(staleClients, client)
			}
		}
	}

	// Clean up stale clients
	if len(staleClients) > 0 {
		slog.Info("Cleaning up stale connections", "count", len(staleClients))

		for _, client := range staleClients {
			// Remove from all maps
			delete(h.clients, client)
			delete(h.clientRegistrationTime, client)

			// Remove from user clients map
			if userClients, exists := h.userClients[client.userID]; exists {
				delete(userClients, client)
				if len(userClients) == 0 {
					delete(h.userClients, client.userID)
				}
			}

			// Remove from channel subscriptions
			for channelID := range client.channels {
				if channelClients, exists := h.channelClients[channelID]; exists {
					delete(channelClients, client)
					if len(channelClients) == 0 {
						delete(h.channelClients, channelID)
					}
				}
			}

			slog.Debug("Cleaned up stale client", "clientID", client.id, "userID", client.userID)
		}
	}

	// Log connection statistics
	totalClients := len(h.clients)
	totalUsers := len(h.userClients)
	totalChannels := len(h.channelClients)

	if totalClients > 0 {
		slog.Debug("Connection statistics",
			"totalClients", totalClients,
			"totalUsers", totalUsers,
			"totalChannels", totalChannels)
	}
}
