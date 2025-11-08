# 🛠️ Makefile Guide - Notify Chat Application

This guide provides comprehensive documentation for the root-level Makefile that streamlines all development workflows for the Notify Chat Application.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Command Categories](#command-categories)
- [Development Workflows](#development-workflows)
- [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

### For New Contributors

```bash
# Complete setup in one command
make quick-start
```

This will:
1. Install all dependencies (frontend + backend)
2. Start all services with Docker
3. Run database migrations
4. Seed database with test data
5. Display access URLs

### For Daily Development

```bash
# Check environment
make check-env

# Start development
make dev

# Check service health
make health
```

## ✅ Prerequisites

Run `make check-env` to verify you have:

- **Node.js** (v18+) and npm
- **Go** (v1.21+)
- **Docker** and Docker Compose
- **curl** (for health checks)
- **jq** (optional, for JSON formatting)

## 📚 Command Categories

### 🎨 Frontend Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `frontend-install` | Install frontend dependencies | `make frontend-install` |
| `frontend-dev` | Start development server | `make frontend-dev` |
| `frontend-build` | Build for production | `make frontend-build` |
| `frontend-test` | Run tests | `make frontend-test` |
| `frontend-lint` | Run linting | `make frontend-lint` |

### ⚙️ Backend Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `backend-install` | Install dependencies | `make backend-install` |
| `backend-dev` | Start with live reload | `make backend-dev` |
| `backend-build` | Build binary | `make backend-build` |
| `backend-test` | Run tests | `make backend-test` |
| `integration-test` | Run integration tests | `make integration-test` |

### 📡 API Development

| Command | Description | Usage |
|---------|-------------|-------|
| `api-sync` | Sync OpenAPI docs from backend | `make api-sync` |
| `api-generate` | Generate TypeScript client | `make api-generate` |
| `api-full` | Complete API workflow | `make api-full` |

### 🗄️ Database Operations

| Command | Description | Usage |
|---------|-------------|-------|
| `migrate` | Run database migrations | `make migrate` |
| `seed` | Seed with test data | `make seed` |
| `migrate-seed` | Run migrations + seed | `make migrate-seed` |
| `db-reset` | Reset database (DESTRUCTIVE) | `make db-reset` |

### 🐳 Docker & Deployment

| Command | Description | Usage |
|---------|-------------|-------|
| `docker-build` | Build all images | `make docker-build` |
| `docker-up` | Start all services | `make docker-up` |
| `docker-down` | Stop all services | `make docker-down` |
| `docker-logs` | View service logs | `make docker-logs` |
| `docker-clean` | Clean containers/volumes | `make docker-clean` |

### 🔧 Development Workflow

| Command | Description | Usage |
|---------|-------------|-------|
| `install` | Install all dependencies | `make install` |
| `dev` | Start frontend + backend | `make dev` |
| `test` | Run all tests | `make test` |
| `build` | Build frontend + backend | `make build` |
| `clean` | Clean build artifacts | `make clean` |

### 🔍 Utility Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `health` | Check service health | `make health` |
| `status` | Show Docker status | `make status` |
| `info` | Show project info | `make info` |
| `docs` | Generate API docs | `make docs` |
| `dev-tools` | Install dev tools | `make dev-tools` |
| `help` | Show all commands | `make help` |

## 🔄 Development Workflows

### Starting Development

```bash
# 1. Check prerequisites
make check-env

# 2. Install dependencies
make install

# 3. Start services
make docker-up

# 4. Setup database
make migrate-seed

# 5. Start development servers
make dev
```

### API Development Workflow

```bash
# 1. Make changes to Go backend API
# 2. Sync OpenAPI documentation
make api-sync

# 3. Generate TypeScript client
make api-generate

# 4. Use new API in frontend with type safety
```

### Testing Workflow

```bash
# Run all tests
make test

# Run specific tests
make backend-test
make frontend-test
make integration-test

# Check service health
make health
```

### Production Build

```bash
# Build applications
make build

# Build Docker images
make docker-build

# Deploy with Docker
make docker-up
```

## 🌐 Service URLs

When services are running:

- **Main Application**: http://localhost:80
- **Frontend (Direct)**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/swagger/index.html
- **Database**: localhost:5433 (postgres/postgres)
- **Redis**: localhost:6380

## 🛠️ Troubleshooting

### Common Issues

**Docker not running:**
```bash
# Check Docker status
make check-env

# Start Docker and try again
make docker-up
```

**Port conflicts:**
```bash
# Check what's using ports
lsof -i :3000
lsof -i :8080
lsof -i :80

# Stop conflicting services or change ports in docker-compose.yml
```

**Database connection issues:**
```bash
# Reset database
make db-reset

# Or restart services
make docker-down
make docker-up
```

**Frontend build issues:**
```bash
# Clean and reinstall
make clean
make frontend-install
make frontend-build
```

**Backend build issues:**
```bash
# Clean and rebuild
make clean
make backend-install
make backend-build
```

### Getting Help

```bash
# Show all available commands
make help

# Show project information
make info

# Check environment and prerequisites
make check-env

# Check service health
make health
```

## 🎯 Best Practices

1. **Always run `make check-env` first** on new machines
2. **Use `make quick-start`** for complete setup
3. **Run `make health`** to verify services are working
4. **Use `make api-full`** after backend API changes
5. **Run `make test`** before committing changes
6. **Use `make docker-clean`** to free up disk space

## 📝 Notes

- All commands work from the project root directory
- Commands include colored output for better visibility
- Error handling provides helpful suggestions
- Validation ensures prerequisites are met
- Commands are designed to be idempotent when possible

For more detailed information about specific components, see:
- [Frontend README](../apps/web/README.md)
- [Backend README](../apps/api/README.md)
- [Deployment Guide](./DEPLOYMENT.md)
