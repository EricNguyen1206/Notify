package handlers

import (
	"chat-service/internal/models"
	"chat-service/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

type UserHandler struct {
	userService *services.UserService
	redisClient *redis.Client
}

func NewUserHandler(userService *services.UserService, redisClient *redis.Client) *UserHandler {
	return &UserHandler{userService: userService, redisClient: redisClient}
}

// GetProfile godoc
// @Summary Get user profile
// @Description Get the current user's profile information
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} models.UserResponse "User profile retrieved successfully"
// @Failure 401 {object} models.ErrorResponse "Unauthorized - invalid or missing token"
// @Failure 500 {object} models.ErrorResponse "Internal server error"
// @Router /users/profile [get]
func (h *UserHandler) GetProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	getError := c.GetString("error")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: "Unauthorized",
			Details: getError,
		})
		return
	}
	userIDUint, ok := userID.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: "Invalid user ID type",
			Details: "user_id in context is not of type uint",
		})
		return
	}
	profile, err := h.userService.GetProfile(userIDUint)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: "Get profile failed",
			Details: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, profile)
}

// UpdateProfile godoc
// @Summary Update user profile
// @Description Update the current user's profile information (username, avatar, password)
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.UpdateProfileRequest true "Profile update request"
// @Success 200 {object} models.UserResponse "Profile updated successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - invalid input data"
// @Failure 401 {object} models.ErrorResponse "Unauthorized - invalid or missing token"
// @Failure 403 {object} models.ErrorResponse "Forbidden - current password is incorrect"
// @Failure 500 {object} models.ErrorResponse "Internal server error"
// @Router /users/profile [put]
func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: "Unauthorized",
			Details: "User ID not found in context",
		})
		return
	}
	userIDUint, ok := userID.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: "Invalid user ID type",
			Details: "user_id in context is not of type uint",
		})
		return
	}

	var req models.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: "Invalid request body",
			Details: err.Error(),
		})
		return
	}

	// Validate current password is provided
	if req.CurrentPassword == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: "Current password is required",
			Details: "Please provide your current password to confirm changes",
		})
		return
	}

	updatedProfile, err := h.userService.UpdateProfile(userIDUint, &req)
	if err != nil {
		if err.Error() == "current password is incorrect" {
			c.JSON(http.StatusForbidden, models.ErrorResponse{
				Code:    http.StatusForbidden,
				Message: "Current password is incorrect",
				Details: "Please check your current password and try again",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: "Update profile failed",
			Details: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, updatedProfile)
}

// SearchUsersByUsername godoc
// @Summary Search users by username
// @Description Search for users by username (partial match for channel creation)
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param username query string true "Username to search for"
// @Success 200 {array} models.UserResponse "List of users found"
// @Failure 400 {object} models.ErrorResponse "Bad request - invalid username"
// @Failure 401 {object} models.ErrorResponse "Unauthorized - invalid or missing token"
// @Failure 500 {object} models.ErrorResponse "Internal server error"
// @Router /users/search [get]
func (h *UserHandler) SearchUsersByUsername(c *gin.Context) {
	username := c.Query("username")
	if username == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: "Username parameter is required",
			Details: "Please provide a username to search for",
		})
		return
	}

	// Basic username validation
	if len(username) < 2 {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: "Username too short",
			Details: "Username must be at least 2 characters long",
		})
		return
	}

	users, err := h.userService.SearchUsersByUsername(username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: "Failed to search users",
			Details: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, users)
}
