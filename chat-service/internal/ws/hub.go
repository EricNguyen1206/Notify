package ws

type Hub struct {
	Clients    map[uint]*Client
	Register   chan *Client
	Unregister chan *Client
	Broadcast  chan MessagePayload
}

type MessagePayload struct {
	SenderID   uint   `json:"sender_id"`
	ReceiverID uint   `json:"receiver_id"`
	Content    string `json:"content"`
	ImageURL   string `json:"image_url,omitempty"`
}

func NewHub() *Hub {
	return &Hub{
		Clients:    make(map[uint]*Client),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Broadcast:  make(chan MessagePayload),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.Clients[client.UserID] = client

		case client := <-h.Unregister:
			delete(h.Clients, client.UserID)
			close(client.Send)

		case msg := <-h.Broadcast:
			if receiver, ok := h.Clients[msg.ReceiverID]; ok {
				receiver.Send <- msg
			}
		}
	}
}
