package ws

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type WsHandler struct {
	hub *Hub
}

func NewWsHandler(h *Hub) *WsHandler {
	return &WsHandler{
		hub: h,
	}
}

type CreateChannelReq struct {
	ID   string `json:id`
	Name string `json:name`
}

func (h *WsHandler) CreateChannel(c *gin.Context) {
	var req CreateChannelReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	h.hub.Channels[req.ID] = &Channel{
		ID:      req.ID,
		Name:    req.Name,
		Clients: make(map[string]*Client),
	}

	c.JSON(http.StatusOK, req)
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func (h *WsHandler) JoinChannel(c *gin.Context) {
	// Check err
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	channelId := c.Param("channelId")
	clientId := c.Query("clientId")
	username := c.Query("username")

	// Create client
	cl := &Client{
		Conn:      conn,
		Message:   make(chan *Message, 10),
		ID:        clientId,
		ChannelID: channelId,
		Username:  username,
	}

	// Create message announce join channel
	m := &Message{
		Content:   "New user has join the channel",
		ChannelID: channelId,
		Username:  username,
	}

	// Register client
	h.hub.Register <- cl
	// Broascast message announce
	h.hub.Broadcast <- m

	// Create routine read
	go cl.WriteMessage()
	// Create routine write
	cl.ReadMessage(h.hub)
}

type GetChannelRes struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

func (h *WsHandler) GetChannels(c *gin.Context) {
	channels := make([]GetChannelRes, 0)
	for _, cn := range h.hub.Channels {
		channels = append(channels, GetChannelRes{
			ID:   cn.ID,
			Name: cn.Name,
		})
	}
	c.JSON(http.StatusOK, channels)
}

type GetClientRes struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

func (h *WsHandler) GetClients(c *gin.Context) {
	channelId := c.Param("channelId")
	var clients []GetClientRes

	if _, ok := h.hub.Channels[channelId]; !ok {
		clients = make([]GetClientRes, 0)
		c.JSON(http.StatusOK, clients)
	}

	for _, cl := range h.hub.Channels[channelId].Clients {
		clients = append(clients, GetClientRes{
			ID:   cl.ID,
			Name: cl.Username,
		})
	}
	c.JSON(http.StatusOK, clients)
}

func (h *WsHandler) RegisterRoutes(r *gin.Engine) {
	route := r.Group("/ws")
	{
		route.POST("/createChannel", h.CreateChannel)
		route.GET("/joinChannel/:channelId", h.JoinChannel)
		route.GET("/getChannels", h.GetChannels)
		route.GET("/getClients/:channelId", h.GetClients)
	}
}
