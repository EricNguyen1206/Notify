# Notify Chat Application - Deployment Guide

This directory contains all the deployment configurations for the Notify Chat Application.

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- At least 4GB of available RAM
- Ports 80, 3000, 8080, 5432, 6379 available

### 1. Clone and Navigate

```bash
git clone <repository-url>
cd Notify/deployments/docker
```

### 2. Environment Setup

#### For Development

```bash
# Copy the development environment file
cp .env.development .env

# Or copy from example and customize
cp .env.example .env
nano .env
```

#### For Production

```bash
# Copy the production template
cp .env.production .env

# CRITICAL: Replace all placeholder values with actual secrets
# Use a secure method to inject production secrets
nano .env
```

#### Environment-Specific Deployment

```bash
# Development deployment
docker compose --env-file .env.development up -d

# Production deployment
docker compose --env-file .env.production up -d

# Default (uses .env file)
docker compose up -d
```

### 3. Deploy All Services

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/swagger/index.html
- **Database**: localhost:5432 (postgres/postgres)
- **Redis**: localhost:6379

## Architecture Overview

The deployment includes the following services:

### Frontend (Next.js)

- **Container**: `notify-frontend`
- **Port**: 3000
- **Features**:
  - Multi-stage Docker build for optimization
  - Standalone output for minimal runtime
  - Health checks enabled
  - Non-root user for security

### Backend (Go Chat Service)

- **Container**: `notify-chat-service`
- **Port**: 8080
- **Features**:
  - RESTful API with Swagger documentation
  - WebSocket support for real-time messaging
  - JWT authentication
  - Health checks enabled

### Nginx Reverse Proxy

- **Container**: `notify-nginx`
- **Port**: 80
- **Features**:
  - Routes frontend and API traffic
  - WebSocket proxy support
  - CORS handling
  - Static asset caching
  - Security headers

### PostgreSQL Database

- **Container**: `notify-chat-db`
- **Port**: 5432
- **Features**:
  - Persistent data storage
  - Automatic migrations on startup

### Redis Cache

- **Container**: `notify-chat-redis`
- **Port**: 6379
- **Features**:
  - Session storage
  - Real-time data caching
  - WebSocket scaling support

## Configuration Files

### docker-compose.yml

Main orchestration file that defines all services, networks, and volumes.

### nginx.conf

Nginx reverse proxy configuration with:

- Frontend routing
- API proxying
- WebSocket support
- Security headers
- CORS handling

### .env.example

Template for environment variables with secure defaults.

## Development vs Production

### Development

```bash
# Use development mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### Production

```bash
# Use production configuration
docker-compose up -d

# Scale services if needed
docker-compose up -d --scale app=3
```

## Troubleshooting

### Common Issues

**Services not starting:**

```bash
# Check logs
docker-compose logs <service-name>

# Restart specific service
docker-compose restart <service-name>
```

**Database connection issues:**

```bash
# Check database is ready
docker-compose exec db pg_isready -U postgres

# Run database migrations manually
docker-compose exec app ./main migrate
```

**Frontend build issues:**

```bash
# Rebuild frontend
docker-compose build --no-cache frontend
```

### Health Checks

All services include health checks. Check status:

```bash
docker-compose ps
```

### Logs

View logs for debugging:

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f app
docker-compose logs -f nginx
```

## Security Considerations

### Production Deployment

1. **Change default passwords** in `.env` file
2. **Use strong JWT secrets**
3. **Enable HTTPS** with SSL certificates
4. **Configure firewall** rules
5. **Regular security updates**

### Environment Variables

Never commit `.env` files with production secrets to version control.

## Monitoring

### Service Health

- Frontend: http://localhost:3000/api/health
- Backend: http://localhost:8080/api/health
- Database: `docker-compose exec db pg_isready`
- Redis: `docker-compose exec redis redis-cli ping`

### Performance

Monitor resource usage:

```bash
docker stats
```

## Backup and Recovery

### Database Backup

```bash
docker-compose exec db pg_dump -U postgres postgres > backup.sql
```

### Database Restore

```bash
docker-compose exec -T db psql -U postgres postgres < backup.sql
```

## Scaling

### Horizontal Scaling

```bash
# Scale backend services
docker-compose up -d --scale app=3

# Scale with load balancer
docker-compose -f docker-compose.yml -f docker-compose.scale.yml up -d
```

## Support

For issues and questions:

1. Check the logs: `docker-compose logs -f`
2. Verify environment configuration
3. Check service health endpoints
4. Review the main project README.md
