package ws

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var Upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		log.Printf("Checking origin for WebSocket connection: %s", r.Header.Get("Origin"))
		return true // Allow all origins (should whitelist in production)
	},
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Add these to ensure proper handshake
	EnableCompression: true,
	HandshakeTimeout:  10,
}

// Add these constants for WebSocket message types
const (
	// TextMessage denotes a text data message
	TextMessage = websocket.TextMessage
	// BinaryMessage denotes a binary data message
	BinaryMessage = websocket.BinaryMessage
	// CloseMessage denotes a close control message
	CloseMessage = websocket.CloseMessage
	// PingMessage denotes a ping control message
	PingMessage = websocket.PingMessage
	// PongMessage denotes a pong control message
	PongMessage = websocket.PongMessage
)
