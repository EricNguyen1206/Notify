package websocket

import (
	"net/http"
	"os"
	"strings"

	"github.com/gorilla/websocket"
)

var Upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Allow specific origins for WebSocket connections
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")

		// Define allowed origins
		allowedOrigins := []string{
			"http://localhost:3000",           // Frontend dev server
			"https://localhost:3000",          // Frontend dev server (HTTPS)
			"http://localhost",                // Nginx proxy (Docker)
			"https://localhost",               // Nginx proxy (HTTPS)
			"http://127.0.0.1:3000",           // Alternative localhost
			"http://127.0.0.1",                // Alternative localhost (Nginx)
			"https://notify-chat.netlify.app", // Production deployment
		}

		// Add custom origins from environment variable if set
		if customOrigins := os.Getenv("ALLOWED_ORIGINS"); customOrigins != "" {
			for _, customOrigin := range strings.Split(customOrigins, ",") {
				allowedOrigins = append(allowedOrigins, strings.TrimSpace(customOrigin))
			}
		}

		// Check if origin is in allowed list
		for _, allowedOrigin := range allowedOrigins {
			if origin == allowedOrigin {
				return true
			}
		}

		// For development/testing, allow any localhost variations
		if origin != "" && (strings.Contains(origin, "localhost") || strings.Contains(origin, "127.0.0.1")) {
			return true
		}

		return false
	},
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
