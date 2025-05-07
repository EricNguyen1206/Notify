package chat

import (
	"net/http"

	"chat-service/internal/ws"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Configure this based on your needs
	},
}

type ChatHandler struct {
	chatService ChatService
	hub         *ws.Hub
}

func NewChatHandler(chatService ChatService) *ChatHandler {
	hub := ws.NewHub()
	go hub.Run()
	return &ChatHandler{
		chatService: chatService,
		hub:         hub,
	}
}

func (h *ChatHandler) CreateChat(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req CreateChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	chat, err := h.chatService.CreateChat(c.Request.Context(), userID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Broadcast the message
	message := &ChatMessage{
		ID:        chat.ID,
		UserID:    chat.UserID,
		Type:      chat.Type,
		Provider:  chat.Provider,
		FriendID:  chat.FriendID,
		ServerID:  chat.ServerID,
		ChannelID: chat.ChannelID,
		Text:      chat.Text,
		URL:       chat.URL,
		FileName:  chat.FileName,
	}
	h.chatService.BroadcastMessage(h.hub, message)

	c.JSON(http.StatusCreated, chat)
}

func (h *ChatHandler) GetChat(c *gin.Context) {
	id := c.Param("id")
	chat, err := h.chatService.GetChat(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, chat)
}

func (h *ChatHandler) GetUserChats(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	chats, err := h.chatService.GetUserChats(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, chats)
}

func (h *ChatHandler) GetServerChats(c *gin.Context) {
	serverID := c.Param("serverId")
	chats, err := h.chatService.GetServerChats(c.Request.Context(), serverID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, chats)
}

func (h *ChatHandler) GetChannelChats(c *gin.Context) {
	channelID := c.Param("channelId")
	chats, err := h.chatService.GetChannelChats(c.Request.Context(), channelID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, chats)
}

func (h *ChatHandler) GetFriendChats(c *gin.Context) {
	friendID := c.Param("friendId")
	chats, err := h.chatService.GetFriendChats(c.Request.Context(), friendID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, chats)
}

func (h *ChatHandler) DeleteChat(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	id := c.Param("id")
	if err := h.chatService.DeleteChat(c.Request.Context(), id, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *ChatHandler) WebSocket(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	serverID := c.Query("serverId")

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	client := &ws.Client{
		Hub:      h.hub,
		Conn:     conn,
		Send:     make(chan []byte, 256),
		UserID:   userID,
		ServerID: serverID,
	}

	client.Hub.Register <- client

	go client.WritePump()
	go client.ReadPump()
}

func (h *ChatHandler) RegisterRoutes(r *gin.RouterGroup) {
	chats := r.Group("/chats")
	{
		chats.POST("", h.CreateChat)
		chats.GET("/:id", h.GetChat)
		chats.GET("/user", h.GetUserChats)
		chats.GET("/server/:serverId", h.GetServerChats)
		chats.GET("/channel/:channelId", h.GetChannelChats)
		chats.GET("/friend/:friendId", h.GetFriendChats)
		chats.DELETE("/:id", h.DeleteChat)
		chats.GET("/ws", h.WebSocket)
	}
}
