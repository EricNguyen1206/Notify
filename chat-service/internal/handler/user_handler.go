package handler

import (
	"chat-service/configs/middleware"
	"chat-service/internal/models"
	"chat-service/internal/service"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

type UserHandler struct {
	userService service.UserService
	redisClient *redis.Client
}

func NewUserHandler(userService service.UserService, redisClient *redis.Client) *UserHandler {
	return &UserHandler{userService: userService, redisClient: redisClient}
}

func (h *UserHandler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.userService.Register(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, user)
}

func (h *UserHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	token, err := h.userService.Login(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token})
}

func (h *UserHandler) GetProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	log.Printf("TEST user ID: ", userID)
	getError := c.GetString("error")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": getError})
		return
	}
	userIDUint, ok := userID.(uint)
	if !ok {
		log.Printf("TEST Invalid user ID type in context: %T", userID)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "invalid user ID type",
			"details": "user_id in context is not of type uint",
		})
		return
	}
	profile, err := h.userService.GetProfile(c.Request.Context(), userIDUint)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, profile)
}

// Register routes
func (h *UserHandler) RegisterRoutes(r *gin.RouterGroup) {
	auth := r.Group("/auth")
	{
		auth.POST("/register", h.Register)
		auth.POST("/login", h.Login)
	}
	user := r.Group("/users")
	{
		// Protected routes
		user.Use(middleware.Auth())
		user.GET("/profile", h.GetProfile)
		// WebSocket
		// user.POST("/friends", h.SendFriendRequest)
		// user.GET("/friends", h.GetFriends)
		// user.GET("/friends/pending", h.GetPendingFriends)
		// user.POST("/friends/accept/:id", h.AcceptFriendRequest)
		// user.POST("/friends/reject/:id", h.RejectFriendRequest)
	}
}
