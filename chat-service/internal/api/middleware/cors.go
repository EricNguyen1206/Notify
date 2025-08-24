package middleware

import (
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

// CORS middleware for handling cross-origin requests
func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		// Define allowed origins
		allowedOrigins := []string{
			"http://localhost:3000",
			"https://localhost:3000",
			"https://notify-chat.netlify.app",
			"http://127.0.0.1:3000",
		}
		// Add custom origins from environment variable if set
		if customOrigins := os.Getenv("ALLOWED_ORIGINS"); customOrigins != "" {
			for _, customOrigin := range strings.Split(customOrigins, ",") {
				allowedOrigins = append(allowedOrigins, strings.TrimSpace(customOrigin))
			}
		}

		// Check if origin is allowed
		isAllowed := false
		for _, allowedOrigin := range allowedOrigins {
			if origin == allowedOrigin {
				isAllowed = true
				break
			}
		}

		// Set CORS headers if origin is allowed
		if isAllowed {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		} else {
			// For development/testing, still allow localhost variations
			if origin != "" && (strings.Contains(origin, "localhost") || strings.Contains(origin, "127.0.0.1")) {
				c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			}
		}

		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Max-Age", "24h")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
