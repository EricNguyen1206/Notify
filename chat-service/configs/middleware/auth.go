package middleware

import (
	"chat-service/configs"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func Auth() gin.HandlerFunc {
	jwtSecret := configs.Load().App.JWTSecret
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Set("error", "authorization header is required")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "authorization header is required"})
			c.Abort()
			return
		}

		tokenString := strings.Replace(authHeader, "Bearer ", "", 1)
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(jwtSecret), nil // Use environment variable in production
		})

		if err != nil || !token.Valid {
			c.Set("error", "invalid token: ")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token: " + jwtSecret})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			log.Println("Invalid token claims")
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "invalid token claims",
				"details": "Unable to parse token claims",
			})
			c.Abort()
			return
		}

		userID, ok := claims["user_id"].(float64)
		if !ok {
			log.Printf("TEST Invalid user ID in token, claims: %v", claims)
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "invalid user ID in token",
				"details": "user_id claim must be a number",
			})
			c.Abort()
			return
		}

		// Set user_id vào context
		log.Printf("TEST Successfully authenticated user ID: %d", uint(userID))
		c.Set("user_id", uint(userID))
		c.Set("email", claims["email"])
		c.Next()
	}
}
