package database

import (
	"fmt"

	"chat-service/internal/category"
	"chat-service/internal/chat"
	"chat-service/internal/server"
	"chat-service/internal/user"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func NewPostgresConnection() (*gorm.DB, error) {
	// dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=require",
	// 	os.Getenv("POSTGRES_HOST"),
	// 	os.Getenv("POSTGRES_USER"),
	// 	os.Getenv("POSTGRES_PASSWORD"),
	// 	os.Getenv("POSTGRES_DB"),
	// 	os.Getenv("POSTGRES_PORT"),
	// )

	dsn := "postgresql://postgres:1206Trongtin!@db.fnpwltjofxlcwvqqzgak.supabase.co:5432/postgres"

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %v", err)
	}

	// Enable UUID extension
	db.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"")

	// Auto migrate the schema
	err = db.AutoMigrate(
		&user.User{},
		&server.Server{},
		&category.Category{},
		&category.Channel{},
		&chat.Chat{},
		&user.Friend{},
		&user.FriendPending{},
		&user.DirectMessage{},
		&server.JoinServer{},
	)
	if err != nil {
		return nil, fmt.Errorf("failed to migrate database: %v", err)
	}

	// Add indexes
	if err := addIndexes(db); err != nil {
		return nil, fmt.Errorf("failed to add indexes: %v", err)
	}

	return db, nil
}

func addIndexes(db *gorm.DB) error {
	// Add indexes for better query performance
	indexes := []struct {
		table   string
		columns []string
	}{
		{"users", []string{"email"}},
		{"servers", []string{"owner"}},
		{"categories", []string{"server_id"}},
		{"channels", []string{"category_id"}},
		{"friend_pending", []string{"sender_email", "receiver_email"}},
		{"friends", []string{"sender_email", "receiver_email"}},
		{"direct_messages", []string{"owner_email", "friend_email"}},
		{"join_server", []string{"server_id", "user_id"}},
		{"chats", []string{"user_id"}},
		{"chats", []string{"server_id", "channel_id"}},
	}

	for _, idx := range indexes {
		for _, column := range idx.columns {
			indexName := fmt.Sprintf("idx_%s_%s", idx.table, column)
			if err := db.Exec(fmt.Sprintf("CREATE INDEX IF NOT EXISTS %s ON %s (%s)",
				indexName, idx.table, column)).Error; err != nil {
				return err
			}
		}
	}

	return nil
}
