package config

import (
	"log/slog"
	"sync"
	"time"

	"github.com/spf13/viper"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Redis    RedisConfig
	JWT      JWTConfig
}

var (
	ConfigInstance *Config
	once           sync.Once
)

type ServerConfig struct {
	Host         string
	Port         string
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
	IdleTimeout  time.Duration
}

type DatabaseConfig struct {
	URI string
}

type RedisConfig struct {
	URI          string
	MaxRetries   int
	DialTimeout  time.Duration
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
	PoolSize     int
	MinIdleConns int
}

type JWTConfig struct {
	Secret         string
	ExpirationTime time.Duration
}

func LoadConfig() (*Config, error) {
	// Viper setup
	once.Do(func() {
		// Set up Viper to read from .env file
		viper.SetConfigName(".env")
		viper.SetConfigType("env")
		viper.AddConfigPath(".")
		viper.AddConfigPath("./configs")

		// Read .env file if it exists
		if err := viper.ReadInConfig(); err != nil {
			if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
				slog.Warn("Error reading config file", "error", err)
			}
		}

		// Set defaults
		viper.SetDefault("NOTIFY_HOST", "localhost")
		viper.SetDefault("NOTIFY_PORT", "8080")
		viper.SetDefault("NOTIFY_READ_TIMEOUT", 30*time.Second)
		viper.SetDefault("NOTIFY_WRITE_TIMEOUT", 30*time.Second)
		viper.SetDefault("NOTIFY_IDLE_TIMEOUT", 60*time.Second)
		viper.SetDefault("NOTIFY_JWT_SECRET", "your-secret-key")
		viper.SetDefault("NOTIFY_JWT_EXPIRE", "24h")
		viper.SetDefault("REDIS_URL", "redis://localhost:6379/0")
		viper.SetDefault("REDIS_MAX_RETRIES", 3)
		viper.SetDefault("REDIS_POOL_SIZE", 100)
		viper.SetDefault("REDIS_MIN_IDLE_CONNS", 10)
		viper.SetDefault("REDIS_DIAL_TIMEOUT", 5*time.Second)
		viper.SetDefault("REDIS_READ_TIMEOUT", 3*time.Second)
		viper.SetDefault("REDIS_WRITE_TIMEOUT", 3*time.Second)
		viper.SetDefault("POSTGRES_URL", "postgres://postgres:password@localhost:5432/postgres?sslmode=disable")
		// Enable environment variable reading
		viper.AutomaticEnv()

		// Create config instance
		ConfigInstance = &Config{
			Server: ServerConfig{
				Host:         viper.GetString("NOTIFY_HOST"),
				Port:         viper.GetString("NOTIFY_PORT"),
				ReadTimeout:  viper.GetDuration("NOTIFY_READ_TIMEOUT"),
				WriteTimeout: viper.GetDuration("NOTIFY_WRITE_TIMEOUT"),
				IdleTimeout:  viper.GetDuration("NOTIFY_IDLE_TIMEOUT"),
			},
			Database: DatabaseConfig{
				URI: viper.GetString("POSTGRES_URL"),
			},
			Redis: RedisConfig{
				URI:          viper.GetString("REDIS_URL"),
				MaxRetries:   viper.GetInt("REDIS_MAX_RETRIES"),
				DialTimeout:  viper.GetDuration("REDIS_DIAL_TIMEOUT"),
				ReadTimeout:  viper.GetDuration("REDIS_READ_TIMEOUT"),
				WriteTimeout: viper.GetDuration("REDIS_WRITE_TIMEOUT"),
				PoolSize:     viper.GetInt("REDIS_POOL_SIZE"),
				MinIdleConns: viper.GetInt("REDIS_MIN_IDLE_CONNS"),
			},
			JWT: JWTConfig{
				Secret:         viper.GetString("NOTIFY_JWT_SECRET"),
				ExpirationTime: viper.GetDuration("NOTIFY_JWT_EXPIRE"),
			},
		}
	})

	return ConfigInstance, nil
}
