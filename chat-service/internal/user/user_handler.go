// internal/domain/user/handler/user_handler.go
package user

import (
	"chat-service/internal/middleware"
	"net/http"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	userService UserService
}

func NewUserHandler(userService UserService) *UserHandler {
	return &UserHandler{userService: userService}
}

func (h *UserHandler) Register(c *gin.Context) {
	var req RegisterRequest
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
	var req LoginRequest
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

// func (h *UserHandler) GetProfile(c *gin.Context) {
// 	userID := c.GetString("userID")
// 	if userID == "" {
// 		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
// 		return
// 	}

// 	profile, err := h.userService.repo.GetProfile(c.Request.Context(), userID)
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
// 		return
// 	}

// 	c.JSON(http.StatusOK, profile)
// }

func (h *UserHandler) SendFriendRequest(c *gin.Context) {
	userEmail := c.GetString("userEmail")
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req FriendRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.userService.SendFriendRequest(c.Request.Context(), userEmail, &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "friend request sent"})
}

// Register routes
func (h *UserHandler) RegisterRoutes(r *gin.RouterGroup) {
	user := r.Group("/users")
	{
		user.POST("/register", h.Register)
		user.POST("/login", h.Login)

		// Protected routes
		user.Use(middleware.Auth())
		// user.GET("/profile", h.GetProfile)
		user.POST("/friends", h.SendFriendRequest)
		// user.GET("/friends", h.GetFriends)
		// user.GET("/friends/pending", h.GetPendingFriends)
		// user.POST("/friends/accept/:id", h.AcceptFriendRequest)
		// user.POST("/friends/reject/:id", h.RejectFriendRequest)
	}
}
