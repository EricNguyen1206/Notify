package utils

import (
	"errors"

	"github.com/gin-gonic/gin"
)

func GetUserID(c *gin.Context) (uint, error) {
	userIDToken, exists := c.Get("user_id")
	if !exists {
		return 0, errors.New("user_id not found in context")
	}
	userID, ok := userIDToken.(uint)
	if !ok {
		return 0, errors.New("user_id in context is not uint")
	}
	return userID, nil
}
