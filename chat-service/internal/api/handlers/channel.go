package handlers

import (
	"net/http"
	"strconv"

	"chat-service/internal/models"
	"chat-service/internal/services"

	"github.com/gin-gonic/gin"
)

type ChannelHandler struct {
	channelService *services.ChannelService
}

// Ensure models package is imported for Swagger generation
var _ models.ChannelResponse

func NewChannelHandler(channelService *services.ChannelService) *ChannelHandler {
	return &ChannelHandler{channelService: channelService}
}

// GetUserChannels godoc
// @Summary Get user's channels
// @Description Get all channels that the current user is a member of, separated by type
// @Tags channels
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} models.UserChannelsResponse "Object with direct and group channel lists"
// @Failure 401 {object} models.ErrorResponse "Unauthorized - invalid or missing token"
// @Failure 500 {object} models.ErrorResponse "Internal server error"
// @Router /channels/ [get]
func (h *ChannelHandler) GetUserChannels(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)
	directChannels, groupChannels, err := h.channelService.GetAllChannel(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: "Failed to get channels",
			Details: err.Error(),
		})
		return
	}
	resp := models.UserChannelsResponse{
		Direct: directChannels,
		Group:  groupChannels,
	}
	c.JSON(http.StatusOK, resp)
}

// CreateChannel godoc
// @Summary Create a new channel
// @Description Create a new channel with the specified name and selected users
// @Tags channels
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.CreateChannelRequest true "Channel creation data with user selection"
// @Success 200 {object} models.ChannelResponse "Channel created successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - invalid input data"
// @Failure 401 {object} models.ErrorResponse "Unauthorized - invalid or missing token"
// @Failure 500 {object} models.ErrorResponse "Internal server error"
// @Router /channels/ [post]
func (h *ChannelHandler) CreateChannel(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)

	var req models.CreateChannelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: "Invalid input data",
			Details: err.Error(),
		})
		return
	}

	// Validate user selection constraints
	if len(req.UserIDs) < 2 {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: "At least 2 users must be selected",
			Details: "Minimum 2 users required for channel creation",
		})
		return
	}

	if len(req.UserIDs) > 4 {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: "Maximum 4 users allowed",
			Details: "Cannot select more than 4 users for a channel",
		})
		return
	}

	// Ensure the current user is included in the user list
	userIncluded := false
	for _, id := range req.UserIDs {
		if id == userID {
			userIncluded = true
			break
		}
	}

	if !userIncluded {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: "Current user must be included in channel",
			Details: "You must include yourself when creating a channel",
		})
		return
	}

	channel, err := h.channelService.CreateChannelWithUsers(req.Name, userID, req.Type, req.UserIDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: "Failed to create channel",
			Details: err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, channel)
}

// UpdateChannel godoc
// @Summary Update channel
// @Description Update the name of an existing channel
// @Tags channels
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Channel ID"
// @Param request body map[string]string true "Channel update data"
// @Success 200 {object} map[string]string "Channel updated successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - invalid input data"
// @Failure 401 {object} models.ErrorResponse "Unauthorized - invalid or missing token"
// @Failure 500 {object} models.ErrorResponse "Internal server error"
// @Router /channels/{id} [put]
func (h *ChannelHandler) UpdateChannel(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	var req struct {
		Name string `json:"name"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: "Invalid input data",
			Details: err.Error(),
		})
		return
	}
	err := h.channelService.UpdateChannel(uint(id), req.Name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: "Update failed",
			Details: err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Channel updated"})
}

// DeleteChannel godoc
// @Summary Delete channel
// @Description Delete a channel (only channel owner can delete)
// @Tags channels
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Channel ID"
// @Success 200 {object} map[string]string "Channel deleted successfully"
// @Failure 401 {object} models.ErrorResponse "Unauthorized - invalid or missing token"
// @Failure 500 {object} models.ErrorResponse "Internal server error"
// @Router /channels/{id} [delete]
func (h *ChannelHandler) DeleteChannel(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	if err := h.channelService.DeleteChannel(userID, uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: "Delete failed",
			Details: err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Channel deleted"})
}

// GetChannelByID godoc
// @Summary Get channel by ID
// @Description Get detailed information about a specific channel
// @Tags channels
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Channel ID"
// @Success 200 {object} models.ChannelDetailResponse "Channel details retrieved successfully"
// @Failure 401 {object} models.ErrorResponse "Unauthorized - invalid or missing token"
// @Failure 404 {object} models.ErrorResponse "Channel not found"
// @Router /channels/{id} [get]
func (h *ChannelHandler) GetChannelByID(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	channel, err := h.channelService.GetChannelByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Code:    http.StatusNotFound,
			Message: "Channel not found",
			Details: err.Error(),
		})
		return
	}

	// Build ChannelResponse with members
	members := make([]models.User, 0, len(channel.Members))
	for _, m := range channel.Members {
		if m != nil {
			members = append(members, *m)
		}
	}
	resp := models.ChannelDetailResponse{
		ID:        channel.ID,
		Name:      channel.Name,
		Type:      channel.Type,
		CreatedAt: channel.CreatedAt,
		OwnerID:   channel.OwnerID,
		Members:   members,
	}
	c.JSON(http.StatusOK, resp)
}

// AddUserToChannel godoc
// @Summary Add user to channel
// @Description Add a user to a channel (only channel owner can add users)
// @Tags channels
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Channel ID"
// @Param request body map[string]uint true "User addition data"
// @Success 200 {object} map[string]string "User added to channel successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - invalid input data"
// @Failure 401 {object} models.ErrorResponse "Unauthorized - invalid or missing token"
// @Failure 500 {object} models.ErrorResponse "Internal server error"
// @Router /channels/{id}/user [post]
func (h *ChannelHandler) AddUserToChannel(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)
	channelID, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	var req struct {
		TargetUserID uint `json:"userId"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: "Invalid input data",
			Details: err.Error(),
		})
		return
	}
	err := h.channelService.AddUserToChannel(userID, uint(channelID), req.TargetUserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: "Add user failed",
			Details: err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "User added to channel"})
}

// LeaveChannel godoc
// @Summary Leave channel
// @Description Remove the current user from a channel
// @Tags channels
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Channel ID"
// @Success 200 {object} map[string]string "User left channel successfully"
// @Failure 401 {object} models.ErrorResponse "Unauthorized - invalid or missing token"
// @Failure 500 {object} models.ErrorResponse "Internal server error"
// @Router /channels/{id}/user [put]
func (h *ChannelHandler) LeaveChannel(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	err := h.channelService.LeaveChannel(uint(id), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: "Failed to leave channel",
			Details: err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Left channel"})
}

// RemoveUserFromChannel godoc
// @Summary Remove user from channel
// @Description Remove a user from a channel (only channel owner can remove users)
// @Tags channels
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Channel ID"
// @Param request body map[string]uint true "User removal data"
// @Success 200 {object} map[string]string "User removed from channel successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - invalid input data"
// @Failure 401 {object} models.ErrorResponse "Unauthorized - invalid or missing token"
// @Failure 500 {object} models.ErrorResponse "Internal server error"
// @Router /channels/{id}/user [delete]
func (h *ChannelHandler) RemoveUserFromChannel(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)
	channelID, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	var req struct {
		UserID uint `json:"userId"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: "Invalid input data",
			Details: err.Error(),
		})
		return
	}
	err := h.channelService.RemoveUserFromChannel(userID, uint(channelID), req.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: "Remove user failed",
			Details: err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "User removed from channel"})
}
