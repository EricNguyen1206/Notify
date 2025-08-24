package handlers

import (
	"chat-service/internal/models"
	"chat-service/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

type AuthHandler struct {
	userService *services.UserService
	redisClient *redis.Client
}

func NewAuthHandler(userService *services.UserService, redisClient *redis.Client) *AuthHandler {
	return &AuthHandler{userService: userService, redisClient: redisClient}
}

// Register godoc
// @Summary Register a new user
// @Description Register a new user with username, email, and password
// @Tags auth
// @Accept json
// @Produce json
// @Param request body models.RegisterRequest true "User registration data"
// @Success 201 {object} models.UserResponse "User created successfully"
// @Failure 400 {object} models.ErrorResponse "Bad request - invalid input data"
// @Failure 500 {object} models.ErrorResponse "Internal server error"
// @Router /auth/register [post]
func (h *AuthHandler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: "Invalid input data",
			Details: "Invalid input request",
		})
		return
	}

	user, err := h.userService.Register(&req)
	if err != nil {
		// Sentinel error check for known domain errors
		if err.Error() == "email already exists" {
			c.JSON(http.StatusConflict, models.ErrorResponse{
				Code:    http.StatusConflict,
				Message: "Email already exists",
				Details: "",
			})
			return
		}
		// Generic error for other failures
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Code:    http.StatusInternalServerError,
			Message: "Register failed",
			Details: "An unexpected error occurred.",
		})
		return
	}

	c.JSON(http.StatusCreated, user)
}

// Login godoc
// @Summary User login
// @Description Authenticate user with email and password
// @Tags auth
// @Accept json
// @Produce json
// @Param request body models.LoginRequest true "User login credentials"
// @Success 200 {object} models.LoginResponse "Login successful - returns JWT token and user data"
// @Failure 400 {object} models.ErrorResponse "Bad request - invalid input data"
// @Failure 401 {object} models.ErrorResponse "Unauthorized - invalid credentials"
// @Failure 500 {object} models.ErrorResponse "Internal server error"
// @Router /auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Code:    http.StatusBadRequest,
			Message: "Invalid input data",
			Details: "Invalid input request",
		})
		return
	}

	loginResponse, err := h.userService.Login(&req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{
			Code:    http.StatusUnauthorized,
			Message: "Unauthorized",
			Details: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, loginResponse)
}
