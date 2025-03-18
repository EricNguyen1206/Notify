package handlers

import (
	"net/http"

	"voting-service/internal/ports/models"
	"voting-service/internal/server/middleware"
	"voting-service/internal/server/service"

	"github.com/gin-gonic/gin"
)

type VoteHandler struct {
	voteService *service.VoteService
}

func NewVoteHandler(voteService *service.VoteService) *VoteHandler {
	return &VoteHandler{voteService: voteService}
}

// @Summary Cast a vote for an option
// @Description Submit a vote for a specific option
// @Tags votes
// @Accept json
// @Produce json
// @Param request body models.VoteRequest true "Vote Request"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /topics/{topic_id}/options/{option_id}/vote [post]
func (h *VoteHandler) CastVote(c *gin.Context) {
	// Get authenticated user
	user, err := middleware.GetUserFromContext(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req models.VoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.voteService.CastVote(c.Request.Context(), user.ID, req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "vote recorded successfully"})
}
