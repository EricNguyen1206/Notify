# Notify Chat Application - Docker Deployment

This directory contains all the necessary files for deploying the Notify Chat Application using Docker and Docker Compose.

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- At least 4GB of available RAM
- Ports 80, 3000, 8080, 5432, 6379 available

### 1. Setup Environment

```bash
# Copy environment template
cp env.example .env

# Edit .env file with your configuration
nano .env
```

**Important**: Change the following values in `.env`:
- `NOTIFY_JWT_SECRET` - Use a strong, random secret
- `POSTGRES_PASSWORD` - Use a secure password
- `ALLOWED_ORIGINS` - Update with your domain

### 2. Deploy Application

```bash
# Run automated setup
./setup.sh

# Or manually:
docker compose build
docker compose up -d
```

### 3. Access Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost/api
- **API Documentation**: http://localhost/swagger/
- **Database**: localhost:5433 (postgres/your_password)
- **Redis**: localhost:6380

## 📁 Files Overview

### Core Files
- `docker-compose.yml` - Main Docker Compose configuration
- `docker-compose.prod.yml` - Production-optimized overrides
- `env.example` - Environment variables template
- `setup.sh` - Automated setup script

### Scripts
- `test-connection.sh` - Test frontend-backend connectivity
- `test-auth.sh` - Test authentication flow
- `backup.sh` - Database backup script
- `restore.sh` - Database restore script

### Configuration
- `../nginx.conf` - Nginx reverse proxy configuration
- `../nginx-ssl.conf` - Nginx with SSL/HTTPS support

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Application environment | `production` |
| `NEXT_PUBLIC_API_URL` | Frontend API URL | `http://localhost/api` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | `ws://localhost/ws` |
| `NOTIFY_JWT_SECRET` | JWT signing secret | **CHANGE THIS** |
| `POSTGRES_PASSWORD` | Database password | **CHANGE THIS** |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost` |

### Service Ports

| Service | Internal Port | External Port | Description |
|---------|---------------|---------------|-------------|
| Frontend | 3000 | 3000 | Next.js application |
| Backend | 8080 | 8080 | Go API server |
| Nginx | 80 | 80 | Reverse proxy |
| PostgreSQL | 5432 | 5433 | Database |
| Redis | 6379 | 6380 | Cache |

## 🛠️ Development vs Production

### Development Mode
```bash
# Use development environment
cp env.example .env
# Edit .env to use development settings
docker compose up -d
```

### Production Mode
```bash
# Use production configuration
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 📊 Monitoring & Health Checks

### Health Endpoints
- Frontend: http://localhost:3000/api/health
- Backend: http://localhost:8080/kaithhealthcheck
- Nginx: http://localhost/health

### Check Service Status
```bash
# View all services
docker compose ps

# Check logs
docker compose logs -f [service-name]

# Test connectivity
./test-connection.sh

# Test authentication
./test-auth.sh
```

## 💾 Database Management

### Backup Database
```bash
./backup.sh
```

### Restore Database
```bash
./restore.sh backups/notify_chat_backup_YYYYMMDD_HHMMSS.sql
```

### Manual Database Access
```bash
# Connect to PostgreSQL
docker compose exec db psql -U postgres -d notify_chat

# Connect to Redis
docker compose exec redis redis-cli
```

## 🔒 Security Features

### Implemented
- ✅ JWT Authentication
- ✅ Password Hashing (bcrypt)
- ✅ CORS Configuration
- ✅ Rate Limiting
- ✅ Security Headers
- ✅ Non-root Containers
- ✅ Health Checks

### Production Checklist
- ⚠️ Change default passwords
- ⚠️ Use strong JWT secrets
- ⚠️ Enable SSL/HTTPS
- ⚠️ Configure firewall rules
- ⚠️ Set up monitoring
- ⚠️ Regular security updates

## 🚀 SSL/HTTPS Setup

### 1. Generate SSL Certificates
```bash
# Create SSL directory
mkdir ssl

# Generate self-signed certificate (for testing)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem
```

### 2. Update Docker Compose
```bash
# Use SSL configuration
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 3. Update Nginx Configuration
```bash
# Copy SSL configuration
cp ../nginx-ssl.conf ../nginx.conf
docker compose restart nginx
```

## 🔧 Troubleshooting

### Common Issues

**Services not starting:**
```bash
# Check logs
docker compose logs [service-name]

# Restart specific service
docker compose restart [service-name]
```

**Database connection issues:**
```bash
# Check database health
docker compose exec db pg_isready -U postgres

# Run migrations manually
cd ../../chat-service && make migrate-up
```

**Frontend build issues:**
```bash
# Rebuild frontend
docker compose build --no-cache frontend
```

**CORS errors:**
```bash
# Check CORS configuration
docker compose exec app printenv | grep ALLOWED_ORIGINS
```

### Reset Everything
```bash
# Stop and remove all containers
docker compose down -v

# Remove all images
docker compose down --rmi all

# Start fresh
./setup.sh
```

## 📈 Scaling

### Horizontal Scaling
```bash
# Scale backend services
docker compose up -d --scale app=3
```

### Resource Limits
Edit `docker-compose.prod.yml` to set resource limits:
```yaml
deploy:
  resources:
    limits:
      memory: 1G
      cpus: '1.0'
```

## 📞 Support

For issues and questions:
1. Check the logs: `docker compose logs -f`
2. Verify environment configuration
3. Check service health endpoints
4. Review the main project README.md

## 🔄 Updates

### Update Application
```bash
# Pull latest changes
git pull

# Rebuild and restart
docker compose build
docker compose up -d
```

### Update Dependencies
```bash
# Update backend dependencies
cd ../../chat-service && go mod tidy

# Update frontend dependencies
cd ../../frontend && npm update

# Rebuild containers
docker compose build
```
