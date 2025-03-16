package config

import (
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
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
}

// LoadConfig loads configuration from .env file
func LoadConfig() *Config {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}

	// Parse JWT expire duration
	jwtExpire, err := time.ParseDuration(os.Getenv("VOTIFY_JWT_EXPIRE"))
	if err != nil {
		log.Fatal("Invalid JWT_EXPIRE format")
	}

	// Get environment variables with default values
	port := getEnvWithDefault("VOTIFY_SERVICE_PORT", "8000")
	jwtSecret := getEnvWithDefault("VOTIFY_JWT_SECRET", "your-secret-key")
	dbHost := getEnvWithDefault("VOTIFY_MYSQL_HOST", "localhost")
	dbPort := getEnvWithDefault("VOTIFY_MYSQL_PORT", "3306")
	dbUser := getEnvWithDefault("VOTIFY_MYSQL_USER", "root")
	dbPassword := getEnvWithDefault("VOTIFY_MYSQL_PASSWORD", "password")
	dbName := getEnvWithDefault("VOTIFY_MYSQL_DATABASE", "votify")

	return &Config{
		Port:       port,
		JWTSecret:  jwtSecret,
		JWTExpire:  jwtExpire,
		DBHost:     dbHost,
		DBPort:     dbPort,
		DBUser:     dbUser,
		DBPassword: dbPassword,
		DBName:     dbName,
	}
}

// Helper function to get environment variable with default value
func getEnvWithDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
