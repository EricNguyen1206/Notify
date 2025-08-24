package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"chat-service/internal/database"
	"log/slog"

	"github.com/redis/go-redis/v9"
)

type RedisService struct {
	client *database.RedisClient
}

func NewRedisService(client *database.RedisClient) *RedisService {
	return &RedisService{
		client: client,
	}
}

// =============================================================================
// User Status Management
// =============================================================================

func (r *RedisService) SetUserOnline(ctx context.Context, userID string) error {
	pipe := r.client.GetClient().Pipeline()

	// Add to online users set
	pipe.SAdd(ctx, "online_users", userID)

	// Set user status hash
	pipe.HSet(ctx, fmt.Sprintf("user:%s:status", userID), map[string]interface{}{
		"status":     "online",
		"last_seen":  time.Now().Unix(),
		"updated_at": time.Now().Unix(),
	})

	// Set expiration for status
	pipe.Expire(ctx, fmt.Sprintf("user:%s:status", userID), 5*time.Minute)

	_, err := pipe.Exec(ctx)
	if err != nil {
		slog.Error("Failed to set user online", "userID", userID, "error", err)
		return err
	}

	slog.Debug("User set to online", "userID", userID)
	return nil
}

func (r *RedisService) SetUserOffline(ctx context.Context, userID string) error {
	pipe := r.client.GetClient().Pipeline()

	// Remove from online users set
	pipe.SRem(ctx, "online_users", userID)

	// Update user status
	pipe.HSet(ctx, fmt.Sprintf("user:%s:status", userID), map[string]interface{}{
		"status":     "offline",
		"last_seen":  time.Now().Unix(),
		"updated_at": time.Now().Unix(),
	})

	// Set longer expiration for offline status
	pipe.Expire(ctx, fmt.Sprintf("user:%s:status", userID), 24*time.Hour)

	_, err := pipe.Exec(ctx)
	if err != nil {
		slog.Error("Failed to set user offline", "userID", userID, "error", err)
		return err
	}

	slog.Debug("User set to offline", "userID", userID)
	return nil
}

func (r *RedisService) IsUserOnline(ctx context.Context, userID string) (bool, error) {
	result, err := r.client.GetClient().SIsMember(ctx, "online_users", userID).Result()
	if err != nil {
		return false, err
	}
	return result, nil
}

func (r *RedisService) GetOnlineUsers(ctx context.Context) ([]string, error) {
	return r.client.GetClient().SMembers(ctx, "online_users").Result()
}

// =============================================================================
// Channel Management
// =============================================================================

func (r *RedisService) JoinChannel(ctx context.Context, userID, channelID string) error {
	pipe := r.client.GetClient().Pipeline()

	// Add user to channel members set
	pipe.SAdd(ctx, fmt.Sprintf("channel:%s:members", channelID), userID)

	// Add channel to user's channels set
	pipe.SAdd(ctx, fmt.Sprintf("user:%s:channels", userID), channelID)

	// Update channel member count
	pipe.SCard(ctx, fmt.Sprintf("channel:%s:members", channelID))

	_, err := pipe.Exec(ctx)
	if err != nil {
		slog.Error("Failed to join channel", "userID", userID, "channelID", channelID, "error", err)
		return err
	}

	// Publish join event
	joinEvent := map[string]interface{}{
		"type":       "channel.member.join",
		"user_id":    userID,
		"channel_id": channelID,
		"timestamp":  time.Now().Unix(),
	}

	return r.PublishChannelEvent(ctx, channelID, joinEvent)
}

func (r *RedisService) LeaveChannel(ctx context.Context, userID, channelID string) error {
	pipe := r.client.GetClient().Pipeline()

	// Remove user from channel members set
	pipe.SRem(ctx, fmt.Sprintf("channel:%s:members", channelID), userID)

	// Remove channel from user's channels set
	pipe.SRem(ctx, fmt.Sprintf("user:%s:channels", userID), channelID)

	_, err := pipe.Exec(ctx)
	if err != nil {
		slog.Error("Failed to leave channel", "userID", userID, "channelID", channelID, "error", err)
		return err
	}

	// Publish leave event
	leaveEvent := map[string]interface{}{
		"type":       "channel.member.leave",
		"user_id":    userID,
		"channel_id": channelID,
		"timestamp":  time.Now().Unix(),
	}

	return r.PublishChannelEvent(ctx, channelID, leaveEvent)
}

func (r *RedisService) GetChannelMembers(ctx context.Context, channelID string) ([]string, error) {
	return r.client.GetClient().SMembers(ctx, fmt.Sprintf("channel:%s:members", channelID)).Result()
}

func (r *RedisService) IsUserInChannel(ctx context.Context, userID, channelID string) (bool, error) {
	return r.client.GetClient().SIsMember(ctx, fmt.Sprintf("channel:%s:members", channelID), userID).Result()
}

// =============================================================================
// PubSub Operations
// =============================================================================

func (r *RedisService) PublishChannelMessage(ctx context.Context, channelID string, message interface{}) error {
	data, err := json.Marshal(message)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %w", err)
	}

	err = r.client.GetClient().Publish(ctx, fmt.Sprintf("chat:channel:%s", channelID), data).Err()
	if err != nil {
		slog.Error("Failed to publish channel message", "channelID", channelID, "error", err)
		return err
	}

	slog.Debug("Published channel message", "channelID", channelID)
	return nil
}

func (r *RedisService) PublishChannelEvent(ctx context.Context, channelID string, event interface{}) error {
	data, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	err = r.client.GetClient().Publish(ctx, fmt.Sprintf("channel:%s:events", channelID), data).Err()
	if err != nil {
		slog.Error("Failed to publish channel event", "channelID", channelID, "error", err)
		return err
	}

	slog.Debug("Published channel event", "channelID", channelID)
	return nil
}

func (r *RedisService) PublishUserNotification(ctx context.Context, userID string, notification interface{}) error {
	data, err := json.Marshal(notification)
	if err != nil {
		return fmt.Errorf("failed to marshal notification: %w", err)
	}

	err = r.client.GetClient().Publish(ctx, fmt.Sprintf("user:%s:notifications", userID), data).Err()
	if err != nil {
		slog.Error("Failed to publish user notification", "userID", userID, "error", err)
		return err
	}

	slog.Debug("Published user notification", "userID", userID)
	return nil
}

func (r *RedisService) Subscribe(ctx context.Context, channels ...string) *redis.PubSub {
	pubsub := r.client.GetClient().Subscribe(ctx, channels...)
	slog.Debug("Subscribed to channels", "channels", channels)
	return pubsub
}

func (r *RedisService) PSubscribe(ctx context.Context, patterns ...string) *redis.PubSub {
	pubsub := r.client.GetClient().PSubscribe(ctx, patterns...)
	slog.Debug("Pattern subscribed to channels", "patterns", patterns)
	return pubsub
}

// =============================================================================
// Rate Limiting
// =============================================================================

func (r *RedisService) CheckRateLimit(ctx context.Context, key string, limit int, window time.Duration) (bool, error) {
	now := time.Now()
	windowStart := now.Add(-window).Unix()

	pipe := r.client.GetClient().Pipeline()

	// Remove old entries
	pipe.ZRemRangeByScore(ctx, key, "0", fmt.Sprintf("%d", windowStart))

	// Count current entries
	pipe.ZCard(ctx, key)

	// Add current request
	pipe.ZAdd(ctx, key, redis.Z{Score: float64(now.Unix()), Member: now.UnixNano()})

	// Set expiration
	pipe.Expire(ctx, key, window)

	results, err := pipe.Exec(ctx)
	if err != nil {
		return false, err
	}

	// Get count result
	count := results[1].(*redis.IntCmd).Val()

	return count < int64(limit), nil
}

// =============================================================================
// Migration State Management
// =============================================================================

func (r *RedisService) SetMigrationState(ctx context.Context, version string, status string) error {
	return r.client.GetClient().HSet(ctx, "db:migration:status", map[string]interface{}{
		"version":    version,
		"status":     status,
		"updated_at": time.Now().Unix(),
	}).Err()
}

func (r *RedisService) GetMigrationState(ctx context.Context) (map[string]string, error) {
	return r.client.GetClient().HGetAll(ctx, "db:migration:status").Result()
}

// =============================================================================
// Cache Operations
// =============================================================================

func (r *RedisService) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	data, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("failed to marshal value: %w", err)
	}

	return r.client.GetClient().Set(ctx, key, data, expiration).Err()
}

func (r *RedisService) Get(ctx context.Context, key string, dest interface{}) error {
	data, err := r.client.GetClient().Get(ctx, key).Result()
	if err != nil {
		return err
	}

	return json.Unmarshal([]byte(data), dest)
}

func (r *RedisService) Delete(ctx context.Context, keys ...string) error {
	return r.client.GetClient().Del(ctx, keys...).Err()
}
