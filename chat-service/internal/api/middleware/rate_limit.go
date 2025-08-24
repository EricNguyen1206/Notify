package middleware

import (
	"fmt"
	"net/http"
	"time"

	"chat-service/internal/services"

	"github.com/gin-gonic/gin"
)

type RateLimitMiddleware struct {
	redisService *services.RedisService
}

func NewRateLimitMiddleware(redisService *services.RedisService) *RateLimitMiddleware {
	return &RateLimitMiddleware{
		redisService: redisService,
	}
}

// RateLimit creates a rate limiting middleware
func (rm *RateLimitMiddleware) RateLimit(requests int, window time.Duration) gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		// Get user ID from context (set by auth middleware)
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		// Create rate limit key
		endpoint := c.Request.URL.Path
		key := fmt.Sprintf("rate_limit:%s:%s", userID, endpoint)

		// Check rate limit
		allowed, err := rm.redisService.CheckRateLimit(c.Request.Context(), key, requests, window)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Rate limit check failed"})
			c.Abort()
			return
		}

		if !allowed {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":   "Rate limit exceeded",
				"message": fmt.Sprintf("Too many requests. Limit: %d per %v", requests, window),
			})
			c.Abort()
			return
		}

		c.Next()
	})
}

// WebSocketRateLimit for WebSocket specific rate limiting
func (rm *RateLimitMiddleware) WebSocketRateLimit(requests int, window time.Duration) gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		key := fmt.Sprintf("rate_limit:websocket:%s", userID)
		allowed, err := rm.redisService.CheckRateLimit(c.Request.Context(), key, requests, window)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Rate limit check failed"})
			c.Abort()
			return
		}

		if !allowed {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "WebSocket connection rate limit exceeded",
			})
			c.Abort()
			return
		}

	c.Next()
	})
}

// RateLimitIP creates a rate limiting middleware for public routes based on IP address
func (rm *RateLimitMiddleware) RateLimitIP(requests int, window time.Duration) gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		// Use client IP for the rate limit key
		clientIP := c.ClientIP()
		endpoint := c.Request.URL.Path
		key := fmt.Sprintf("rate_limit_ip:%s:%s", clientIP, endpoint)

		allowed, err := rm.redisService.CheckRateLimit(c.Request.Context(), key, requests, window)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Rate limit check failed"})
			c.Abort()
			return
		}

		if !allowed {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":   "Rate limit exceeded",
				"message": fmt.Sprintf("Too many requests. Limit: %d per %v", requests, window),
			})
			c.Abort()
			return
		}

		c.Next()
	})
}
