package ws

import (
	"github.com/gorilla/websocket"
)

type Client struct {
	UserID uint
	Conn   *websocket.Conn
	Send   chan MessagePayload
}

func (c *Client) ReadPump(hub *Hub) {
	defer func() {
		hub.Unregister <- c
		c.Conn.Close()
	}()

	for {
		var msg MessagePayload
		err := c.Conn.ReadJSON(&msg)
		if err != nil {
			break
		}
		msg.SenderID = c.UserID
		hub.Broadcast <- msg
	}
}

func (c *Client) WritePump() {
	for msg := range c.Send {
		c.Conn.WriteJSON(msg)
	}
}
