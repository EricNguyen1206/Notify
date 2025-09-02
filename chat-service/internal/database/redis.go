package database

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

/*
Redis Data Structures Used:

1. User Online Status:
   SET online_users -> {user1, user2, user3}
   HASH user:123:status -> {status: "online", last_seen: 1634567890, updated_at: 1634567890}

2. Channel Members:
   SET channel:general:members -> {user1, user2, user3}
   SET user:123:channels -> {general, random, tech}

3. Rate Limiting:
   ZSET rate_limit:message:user123:general -> {timestamp1: score1, timestamp2: score2}
   ZSET rate_limit:websocket:user123 -> {timestamp1: score1}

4. Migration State:
   HASH db:migration:status -> {version: "1.0.0", status: "ready", updated_at: 1634567890}

5. PubSub Channels:
   - chat:channel:general (channel messages)
   - channel:general:events (channel events)
   - user:123:notifications (user notifications)

6. Session Management:
   HASH session:token123 -> {user_id: "123", expires_at: 1634567890}
   SET blacklisted_tokens -> {token1, token2}
*/

/*
Redis Data Structures Used:

1. User Online Status:
   SET online_users -> {user1, user2, user3}
   HASH user:123:status -> {status: "online", last_seen: 1634567890, updated_at: 1634567890}

2. Channel Members:
   SET channel:general:members -> {user1, user2, user3}
   SET user:123:channels -> {general, random, tech}

3. Rate Limiting:
   ZSET rate_limit:message:user123:general -> {timestamp1: score1, timestamp2: score2}
   ZSET rate_limit:websocket:user123 -> {timestamp1: score1}

4. Migration State:
   HASH db:migration:status -> {version: "1.0.0", status: "ready", updated_at: 1634567890}

5. PubSub Channels:
   - chat:channel:general (channel messages)
   - channel:general:events (channel events)
   - user:123:notifications (user notifications)

6. Session Management:
   HASH session:token123 -> {user_id: "123", expires_at: 1634567890}
   SET blacklisted_tokens -> {token1, token2}
*/

type RedisClient struct {
	client *redis.Client
}

func NewRedisConnection(redisURL string) (*RedisClient, error) {
	if redisURL == "" {
		return nil, fmt.Errorf("REDIS_URL environment variable is not set")
	}

	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse Redis URL: %w", err)
	}

	rdb := redis.NewClient(opt)

	// Retry logic with incremental timeout
	maxRetries := 3
	baseTimeout := 5 * time.Second

	var lastErr error

	for attempt := 1; attempt <= maxRetries; attempt++ {
		// Calculate timeout: 5s, 10s, 15s for attempts 1, 2, 3
		timeout := time.Duration(attempt) * baseTimeout

		ctx, cancel := context.WithTimeout(context.Background(), timeout)

		// Test connection
		err := rdb.Ping(ctx).Err()
		cancel() // Clean up context immediately after use

		if err == nil {
			// Connection successful
			return &RedisClient{
				client: rdb,
			}, nil
		}

		lastErr = err

		// If this wasn't the last attempt, wait before retrying
		if attempt < maxRetries {
			waitTime := time.Duration(attempt) * time.Second // 1s, 2s wait between attempts
			time.Sleep(waitTime)
		}
	}

	// All retries failed, close the client and return error
	rdb.Close()
	return nil, fmt.Errorf("failed to connect to Redis after %d attempts, last error: %w", maxRetries, lastErr)
}

func (r *RedisClient) GetClient() *redis.Client {
	return r.client
}

func (r *RedisClient) Close() error {
	return r.client.Close()
}

func (r *RedisClient) Ping(ctx context.Context) error {
	return r.client.Ping(ctx).Err()
}
