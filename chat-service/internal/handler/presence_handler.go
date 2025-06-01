package handler

import (
	"chat-service/configs/utils/ws"
	"chat-service/internal/service"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type PresenceHandler struct {
	presenceService *service.PresenceService
	friendService   *service.FriendService
	hub             *ws.Hub // Giữ kết nối WebSocket (xem phần 2.3)
}

func NewPresenceHandler(
	presenceService *service.PresenceService,
	friendService *service.FriendService,
	hub *ws.Hub,
) *PresenceHandler {
	return &PresenceHandler{
		presenceService: presenceService,
		friendService:   friendService,
		hub:             hub,
	}
}

// HandleConnection - Xử lý WebSocket connection
func (h *PresenceHandler) HandleConnection(c *gin.Context) {
	ws, err := ws.Upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}
	defer ws.Close()

	userID := c.MustGet("userID").(string)

	// 1. Đánh dấu online
	if err := h.presenceService.SetOnline(userID); err != nil {
		log.Printf("SetOnline failed: %v", err)
		return
	}
	defer h.presenceService.SetOffline(userID) // Luôn đánh dấu offline khi disconnect
	userIDUint, err := strconv.ParseUint(userID, 10, 32)
	if err != nil {
		log.Printf("TEST Invalid user ID type in context: %T", userID)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "invalid user ID type",
			"details": "user_id in context is not of type uint",
		})
		return
	}
	// 2. Lấy danh sách bạn bè online
	friends, _ := h.friendService.GetFriends(uint(userIDUint))
	friendIDs := make([]uint, len(friends))
	for i, f := range friends {
		friendIDs[i] = f.FriendID
	}

	onlineFriends, _ := h.presenceService.GetOnlineFriends(friendIDs)
	ws.WriteJSON(gin.H{"onlineFriends": onlineFriends})

	// 3. Thêm kết nối vào hub để broadcast
	h.hub.Register(userID, ws)
	defer h.hub.Unregister(userID)

	// 4. Giữ kết nối (heartbeat)
	for {
		if _, _, err := ws.ReadMessage(); err != nil {
			break
		}
	}
}
