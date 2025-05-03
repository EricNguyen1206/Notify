package configs

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"time"
)

// Config holds all configuration values
type Config struct {
	App struct {
		Port      string
		JWTSecret string
		JWTExpire time.Duration
	}

	// Database
	MySQL struct {
		DBHost     string
		DBPort     string
		DBUser     string
		DBPassword string
		DBName     string
		DSN        string
	}

	// Redis
	Redis struct {
		Host     string
		Port     string
		Password string
		Addr     string
	}

	// MinIO
	MinIO struct {
		Endpoint string
		User     string
		Password string
		UseSSL   bool
		Bucket   string
	}

	// Kafka
	Kafka struct {
		Brokers []string
		Topic   string
	}
}

// Load loads configuration from .env file
func Load() *Config {
	var cfg Config

	var expire = getEnv("NOTIFY_JWT_EXPIRE", "24h")

	jwtExpire, err := time.ParseDuration(expire)
	if err != nil {
		log.Fatal("Invalid JWT_EXPIRE format")
	}
	// App
	cfg.App.Port = getEnv("NOTIFY_PORT", "8080")
	cfg.App.JWTSecret = getEnv("NOTIFY_JWT_SECRET", "secret")
	cfg.App.JWTExpire = jwtExpire

	// Redis
	cfg.Redis.Host = getEnv("NOTIFY_REDIS_HOST", "localhost:6379")
	cfg.Redis.Port = getEnv("NOTIFY_REDIS_PORT", "6379")
	cfg.Redis.Password = getEnv("NOTIFY_REDIS_PASSWORD", "")
	cfg.Redis.Addr = fmt.Sprintf("%s:%s", cfg.Redis.Host, cfg.Redis.Port)

	// MySQL
	cfg.MySQL.DBHost = getEnv("NOTIFY_MYSQL_HOST", "localhost")
	cfg.MySQL.DBPort = getEnv("NOTIFY_MYSQL_PORT", "3306")
	cfg.MySQL.DBUser = getEnv("NOTIFY_MYSQL_USER", "admin")
	cfg.MySQL.DBPassword = getEnv("NOTIFY_MYSQL_PASSWORD", "password")
	cfg.MySQL.DBName = getEnv("NOTIFY_MYSQL_DATABASE", "voting_db")
	cfg.MySQL.DSN = fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		cfg.MySQL.DBUser, cfg.MySQL.DBPassword, cfg.MySQL.DBHost, cfg.MySQL.DBPort, cfg.MySQL.DBName)

	// MinIO
	cfg.MinIO.Endpoint = getEnv("NOTIFY_MINIO_ENDPOINT", "localhost:9000")
	cfg.MinIO.User = getEnv("NOTIFY_MINIO_ROOT_USER", "admin")
	cfg.MinIO.Password = getEnv("NOTIFY_MINIO_ROOT_PASSWORD", "password")
	cfg.MinIO.UseSSL, _ = strconv.ParseBool(getEnv("NOTIFY_MINIO_USE_SSL", "true"))
	cfg.MinIO.Bucket = getEnv("NOTIFY_MINIO_BUCKET", "voting-images")

	// Kafka
	cfg.Kafka.Brokers = []string{"localhost:9092"}
	cfg.Kafka.Topic = getEnv("NOTIFY_KAFKA_TOPIC", "voting-events")

	// Load environment variables from .env file
	return &cfg
}

// Helper function to get environment variable with default value
func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
