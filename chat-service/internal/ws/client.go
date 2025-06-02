package ws

import (
	"fmt"

	"github.com/gorilla/websocket"
)

type Message struct {
	Content   string `json:"content"`
	ChannelID string `json:"channelId"`
	Username  string `json:"username"`
}

type Client struct {
	Conn      *websocket.Conn
	Message   chan *Message
	ID        string `json:"id"`
	ChannelID string `json:"channelId"`
	Username  string `json:"username"`
}

func (c *Client) ReadMessage(hub *Hub) {
	defer func() {
		hub.Unregister <- c
		c.Conn.Close()
	}()

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				fmt.Printf("error: %v", err)
			}

			break
		}

		msg := &Message{
			Content:   string(message),
			ChannelID: c.ChannelID,
			Username:  c.Username,
		}
		hub.Broadcast <- msg
	}
}

func (c *Client) WriteMessage() {
	defer func() {
		c.Conn.Close()
	}()

	for {
		message, ok := <-c.Message
		if !ok {
			return
		}

		c.Conn.WriteJSON(message)
	}
}
