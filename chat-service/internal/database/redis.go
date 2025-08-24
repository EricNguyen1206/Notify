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

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Second)
	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	return &RedisClient{
		client: rdb,
	}, nil
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
