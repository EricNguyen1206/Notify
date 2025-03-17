package config

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
)

// Config holds all configuration values
type Config struct {
	Port       string
	JWTSecret  string
	JWTExpire  time.Duration
	
	// Database
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	
	// Redis
	RedisHost     string
	RedisPort     string
	RedisPassword string
	RedisAddr     string
	
	// MinIO
	MinioEndpoint  string
	MinioUser      string
	MinioPassword  string
	MinioUseSSL    bool
}

// LoadConfig loads configuration from .env file
func LoadConfig() *Config {
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}

	jwtExpire, err := time.ParseDuration(os.Getenv("VOTIFY_JWT_EXPIRE"))
	if err != nil {
		log.Fatal("Invalid JWT_EXPIRE format")
	}

	// Get environment variables
	redisHost := getEnvWithDefault("VOTIFY_REDIS_HOST", "localhost")
	redisPort := getEnvWithDefault("VOTIFY_REDIS_PORT", "6379")
	
	config := &Config{
		Port:       getEnvWithDefault("VOTIFY_SERVICE_PORT", "8000"),
		JWTSecret:  getEnvWithDefault("VOTIFY_JWT_SECRET", "your-secret-key"),
		JWTExpire:  jwtExpire,
		
		// Database
		DBHost:     getEnvWithDefault("VOTIFY_MYSQL_HOST", "localhost"),
		DBPort:     getEnvWithDefault("VOTIFY_MYSQL_PORT", "3306"),
		DBUser:     getEnvWithDefault("VOTIFY_MYSQL_USER", "root"),
		DBPassword: getEnvWithDefault("VOTIFY_MYSQL_PASSWORD", "password"),
		DBName:     getEnvWithDefault("VOTIFY_MYSQL_DATABASE", "voting_db"),
		
		// Redis
		RedisHost:     redisHost,
		RedisPort:     redisPort,
		RedisPassword: getEnvWithDefault("VOTIFY_REDIS_PASSWORD", ""),
		RedisAddr:     fmt.Sprintf("%s:%s", redisHost, redisPort),
		
		// MinIO
		MinioEndpoint:  getEnvWithDefault("VOTIFY_MINIO_ENDPOINT", "localhost:9000"),
		MinioUser:      getEnvWithDefault("VOTIFY_MINIO_ROOT_USER", "admin"),
		MinioPassword:  getEnvWithDefault("VOTIFY_MINIO_ROOT_PASSWORD", "password"),
		MinioUseSSL:    os.Getenv("VOTIFY_MINIO_USE_SSL") == "true",
	}

	return config
}

// Helper function to get environment variable with default value
func getEnvWithDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
