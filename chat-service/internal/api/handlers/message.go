package handlers

import (
	"net/http"
	"strconv"

	"chat-service/internal/models"
	"chat-service/internal/repositories/postgres"
	"chat-service/internal/services"
	"chat-service/internal/websocket"

	"github.com/gin-gonic/gin"
)

type ChatHandler struct {
	channelService *services.ChannelService
	userService    *services.UserService
	chatRepo       *postgres.ChatRepository
	hub            *websocket.Hub
}

func NewChatHandler(chanSvc *services.ChannelService, usrSvc *services.UserService, chatRepo *postgres.ChatRepository, hub *websocket.Hub) *ChatHandler {
	return &ChatHandler{channelService: chanSvc, userService: usrSvc, chatRepo: chatRepo, hub: hub}
}

// GetChannelMessages godoc
// @Summary Get chat messages in a channel
// @Description Get all chat messages for a specific channel (paginated)
// @Tags chats
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Channel ID"
// @Param limit query int false "Page size"
// @Param before query int false "Cursor for infinite scroll (timestamp)"
// @Success 200 {object} models.PaginatedChatResponse "Paginated chat messages"
// @Failure 401 {object} models.ErrorResponse "Unauthorized - invalid or missing token"
// @Failure 404 {object} models.ErrorResponse "Channel not found"
// @Failure 500 {object} models.ErrorResponse "Internal server error"
// @OperationId getChannelMessages
// @Router /messages/channel/{id} [get]
func (h *ChatHandler) GetChannelMessages(c *gin.Context) {
	channelID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid channel ID"})
		return
	}

	// Parse pagination params
	limit := 20
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}
	var before *int64
	if b := c.Query("before"); b != "" {
		if parsed, err := strconv.ParseInt(b, 10, 64); err == nil {
			before = &parsed
		}
	}

	messages, err := h.channelService.GetChatMessagesByChannelWithPagination(uint(channelID), limit, before)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: "Failed to get messages",
			Details: err.Error(),
		})
		return
	}
	responses := make([]models.ChatResponse, 0, len(messages))
	var nextCursor *int64
	for _, m := range messages {
		channelIDPtr := uint(channelID)
		responses = append(responses, models.ChatResponse{
			ID:           m.ID,
			Type:         string(models.ChatTypeChannel), // Set type for channel messages
			SenderID:     m.SenderID,
			SenderName:   m.SenderName,
			SenderAvatar: m.SenderAvatar,
			Text:         m.Text,
			URL:          m.URL,
			FileName:     m.FileName,
			CreatedAt:    m.CreatedAt,
			ChannelID:    &channelIDPtr, // Set channel ID pointer
		})
		unixTime := m.CreatedAt.Unix()
		nextCursor = &unixTime // last message timestamp for infinite scroll
	}
	paginated := models.PaginatedChatResponse{
		Items:      responses,
		Total:      len(responses),
		NextCursor: nextCursor,
	}
	c.JSON(http.StatusOK, paginated)
}
