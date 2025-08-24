package main

// @title           Notify Chat Service API
// @version         1.0
// @description     A RESTful API service for chat functionality
// @host            localhost:8080
// @BasePath        /api/v1
// @schemes         http https

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.

import (
	// _ "chat-service/docs" // Import swagger docs
	"chat-service/internal/api/routes"
	"chat-service/internal/config"
	"chat-service/internal/database"
	"chat-service/internal/repositories/postgres"
	"chat-service/internal/services"
	"chat-service/internal/websocket"
	"context"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatal("Failed to load config:", err)
	}

	// Initialize logger
	slog.Info("Starting chat server")

	// Initialize Redis connection
	redisClient, err := database.NewRedisConnection(cfg.Redis.URI)
	if err != nil {
		slog.Error("Failed to connect to Redis", "error", err)
		os.Exit(1)
	}
	defer redisClient.Close()

	// Initialize PostgreSQL connection
	db, err := database.NewPostgresConnection(cfg.Database.URI)
	if err != nil {
		slog.Error("Failed to connect to PostgreSQL", "error", err)
		os.Exit(1)
	}

	// Initialize services
	redisService := services.NewRedisService(redisClient)

	// Test Redis connection and set initial migration state
	ctx := context.Background()
	if err := redisService.SetMigrationState(ctx, "1.0.0", "ready"); err != nil {
		slog.Error("Failed to set migration state", "error", err)
	}

	chatRepo := postgres.NewChatRepository(db)

	// Initialize WebSocket hub
	hub := websocket.NewHub(redisService, chatRepo)
	go hub.Run()

	// // Initialize channel manager
	// channelManager := websocket.NewChannelManager(hub, redisService)

	// Initialize router with all dependencies
	router := routes.NewRouter(
		hub,
		redisService,
		redisClient.GetClient(),
		db,
		cfg.JWT.Secret,
	)
	router.SetupRoutes()

	// Create HTTP server
	server := &http.Server{
		Addr:         fmt.Sprintf("%s:%s", cfg.Server.Host, cfg.Server.Port),
		Handler:      router.GetEngine(),
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
		IdleTimeout:  cfg.Server.IdleTimeout,
	}

	// Start server in a goroutine
	go func() {
		slog.Info("Server starting", "address", server.Addr)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("Server failed to start", "error", err)
			os.Exit(1)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("Server shutting down...")

	// Graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Stop WebSocket hub
	hub.Stop()

	// Shutdown HTTP server
	if err := server.Shutdown(ctx); err != nil {
		slog.Error("Server forced to shutdown", "error", err)
	}

	slog.Info("Server stopped")
}
