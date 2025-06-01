package ws

import (
	"sync"
)

type Channel struct {
	ID      string             `json:"id"`
	Name    string             `json:"name"`
	Clients map[string]*Client `json:"clients"`
}

type Hub struct {
	Channels   map[string]*Channel
	Broadcast  chan *Message
	Register   chan *Client
	Unregister chan *Client
	mu         sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		Channels:   make(map[string]*Channel),
		Broadcast:  make(chan *Message, 5),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			if _, ok := h.Channels[client.ChannelID]; ok { // Check channel of client exist
				r := h.Channels[client.ChannelID]

				if _, ok := r.Clients[client.ID]; !ok {
					r.Clients[client.ID] = client
				}
			}
			h.mu.Unlock()

		case client := <-h.Unregister:
			h.mu.Lock()
			if _, ok := h.Channels[client.ChannelID]; ok {
				if _, ok := h.Channels[client.ChannelID].Clients[client.ID]; !ok {
					// Broascast a message saying that user left the room
					if len(h.Channels[client.ChannelID].Clients) != 0 {
						h.Broadcast <- &Message{
							Content:   "user left the channel",
							ChannelID: client.ChannelID,
							Username:  client.Username,
						}
					}

					delete(h.Channels, client.ChannelID)
					close(client.Message)
				}
			}
			h.mu.Unlock()

		case message := <-h.Broadcast:
			h.mu.RLock()
			if _, ok := h.Channels[message.ChannelID]; ok {
				for _, cl := range h.Channels[message.ChannelID].Clients {
					cl.Message <- message
				}
			}
			h.mu.RUnlock()
		}
	}
}
