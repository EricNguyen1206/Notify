package database

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
)

var RedisClient *redis.Client

func InitRedis() (*redis.Client, error) {
	RedisClient := redis.NewClient(&redis.Options{
		Addr:     "redis-11093.crce194.ap-seast-1-1.ec2.redns.redis-cloud.com:11093",
		Username: "default",
		Password: "MQcTvVwl22grkjQpASBwmILUiIkXYGFy",
		DB:       0,
	})

	// Health check
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := RedisClient.Ping(ctx).Result()
	return RedisClient, err

}
