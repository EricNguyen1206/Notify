# =============================================================================
# Notify Chat Application - Root Makefile
# =============================================================================
# This Makefile provides convenient commands for managing both frontend and 
# backend development workflows from the project root directory.
#
# Usage: make <target>
# Example: make help
# =============================================================================

# Project directories
FRONTEND_DIR := apps/web
BACKEND_DIR := apps/api

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[0;33m
BLUE := \033[0;34m
PURPLE := \033[0;35m
CYAN := \033[0;36m
WHITE := \033[0;37m
NC := \033[0m # No Color

# Default target
.DEFAULT_GOAL := help

# =============================================================================
# HELP & INFORMATION
# =============================================================================

## Show this help message
help:
	@echo "$(CYAN)Notify Chat Application - Development Commands$(NC)"
	@echo "=================================================="
	@echo ""
	@echo "$(YELLOW)Frontend Commands:$(NC)"
	@echo "  $(GREEN)frontend-install$(NC)     - Install frontend dependencies"
	@echo "  $(GREEN)frontend-dev$(NC)         - Run frontend in development mode"
	@echo "  $(GREEN)frontend-build$(NC)       - Build frontend for production"
	@echo "  $(GREEN)frontend-test$(NC)        - Run frontend tests"
	@echo "  $(GREEN)frontend-lint$(NC)        - Run frontend linting"
	@echo ""
	@echo "$(YELLOW)Backend Commands:$(NC)"
	@echo "  $(GREEN)backend-install$(NC)      - Install backend dependencies"
	@echo "  $(GREEN)backend-dev$(NC)          - Run backend in development mode"
	@echo "  $(GREEN)backend-build$(NC)        - Build backend binary"
	@echo "  $(GREEN)backend-test$(NC)         - Run backend tests"
	@echo "  $(GREEN)migrate$(NC)              - Run database migrations"
	@echo "  $(GREEN)seed$(NC)                 - Seed database with test data"
	@echo "  $(GREEN)migrate-seed$(NC)         - Run migrations and seed data"
	@echo ""
	@echo ""
	@echo "$(YELLOW)Development Workflow:$(NC)"
	@echo "  $(GREEN)install$(NC)              - Install all dependencies (frontend + backend)"
	@echo "  $(GREEN)dev$(NC)                  - Start both frontend and backend in dev mode"
	@echo "  $(GREEN)test$(NC)                 - Run all tests (frontend + backend)"
	@echo "  $(GREEN)build$(NC)                - Build both frontend and backend"
	@echo "  $(GREEN)clean$(NC)                - Clean all build artifacts"
	@echo ""
	@echo "$(YELLOW)Utility Commands:$(NC)"
	@echo "  $(GREEN)health$(NC)               - Check health status of all services"
	@echo "  $(GREEN)status$(NC)               - Show status of all Docker services"
	@echo "  $(GREEN)setup$(NC)                - Complete project setup (install + migrate + seed)"
	@echo "  $(GREEN)check-env$(NC)            - Check prerequisites and environment"
	@echo "  $(GREEN)info$(NC)                 - Show project information and URLs"
	@echo ""
	@echo "$(YELLOW)Advanced Commands:$(NC)"
	@echo "  $(GREEN)quick-start$(NC)          - Quick setup for new contributors"
	@echo "  $(GREEN)docs$(NC)                 - Generate and serve API documentation"
	@echo "  $(GREEN)dev-tools$(NC)            - Install development tools"
	@echo "  $(GREEN)integration-test$(NC)     - Run integration tests"
	@echo "  $(GREEN)db-reset$(NC)             - Reset database (DESTRUCTIVE)"
	@echo ""

# =============================================================================
# FRONTEND COMMANDS
# =============================================================================

## Install frontend dependencies
frontend-install:
	@echo "$(BLUE)📦 Installing frontend dependencies...$(NC)"
	@pnpm install --filter @notify/web
	@echo "$(GREEN)✅ Frontend dependencies installed$(NC)"

## Run frontend in development mode
frontend-dev:
	@echo "$(BLUE)🚀 Starting frontend development server...$(NC)"
	@pnpm --filter @notify/web dev

## Build frontend for production
frontend-build:
	@echo "$(BLUE)🏗️  Building frontend for production...$(NC)"
	@pnpm --filter @notify/web build
	@echo "$(GREEN)✅ Frontend build completed$(NC)"

## Run frontend linting
frontend-lint:
	@echo "$(BLUE)🔍 Running frontend linting...$(NC)"
	@pnpm --filter @notify/web lint
	@echo "$(GREEN)✅ Frontend linting completed$(NC)"

# =============================================================================
# BACKEND COMMANDS
# =============================================================================

## Install backend dependencies
backend-install:
	@echo "$(BLUE)📦 Installing backend dependencies...$(NC)"
	@pnpm install --filter @notify/api
	@echo "$(GREEN)✅ Backend dependencies installed$(NC)"

## Run backend in development mode with live reload
backend-dev:
	@echo "$(BLUE)🚀 Starting backend development server with live reload...$(NC)"
	@pnpm --filter @notify/api dev

## Build backend binary
backend-build:
	@echo "$(BLUE)🏗️  Building backend binary...$(NC)"
	@pnpm --filter @notify/api build
	@echo "$(GREEN)✅ Backend build completed$(NC)"

## Run database migrations
migrate:
	@echo "$(BLUE)🗄️  Running database migrations...$(NC)"
	@cd $(BACKEND_DIR) && make migrate-up
	@echo "$(GREEN)✅ Database migrations completed$(NC)"

## Seed database with initial/test data
seed:
	@echo "$(BLUE)🌱 Seeding database with test data...$(NC)"
	@cd $(BACKEND_DIR) && make seed-db
	@echo "$(GREEN)✅ Database seeding completed$(NC)"

## Run migrations and seed database
migrate-seed:
	@echo "$(BLUE)🗄️  Running migrations and seeding database...$(NC)"
	@cd $(BACKEND_DIR) && make migrate-seed
	@echo "$(GREEN)✅ Migration and seeding completed$(NC)"

# =============================================================================
# DEVELOPMENT WORKFLOW COMMANDS
# =============================================================================

## Install all dependencies (frontend + backend)
install:
	@echo "$(BLUE)📦 Installing all dependencies...$(NC)"
	@pnpm install
	@echo "$(GREEN)✅ All dependencies installed$(NC)"

## Start both frontend and backend in development mode
dev:
	@echo "$(BLUE)🚀 Starting development environment...$(NC)"
	@echo "$(YELLOW)Note: This will start backend first, then frontend$(NC)"
	@echo "$(YELLOW)Press Ctrl+C to stop both services$(NC)"
	@pnpm dev

## Run all tests (frontend + backend)
test:
	@echo "$(BLUE)🧪 Running all tests...$(NC)"
	@pnpm test
	@echo "$(GREEN)✅ All tests completed$(NC)"

## Build both frontend and backend
build:
	@echo "$(BLUE)🏗️  Building all packages...$(NC)"
	@pnpm build
	@echo "$(GREEN)✅ All builds completed$(NC)"

## Clean all build artifacts
clean:
	@echo "$(BLUE)🧹 Cleaning all build artifacts...$(NC)"
	@pnpm clean
	@rm -rf node_modules apps/*/node_modules packages/*/node_modules
	@echo "$(GREEN)✅ Cleanup completed$(NC)"

# =============================================================================
# UTILITY COMMANDS
# =============================================================================

## Check health status of all running services
health:
	@echo "$(BLUE)🏥 Checking health status of all services...$(NC)"
	@echo ""
	@echo "$(CYAN)Frontend Health:$(NC)"
	@curl -s http://localhost:3000/api/health 2>/dev/null | jq . || echo "$(RED)❌ Frontend not responding$(NC)"
	@echo ""
	@echo "$(CYAN)Backend Health:$(NC)"
	@curl -s http://localhost:8080/kaithhealthcheck 2>/dev/null | jq . || echo "$(RED)❌ Backend not responding$(NC)"
	@echo ""

## Complete project setup (install + migrate + seed)
setup: install migrate-seed
	@echo "$(GREEN)✅ Project setup completed!$(NC)"
	@echo "$(CYAN)🎉 You can now run 'make dev' to start development$(NC)"

# =============================================================================
# ADVANCED COMMANDS
# =============================================================================

## Reset database (DESTRUCTIVE - use with caution)
db-reset:
	@echo "$(RED)⚠️  WARNING: This will destroy all data in the database!$(NC)"
	@echo "$(YELLOW)Press Ctrl+C within 5 seconds to cancel...$(NC)"
	@sleep 5
	@cd $(BACKEND_DIR) && make db-reset
	@echo "$(GREEN)✅ Database reset completed$(NC)"

## Install development tools
dev-tools:
	@echo "$(BLUE)🔧 Installing development tools...$(NC)"
	@cd $(BACKEND_DIR) && make dev-tools
	@echo "$(GREEN)✅ Development tools installed$(NC)"

## Run integration tests
integration-test:
	@echo "$(BLUE)🧪 Running integration tests...$(NC)"
	@cd $(BACKEND_DIR) && make itest
	@echo "$(GREEN)✅ Integration tests completed$(NC)"

## Generate and serve API documentation
docs:
	@echo "$(BLUE)📚 Generating API documentation...$(NC)"
	@cd $(BACKEND_DIR) && make swagger
	@echo "$(GREEN)✅ API documentation generated$(NC)"
	@echo "$(CYAN)📖 Documentation available at: http://localhost:8080/swagger/index.html$(NC)"

## Quick development setup for new contributors
quick-start: install migrate-seed
	@echo "$(GREEN)🎉 Quick start completed!$(NC)"
	@echo "$(CYAN)🎨 Frontend: http://localhost:3000$(NC)"
	@echo "$(CYAN)🔧 Backend API: http://localhost:8080$(NC)"
	@echo "$(CYAN)📖 API Docs: http://localhost:8080/swagger/index.html$(NC)"
	@echo "$(CYAN)💡 Run 'make dev' to start development servers$(NC)"

## Check prerequisites and environment
check-env:
	@echo "$(BLUE)🔍 Checking environment and prerequisites...$(NC)"
	@echo ""
	@echo "$(CYAN)Checking required tools:$(NC)"
	@command -v node >/dev/null 2>&1 && echo "$(GREEN)✅ Node.js$(NC)" || echo "$(RED)❌ Node.js not found$(NC)"
	@command -v pnpm >/dev/null 2>&1 && echo "$(GREEN)✅ pnpm$(NC)" || echo "$(RED)❌ pnpm not found$(NC)"
	@command -v docker >/dev/null 2>&1 && echo "$(GREEN)✅ Docker$(NC)" || echo "$(RED)❌ Docker not found$(NC)"
	@command -v docker-compose >/dev/null 2>&1 && echo "$(GREEN)✅ Docker Compose$(NC)" || echo "$(RED)❌ Docker Compose not found$(NC)"
	@command -v curl >/dev/null 2>&1 && echo "$(GREEN)✅ curl$(NC)" || echo "$(RED)❌ curl not found$(NC)"
	@command -v jq >/dev/null 2>&1 && echo "$(GREEN)✅ jq$(NC)" || echo "$(RED)❌ jq not found (optional)$(NC)"
	@echo ""
	@echo "$(CYAN)Checking project structure:$(NC)"
	@test -d $(FRONTEND_DIR) && echo "$(GREEN)✅ Frontend directory$(NC)" || echo "$(RED)❌ Frontend directory missing$(NC)"
	@test -d $(BACKEND_DIR) && echo "$(GREEN)✅ Backend directory$(NC)" || echo "$(RED)❌ Backend directory missing$(NC)"
	@test -f $(FRONTEND_DIR)/package.json && echo "$(GREEN)✅ Frontend package.json$(NC)" || echo "$(RED)❌ Frontend package.json missing$(NC)"
	@test -f $(BACKEND_DIR)/package.json && echo "$(GREEN)✅ Backend package.json$(NC)" || echo "$(RED)❌ Backend package.json missing$(NC)"
	@command -v pnpm >/dev/null 2>&1 && echo "$(GREEN)✅ pnpm$(NC)" || echo "$(RED)❌ pnpm not found$(NC)"

## Show project information and useful URLs
info:
	@echo "$(CYAN)Notify Chat Application - Project Information$(NC)"
	@echo "=============================================="
	@echo ""
	@echo "$(YELLOW)Project Structure:$(NC)"
	@echo "  📁 $(FRONTEND_DIR)/     - Next.js frontend application"
	@echo "  📁 $(BACKEND_DIR)/      - Express + TypeScript backend service"
	@echo "  📁 packages/            - Shared packages (types, validators, shared)"
	@echo ""
	@echo "$(YELLOW)Development URLs:$(NC)"
	@echo "  🎨 Frontend:            http://localhost:3000"
	@echo "  🔧 Backend API:         http://localhost:8080"
	@echo "  📚 API Documentation:   http://localhost:8080/swagger/index.html"
	@echo ""
	@echo "$(YELLOW)Useful Commands:$(NC)"
	@echo "  make help              - Show all available commands"
	@echo "  make check-env         - Check prerequisites"
	@echo "  make quick-start       - Complete setup for new contributors"
	@echo "  make dev               - Start development environment"
	@echo "  make health            - Check service health"

# =============================================================================
# ERROR HANDLING & VALIDATION
# =============================================================================

## Validate that required directories exist
validate-dirs:
	@test -d $(FRONTEND_DIR) || (echo "$(RED)❌ Frontend directory not found: $(FRONTEND_DIR)$(NC)" && exit 1)
	@test -d $(BACKEND_DIR) || (echo "$(RED)❌ Backend directory not found: $(BACKEND_DIR)$(NC)" && exit 1)

# Add validation to frontend commands
frontend-install: validate-dirs
frontend-dev: validate-dirs
frontend-build: validate-dirs

# Add validation to backend commands
backend-install: validate-dirs
backend-dev: validate-dirs
backend-build: validate-dirs

# =============================================================================
# PHONY TARGETS
# =============================================================================

.PHONY: help frontend-install frontend-dev frontend-build frontend-test frontend-lint \
        backend-install backend-dev backend-build backend-test migrate seed migrate-seed \
        install dev test build clean health status setup \
        db-reset dev-tools integration-test docs quick-start check-env info \
        validate-dirs
