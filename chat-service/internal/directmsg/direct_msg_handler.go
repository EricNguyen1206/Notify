package directmsg

import (
	"chat-service/internal/ws"
	"net/http"

	"github.com/gin-gonic/gin"
)

type sendMsgRequest struct {
	SenderID   uint   `json:"sender_id" binding:"required"`
	ReceiverID uint   `json:"receiver_id" binding:"required"`
	Content    string `json:"content"`
	ImageURL   string `json:"image_url"`
}

// Dùng cho HTTP API (không phải WebSocket)
func SendDirectMessage(svc DirectMsgService, hub *ws.Hub) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req sendMsgRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		msg := &DirectMessageModel{
			SenderID:   req.SenderID,
			ReceiverID: req.ReceiverID,
			Content:    req.Content,
		}
		if req.ImageURL != "" {
			msg.ImageURL = &req.ImageURL
		}

		if err := svc.SendMessage(msg); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not save message"})
			return
		}

		// Gửi real-time nếu receiver đang online
		hub.Broadcast <- ws.MessagePayload{
			SenderID:   req.SenderID,
			ReceiverID: req.ReceiverID,
			Content:    req.Content,
			ImageURL:   req.ImageURL,
		}

		c.JSON(http.StatusOK, gin.H{"status": "sent"})
	}
}
