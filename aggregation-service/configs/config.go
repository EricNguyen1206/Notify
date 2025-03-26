package configs

import (
	"fmt"
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
		DBHost     string
		DBPort     string
		DBUser     string
		DBPassword string
		DBName     string
		DSN        string
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
	cfg.Redis.Addr = getEnv("REDIS_ADDR", "redis:6379")
	cfg.Redis.Password = getEnv("REDIS_PASSWORD", "password")
	cfg.Redis.DB, _ = strconv.Atoi(getEnv("REDIS_DB", "0"))

	// MySQL
	cfg.MySQL.DBHost = getEnv("VOTIFY_MYSQL_HOST", "mysql")
	cfg.MySQL.DBPort = getEnv("VOTIFY_MYSQL_PORT", "3306")
	cfg.MySQL.DBUser = getEnv("VOTIFY_MYSQL_USER", "root")
	cfg.MySQL.DBPassword = getEnv("VOTIFY_MYSQL_PASSWORD", "password")
	cfg.MySQL.DBName = getEnv("VOTIFY_MYSQL_DATABASE", "voting_db")

	cfg.MySQL.DSN = fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local&allowNativePasswords=true&multiStatements=true",
		cfg.MySQL.DBUser, cfg.MySQL.DBPassword, cfg.MySQL.DBHost, cfg.MySQL.DBPort, cfg.MySQL.DBName)

	// Kafka
	cfg.Kafka.Brokers = []string{getEnv("KAFKA_BROKERS", "kafka:9092")}
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
