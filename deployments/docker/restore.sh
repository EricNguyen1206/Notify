#!/bin/bash

# =============================================================================
# Notify Chat Application - Database Restore Script
# =============================================================================
# This script restores the PostgreSQL database from a backup file
# Usage: ./restore.sh <backup_file>

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if backup file is provided
if [ $# -eq 0 ]; then
    echo -e "${RED}❌ Please provide a backup file path${NC}"
    echo -e "${BLUE}Usage: ./restore.sh <backup_file>${NC}"
    echo ""
    echo -e "${BLUE}Available backups:${NC}"
    ls -la backups/notify_chat_backup_*.sql 2>/dev/null || echo "   No backups found"
    exit 1
fi

BACKUP_FILE=$1

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Backup file not found: ${BACKUP_FILE}${NC}"
    exit 1
fi

# Load environment variables
if [ -f .env ]; then
    source .env
else
    echo -e "${RED}❌ .env file not found. Please run setup.sh first.${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  WARNING: This will replace all data in the database!${NC}"
echo -e "   Database: ${POSTGRES_DB}"
echo -e "   Backup file: ${BACKUP_FILE}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo -e "${YELLOW}❌ Restore cancelled${NC}"
    exit 0
fi

echo -e "${BLUE}🗄️  Restoring database from backup...${NC}"

# Stop the application to prevent data corruption
echo -e "${BLUE}⏹️  Stopping application services...${NC}"
docker compose stop app frontend

# Restore database
echo -e "${BLUE}🔄 Restoring database...${NC}"
docker compose exec -T db psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} < ${BACKUP_FILE}

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database restored successfully!${NC}"
else
    echo -e "${RED}❌ Database restore failed!${NC}"
    echo -e "${BLUE}🔄 Restarting application services...${NC}"
    docker compose start app frontend
    exit 1
fi

# Restart application services
echo -e "${BLUE}🔄 Restarting application services...${NC}"
docker compose start app frontend

# Wait for services to be ready
echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"
sleep 10

# Test connectivity
echo -e "${BLUE}🔍 Testing application connectivity...${NC}"
./test-connection.sh

echo ""
echo -e "${GREEN}🎉 Database restore completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Restore Information:${NC}"
echo -e "   Backup file: ${BACKUP_FILE}"
echo -e "   Database: ${POSTGRES_DB}"
echo -e "   Date: $(date)"
echo ""
echo -e "${BLUE}🌐 Application should be accessible at: http://localhost${NC}"
