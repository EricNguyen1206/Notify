package ws

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func ServeWs(hub *Hub) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := strconv.Atoi(c.Query("user_id"))

		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			return
		}

		client := &Client{
			UserID: uint(userID),
			Conn:   conn,
			Send:   make(chan MessagePayload),
		}

		hub.Register <- client
		go client.ReadPump(hub)
		go client.WritePump()
	}
}
