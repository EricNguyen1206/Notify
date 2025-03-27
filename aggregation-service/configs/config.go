package configs

import (
	"fmt"
	"os"
	"strconv"
)

type Config struct {
	App struct {
		Port string
	}
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

	cfg.App.Port = getEnv("VOTIFY_AGGREGATION_PORT", "8081")

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
	cfg.Kafka.Brokers = []string{getEnv("VOTIFY_KAFKA_BROKERS", "kafka:9092")}
	cfg.Kafka.Topic = getEnv("VOTIFY_KAFKA_TOPIC", "voting-events")

	// WebSocket
	cfg.WebSocket.ReadBufferSize, _ = strconv.Atoi(getEnv("VOTIFY_WS_READ_BUFFER", "1024"))
	cfg.WebSocket.WriteBufferSize, _ = strconv.Atoi(getEnv("VOTIFY_WS_WRITE_BUFFER", "1024"))

	return &cfg
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
