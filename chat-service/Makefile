# Makefile for Notify Chat Service

# Variables
BINARY_NAME=main
BUILD_FLAGS=-tags netgo -ldflags '-s -w'

# Default target
all: deps build test

# Install dependencies
deps:
	@echo "Installing dependencies..."
	@go mod download
	@go mod tidy

# Build the application
build:
	@echo "Building..."
	@go build $(BUILD_FLAGS) -o $(BINARY_NAME) cmd/server/main.go

# Build for Linux (production)
build-linux:
	@echo "Building for Linux (production)..."
	@mkdir -p bin
	@GOOS=linux GOARCH=amd64 go build $(BUILD_FLAGS) -o bin/server cmd/server/main.go
	@echo "✅ Linux binary created: bin/server"

# Build for multiple platforms
build-all:
	@echo "Building for all platforms..."
	@mkdir -p bin
	@echo "📦 Building for Linux..."
	@GOOS=linux GOARCH=amd64 go build $(BUILD_FLAGS) -o bin/server-linux cmd/server/main.go
	@echo "📦 Building for macOS..."
	@GOOS=darwin GOARCH=amd64 go build $(BUILD_FLAGS) -o bin/server-darwin cmd/server/main.go
	@echo "📦 Building for Windows..."
	@GOOS=windows GOARCH=amd64 go build $(BUILD_FLAGS) -o bin/server-windows.exe cmd/server/main.go
	@echo "✅ All builds complete!"
	@echo "   - Linux: bin/server-linux"
	@echo "   - macOS: bin/server-darwin"
	@echo "   - Windows: bin/server-windows.exe"

# Run the application
run: build
	@echo "Running application..."
	@./$(BINARY_NAME)

# Docker commands
docker-run:
	@echo "Starting Docker containers..."
	@if docker compose up --build 2>/dev/null; then \
		: ; \
	else \
		echo "Falling back to Docker Compose V1"; \
		docker-compose up --build; \
	fi

docker-down:
	@echo "Stopping Docker containers..."
	@if docker compose down 2>/dev/null; then \
		: ; \
	else \
		echo "Falling back to Docker Compose V1"; \
		docker-compose down; \
	fi

# Testing
test:
	@echo "Running unit tests..."
	@go test ./... -v -race -cover

itest:
	@echo "Running integration tests..."
	@go test ./internal/database -v

# Development tools
dev-tools:
	@echo "Installing development tools..."
	@go install github.com/air-verse/air@latest
	@go install github.com/swaggo/swag/cmd/swag@latest

# Clean build artifacts
clean:
	@echo "Cleaning..."
	@rm -f $(BINARY_NAME)
	@go clean -testcache

# Live reload for development
watch:
	@if command -v air > /dev/null; then \
		echo "Starting air for live reload..."; \
		air; \
	else \
		echo "Air is not installed. Run 'make dev-tools' to install it."; \
		exit 1; \
	fi

# Documentation
swagger: check-swag
	@echo "Generating Swagger documentation..."
	@swag init \
		--dir . \
		--generalInfo cmd/server/main.go \
		--output ./docs \
		--parseDependency \
		--parseInternal \
		--parseDepth 2
	@echo "✅ Swagger documentation generated in docs/"

# Check if swag is installed
check-swag:
	@if ! command -v swag > /dev/null; then \
		echo "Swag is not installed. Run 'make dev-tools' to install it."; \
		exit 1; \
	fi

# Database operations
migrate-up:
	@echo "Running database migrations..."
	@go run cmd/migrate/main.go

seed-db:
	@echo "Seeding database with test data..."
	@go run cmd/seed/main.go

migrate-seed: migrate-up seed-db
	@echo "Migration and seeding completed!"

# Database reset (use with caution)
db-reset:
	@echo "Resetting database..."
	@docker exec -it $$(docker ps -q -f name=postgres) psql -U postgres -d postgres -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
	@make migrate-seed

# Help target
help:
	@echo "Available targets:"
	@echo "  all          - Install dependencies, build and test"
	@echo "  deps         - Install project dependencies"
	@echo "  build        - Build the application"
	@echo "  build-linux  - Build for Linux (production)"
	@echo "  build-all    - Build for all platforms (Linux, macOS, Windows)"
	@echo "  run          - Run the application"
	@echo "  docker-run   - Start Docker containers"
	@echo "  docker-down  - Stop Docker containers"
	@echo "  test         - Run unit tests"
	@echo "  itest        - Run integration tests"
	@echo "  dev-tools    - Install development tools (air, swag)"
	@echo "  clean        - Clean build artifacts"
	@echo "  watch        - Run with live reload (using air)"
	@echo "  swagger      - Generate Swagger documentation"
	@echo "  migrate-up   - Run database migrations"
	@echo "  seed-db      - Seed database with test data"
	@echo "  migrate-seed - Run migrations and seed data"
	@echo "  db-reset     - Reset database and reseed (DESTRUCTIVE)"
	@echo "  help         - Show this help message"

# Declare all targets as PHONY
.PHONY: all deps build build-linux build-all run test itest clean watch swagger check-swag docker-run docker-down dev-tools migrate-up seed-db migrate-seed db-reset help
