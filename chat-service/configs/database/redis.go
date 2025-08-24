package database

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
)

var RedisClient *redis.Client

func InitRedis() (*redis.Client, error) {
	opt, _ := redis.ParseURL("rediss://default:AVGBAAIjcDE5MzM5ZmQ4NTMwYWQ0OGM5OTRiZDk0NDk0MjFiZTA4OXAxMA@generous-pipefish-20865.upstash.io:6379")
	RedisClient := redis.NewClient(opt)

	// Health check
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := RedisClient.Ping(ctx).Result()
	return RedisClient, err

}
