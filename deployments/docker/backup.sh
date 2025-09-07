#!/bin/bash

# =============================================================================
# Notify Chat Application - Database Backup Script
# =============================================================================
# This script creates a backup of the PostgreSQL database

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env ]; then
    source .env
else
    echo -e "${RED}❌ .env file not found. Please run setup.sh first.${NC}"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p backups

# Generate backup filename with timestamp
BACKUP_FILE="backups/notify_chat_backup_$(date +%Y%m%d_%H%M%S).sql"

echo -e "${BLUE}🗄️  Creating database backup...${NC}"
echo -e "   Database: ${POSTGRES_DB}"
echo -e "   Backup file: ${BACKUP_FILE}"

# Create backup
docker compose exec -T db pg_dump -U ${POSTGRES_USER} -d ${POSTGRES_DB} > ${BACKUP_FILE}

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup created successfully: ${BACKUP_FILE}${NC}"
    
    # Get backup file size
    BACKUP_SIZE=$(du -h ${BACKUP_FILE} | cut -f1)
    echo -e "   Size: ${BACKUP_SIZE}"
    
    # Keep only last 7 backups (optional cleanup)
    echo -e "${BLUE}🧹 Cleaning up old backups (keeping last 7)...${NC}"
    ls -t backups/notify_chat_backup_*.sql | tail -n +8 | xargs -r rm -f
    
    echo -e "${GREEN}✅ Backup completed successfully!${NC}"
else
    echo -e "${RED}❌ Backup failed!${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📋 Backup Information:${NC}"
echo -e "   File: ${BACKUP_FILE}"
echo -e "   Size: ${BACKUP_SIZE}"
echo -e "   Date: $(date)"
echo ""
echo -e "${BLUE}📝 To restore from backup:${NC}"
echo -e "   ./restore.sh ${BACKUP_FILE}"
