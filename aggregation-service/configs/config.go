package configs

import (
	"os"
	"strconv"
)

type Config struct {
	Redis struct {
		Addr     string
		Password string
		DB       int
	}
	MySQL struct {
		DSN string
	}
	Kafka struct {
		Brokers []string
		Topic   string
	}
	WebSocket struct {
		ReadBufferSize  int
		WriteBufferSize int
	}
}

func Load() *Config {
	var cfg Config

	// Redis
	cfg.Redis.Addr = getEnv("REDIS_ADDR", "localhost:6379")
	cfg.Redis.Password = getEnv("REDIS_PASSWORD", "")
	cfg.Redis.DB, _ = strconv.Atoi(getEnv("REDIS_DB", "0"))

	// MySQL
	cfg.MySQL.DSN = getEnv("MYSQL_DSN", "root:@tcp(localhost:3306)/votes?charset=utf8mb4&parseTime=True&loc=Local")

	// Kafka
	cfg.Kafka.Brokers = []string{getEnv("KAFKA_BROKERS", "localhost:9092")}
	cfg.Kafka.Topic = getEnv("KAFKA_TOPIC", "votes")

	// WebSocket
	cfg.WebSocket.ReadBufferSize, _ = strconv.Atoi(getEnv("WS_READ_BUFFER", "1024"))
	cfg.WebSocket.WriteBufferSize, _ = strconv.Atoi(getEnv("WS_WRITE_BUFFER", "1024"))

	return &cfg
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
