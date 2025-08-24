package main

import (
	"chat-service/internal/config"
	"chat-service/internal/database"
	"chat-service/internal/models"
	"chat-service/internal/repositories/postgres"
	"chat-service/internal/services"
	"log"
	"log/slog"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func main() {
	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatal("Failed to load config:", err)
	}

	slog.Info("Starting database seeding...")

	// Connect to database
	db, err := database.NewPostgresConnection(cfg.Database.URI)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	slog.Info("Database connection established")

	// Initialize repositories
	userRepo := postgres.NewUserRepository(db)
	channelRepo := postgres.NewChannelRepository(db)

	// Initialize services
	channelService := services.NewChannelService(channelRepo, userRepo)

	// Seed initial users
	slog.Info("Creating initial users...")

	// Create admin user
	adminPassword, _ := bcrypt.GenerateFromPassword([]byte("123456"), bcrypt.DefaultCost)
	adminUser := &models.User{
		Username: "admin",
		Email:    "admin@notify.com",
		Password: string(adminPassword),
	}

	if err := userRepo.Create(adminUser); err != nil {
		slog.Warn("Admin user might already exist", "error", err)
	} else {
		slog.Info("Created admin user", "id", adminUser.ID)
	}

	// Create test users
	testUsers := []struct {
		username string
		email    string
		password string
	}{
		{"testuser", "test@notify.com", "123456"},
		{"alice", "alice@notify.com", "123456"},
		{"bob", "bob@notify.com", "123456"},
		{"charlie", "charlie@notify.com", "123456"},
	}

	for _, userData := range testUsers {
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(userData.password), bcrypt.DefaultCost)
		user := &models.User{
			Username: userData.username,
			Email:    userData.email,
			Password: string(hashedPassword),
		}

		if err := userRepo.Create(user); err != nil {
			slog.Warn("User might already exist", "username", userData.username, "error", err)
		} else {
			slog.Info("Created user", "username", userData.username, "id", user.ID)
		}
	}

	// Seed initial channels
	slog.Info("Creating initial channels...")

	// Get admin user for channel creation
	admin, err := userRepo.FindByEmail("admin@notify.com")
	if err != nil {
		slog.Warn("Could not find admin user for channel creation", "error", err)
	} else {
		// Create general channel
		generalChannel, err := channelService.CreateChannel("general", admin.ID, "group")
		if err != nil {
			slog.Warn("General channel might already exist", "error", err)
		} else {
			slog.Info("Created general channel", "id", generalChannel.ID)
		}

		// Create multiple channels
		channels := []string{"random", "development", "design", "testing"}
		for _, channelName := range channels {
			channel, err := channelService.CreateChannel(channelName, admin.ID, "group")
			if err != nil {
				slog.Warn("Channel might already exist", "name", channelName, "error", err)
			} else {
				slog.Info("Created channel", "name", channelName, "id", channel.ID)
			}
		}
	}

	// Seed sample messages
	slog.Info("Creating sample messages...")
	if err := seedSampleMessages(db, userRepo, channelRepo); err != nil {
		slog.Warn("Failed to seed sample messages", "error", err)
	} else {
		slog.Info("Sample messages created successfully")
	}

	slog.Info("Database seeding completed successfully!")
}

func seedSampleMessages(db *gorm.DB, userRepo *postgres.UserRepository, channelRepo *postgres.ChannelRepository) error {

	// Get users for messaging
	admin, err := userRepo.FindByEmail("admin@notify.com")
	if err != nil {
		return err
	}

	alice, err := userRepo.FindByEmail("alice@notify.com")
	if err != nil {
		return err
	}

	bob, err := userRepo.FindByEmail("bob@notify.com")
	if err != nil {
		return err
	}

	// Get general channel
	var generalChannel models.Channel
	if err := db.Where("name = ?", "general").First(&generalChannel).Error; err != nil {
		return err
	}

	// Sample channel messages (using new model fields)
	channelMessages := []models.Chat{
		{
			SenderID:  admin.ID,
			ChannelID: generalChannel.ID,
			Text:      stringPtr("Welcome to the general channel! 👋"),
			// Type is now implicit by ChannelID being set
		},
		{
			SenderID:  alice.ID,
			ChannelID: generalChannel.ID,
			Text:      stringPtr("Hi everyone! Excited to be here."),
		},
		{
			SenderID:  bob.ID,
			ChannelID: generalChannel.ID,
			Text:      stringPtr("Hello! Looking forward to working together."),
		},
		{
			SenderID:  admin.ID,
			ChannelID: generalChannel.ID,
			Text:      stringPtr("Great to have you all here! Let's build something amazing."),
		},
	}

	for _, msg := range channelMessages {
		if err := db.Create(&msg).Error; err != nil {
			slog.Warn("Failed to create channel message", "error", err)
		}
	}

	// Sample direct messages (using new model fields)
	directMessages := []models.Chat{
		{
			SenderID:   admin.ID,
			ReceiverID: &alice.ID,
			Text:       stringPtr("Hey Alice, welcome to the team!"),
		},
		{
			SenderID:   alice.ID,
			ReceiverID: &admin.ID,
			Text:       stringPtr("Thank you! I'm excited to get started."),
		},
		{
			SenderID:   bob.ID,
			ReceiverID: &alice.ID,
			Text:       stringPtr("Hi Alice! If you need any help, feel free to ask."),
		},
	}

	for _, msg := range directMessages {
		if err := db.Create(&msg).Error; err != nil {
			slog.Warn("Failed to create direct message", "error", err)
		}
	}

	return nil
}

func stringPtr(s string) *string {
	return &s
}
