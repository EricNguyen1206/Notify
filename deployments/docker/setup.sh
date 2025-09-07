#!/bin/bash

# =============================================================================
# Notify Chat Application - Production Setup Script
# =============================================================================
# This script sets up the Notify Chat application for production deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Notify Chat Application - Production Setup${NC}"
echo "=================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose > /dev/null 2>&1 && ! docker compose version > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker Compose is not available. Please install Docker Compose.${NC}"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from template...${NC}"
    if [ -f env.example ]; then
        cp env.example .env
        echo -e "${GREEN}✅ Created .env file from template${NC}"
        echo -e "${YELLOW}⚠️  IMPORTANT: Please edit .env file with your production values before continuing!${NC}"
        echo -e "${YELLOW}   Especially change:${NC}"
        echo -e "${YELLOW}   - NOTIFY_JWT_SECRET${NC}"
        echo -e "${YELLOW}   - POSTGRES_PASSWORD${NC}"
        echo -e "${YELLOW}   - ALLOWED_ORIGINS${NC}"
        echo ""
        read -p "Press Enter after you have updated the .env file..."
    else
        echo -e "${RED}❌ env.example file not found. Cannot create .env file.${NC}"
        exit 1
    fi
fi

# Validate .env file
echo -e "${BLUE}🔍 Validating environment configuration...${NC}"
source .env

if [ "$NOTIFY_JWT_SECRET" = "your-super-secure-jwt-secret-key-change-this-in-production" ]; then
    echo -e "${RED}❌ Please change NOTIFY_JWT_SECRET in .env file${NC}"
    exit 1
fi

if [ "$POSTGRES_PASSWORD" = "postgres" ]; then
    echo -e "${YELLOW}⚠️  Using default PostgreSQL password. Consider changing it for production.${NC}"
fi

echo -e "${GREEN}✅ Environment configuration validated${NC}"

# Create necessary directories
echo -e "${BLUE}📁 Creating necessary directories...${NC}"
mkdir -p backups
mkdir -p logs
echo -e "${GREEN}✅ Directories created${NC}"

# Build and start services
echo -e "${BLUE}🏗️  Building Docker images...${NC}"
docker compose build --no-cache

echo -e "${BLUE}🚀 Starting services...${NC}"
docker compose up -d

# Wait for services to be ready
echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"
sleep 10

# Check service health
echo -e "${BLUE}🏥 Checking service health...${NC}"
docker compose ps

# Run database migrations
echo -e "${BLUE}🗄️  Running database migrations...${NC}"
cd ../../chat-service
make migrate-up
cd ../deployments/docker

# Seed database with initial data
echo -e "${BLUE}🌱 Seeding database...${NC}"
cd ../../chat-service
make seed-db
cd ../deployments/docker

# Test connectivity
echo -e "${BLUE}🔍 Testing application connectivity...${NC}"
./test-connection.sh

echo ""
echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Application Information:${NC}"
echo -e "   🌐 Frontend: http://localhost"
echo -e "   🔧 Backend API: http://localhost/api"
echo -e "   📚 API Docs: http://localhost/swagger/"
echo -e "   🗄️  Database: localhost:5433 (postgres/${POSTGRES_PASSWORD})"
echo -e "   ⚡ Redis: localhost:6380"
echo ""
echo -e "${BLUE}🔐 Default Test Credentials:${NC}"
echo -e "   Email: admin@notify.com"
echo -e "   Password: 123456"
echo ""
echo -e "${BLUE}📝 Useful Commands:${NC}"
echo -e "   View logs: docker compose logs -f"
echo -e "   Stop services: docker compose down"
echo -e "   Restart services: docker compose restart"
echo -e "   Test auth: ./test-auth.sh"
echo ""
echo -e "${YELLOW}⚠️  Production Security Checklist:${NC}"
echo -e "   ✅ Change JWT secret"
echo -e "   ✅ Change database password"
echo -e "   ✅ Configure proper CORS origins"
echo -e "   ⚠️  Enable SSL/HTTPS"
echo -e "   ⚠️  Configure firewall rules"
echo -e "   ⚠️  Set up monitoring and logging"
echo -e "   ⚠️  Regular security updates"
