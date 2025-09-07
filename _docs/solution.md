# Solution Documentation - Notify Chat Application

## Tổng quan Kiến trúc

### 1. Kiến trúc Tổng thể
Ứng dụng Notify Chat là một realtime chat application với kiến trúc microservices, bao gồm:

- **Frontend**: Next.js 15 với React 19, TypeScript
- **Backend**: Go với Gin framework, WebSocket support
- **Database**: PostgreSQL cho data persistence
- **Cache**: Redis cho session management và real-time scaling
- **Proxy**: Nginx reverse proxy cho production deployment
- **Containerization**: Docker với multi-stage builds

### 2. Technology Stack Chi tiết

#### Backend (chat-service/)
- **Language**: Go 1.23
- **Framework**: Gin (HTTP web framework)
- **ORM**: GORM với PostgreSQL driver
- **WebSocket**: Gorilla WebSocket
- **Authentication**: JWT tokens
- **Cache**: Redis với go-redis client
- **Configuration**: Viper
- **Documentation**: Swagger/OpenAPI với swaggo
- **Development**: Air cho live reload

#### Frontend (frontend/)
- **Framework**: Next.js 15 với App Router
- **Language**: TypeScript
- **UI Library**: Radix UI components
- **Styling**: Tailwind CSS với custom design system
- **State Management**: Zustand
- **HTTP Client**: Axios với React Query (TanStack Query)
- **WebSocket**: Native WebSocket API
- **API Generation**: Orval (từ OpenAPI spec)
- **Authentication**: JWT với cookie storage
- **Theme**: next-themes cho dark/light mode

#### Infrastructure
- **Containerization**: Docker với multi-stage builds
- **Orchestration**: Docker Compose
- **Reverse Proxy**: Nginx
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Build Tools**: Makefile automation

### 3. Kiến trúc Backend

#### Cấu trúc Thư mục
```
chat-service/
├── cmd/server/main.go          # Entry point
├── internal/
│   ├── api/                    # HTTP handlers & middleware
│   ├── config/                 # Configuration management
│   ├── database/               # DB connections (PostgreSQL, Redis)
│   ├── models/                 # Data models & DTOs
│   ├── repositories/           # Data access layer
│   ├── services/               # Business logic
│   ├── utils/                  # Utility functions
│   └── websocket/              # WebSocket management
├── docs/                       # Swagger documentation
└── Makefile                    # Build automation
```

#### Kiến trúc Layered
1. **Handlers Layer**: HTTP request handling với Gin
2. **Services Layer**: Business logic và validation
3. **Repository Layer**: Data access với GORM
4. **Database Layer**: PostgreSQL + Redis

#### WebSocket Architecture
- **Hub Pattern**: Central WebSocket connection manager
- **Client Management**: Per-user WebSocket connections
- **Channel-based Messaging**: Users join/leave channels
- **Real-time Broadcasting**: Messages broadcast to channel members
- **Redis Integration**: For horizontal scaling (future)

### 4. Kiến trúc Frontend

#### Cấu trúc Thư mục
```
frontend/src/
├── app/                        # Next.js App Router
├── components/
│   ├── atoms/                  # Basic UI components
│   ├── molecules/              # Composite components
│   ├── organisms/              # Complex components
│   ├── templates/              # Layout templates
│   └── ui/                     # Shadcn/UI components
├── hooks/                      # Custom React hooks
├── lib/                        # Utilities & configurations
├── services/                   # API clients & schemas
├── store/                      # Zustand state management
└── types/                      # TypeScript type definitions
```

#### State Management
- **Zustand**: Global state management
  - `useAuthStore`: Authentication state
  - `useSocketStore`: WebSocket connection state
  - `useChatStore`: Chat messages state
  - `useChannelStore`: Channel management state

#### API Integration
- **Orval**: Auto-generate TypeScript clients từ OpenAPI
- **React Query**: Server state management và caching
- **Axios**: HTTP client với interceptors

### 5. Database Schema

#### PostgreSQL Tables
- **users**: User accounts với authentication
- **channels**: Chat channels (direct/group)
- **chats**: Messages với foreign keys
- **channel_members**: Many-to-many relationship

#### Redis Usage
- **Session Storage**: User authentication tokens
- **Online Status**: Real-time user presence
- **Rate Limiting**: API request throttling
- **Channel Membership**: Active channel participants
- **Pub/Sub**: Real-time message broadcasting (future scaling)

### 6. Deployment Architecture

#### Docker Setup
- **Multi-stage Builds**: Optimized container images
- **Non-root Users**: Security best practices
- **Health Checks**: Container orchestration support
- **Environment Variables**: Configuration management

#### Services
1. **Frontend**: Next.js app trên port 3000
2. **Backend**: Go API server trên port 8080
3. **Nginx**: Reverse proxy trên port 80
4. **PostgreSQL**: Database trên port 5432
5. **Redis**: Cache trên port 6379

#### Network
- **Docker Network**: Isolated communication
- **Service Discovery**: Container-to-container communication
- **Load Balancing**: Nginx proxy configuration

### 7. Build & Development Workflow

#### Development
```bash
# Backend development
make backend-dev          # Live reload với Air
make backend-test         # Unit tests
make migrate-seed         # Database setup

# Frontend development  
make frontend-dev         # Next.js dev server
make frontend-lint        # ESLint checking
make api-sync             # Sync OpenAPI docs

# Full development
make dev                  # Both frontend & backend
```

#### Production Build
```bash
# Build all services
make build                # Frontend + Backend
make docker-build         # Docker images
make docker-up            # Deploy with Docker Compose
```

#### API Documentation
- **Swagger UI**: http://localhost:8080/swagger/index.html
- **Auto-generation**: Từ Go code comments
- **Frontend Sync**: OpenAPI 3.0.1 cho TypeScript generation

### 8. Security Features

#### Authentication
- **JWT Tokens**: Stateless authentication
- **Password Hashing**: bcrypt với salt
- **Session Management**: Redis-based sessions
- **CORS**: Cross-origin request handling

#### API Security
- **Rate Limiting**: Redis-based throttling
- **Input Validation**: Request validation middleware
- **SQL Injection**: GORM ORM protection
- **XSS Protection**: Input sanitization

### 9. Performance Optimizations

#### Backend
- **Connection Pooling**: Database connection management
- **Redis Caching**: Session và data caching
- **Goroutine Concurrency**: WebSocket handling
- **Memory Management**: Efficient Go memory usage

#### Frontend
- **Next.js Optimization**: App Router, Image optimization
- **Code Splitting**: Dynamic imports
- **State Management**: Efficient Zustand stores
- **WebSocket**: Native browser WebSocket API

### 10. Monitoring & Health Checks

#### Health Endpoints
- **Frontend**: `/api/health`
- **Backend**: `/kaithhealthcheck`
- **Database**: Connection health checks
- **Redis**: Ping/pong health checks

#### Logging
- **Structured Logging**: slog trong Go
- **Request Logging**: Middleware logging
- **Error Tracking**: Centralized error handling

### 11. Production Deployment Setup

#### Docker Configuration
- **Multi-stage Builds**: Optimized container images
- **Non-root Users**: Security best practices
- **Health Checks**: Container orchestration support
- **Resource Limits**: Production resource constraints
- **Environment Variables**: Secure configuration management

#### Services Architecture
1. **Frontend**: Next.js app (port 3000, internal only in production)
2. **Backend**: Go API server (port 8080, internal only in production)
3. **Nginx**: Reverse proxy (ports 80/443)
4. **PostgreSQL**: Database (port 5432, internal only in production)
5. **Redis**: Cache (port 6379, internal only in production)

#### Production Features
- **SSL/HTTPS Support**: Nginx với SSL certificates
- **Rate Limiting**: API và WebSocket rate limiting
- **Security Headers**: Comprehensive security headers
- **Static Asset Caching**: 1-year cache cho static files
- **Database Backups**: Automated backup system
- **Health Monitoring**: Comprehensive health checks
- **Resource Management**: CPU và memory limits

#### Environment Configurations
- **Development**: Direct backend access, relaxed CORS
- **Production**: Nginx proxy, strict security, SSL/HTTPS
- **Environment Files**: Separate configs cho dev/prod

#### Deployment Scripts
- **setup.sh**: Automated setup script
- **backup.sh**: Database backup automation
- **restore.sh**: Database restore functionality
- **test-connection.sh**: Connectivity testing
- **test-auth.sh**: Authentication flow testing

#### Security Features
- **JWT Authentication**: Secure token-based auth
- **CORS Configuration**: Proper cross-origin handling
- **Rate Limiting**: Protection against abuse
- **SSL/TLS**: Encrypted communication
- **Security Headers**: XSS, CSRF protection
- **Non-root Containers**: Container security

#### Deployment Files Created
- **docker-compose.yml**: Main Docker Compose configuration với health checks
- **docker-compose.prod.yml**: Production-optimized overrides với resource limits
- **env.example**: Environment variables template
- **setup.sh**: Automated setup script với validation
- **backup.sh**: Database backup automation
- **restore.sh**: Database restore functionality
- **test-connection.sh**: Connectivity testing
- **test-auth.sh**: Authentication flow testing
- **test-deployment.sh**: Comprehensive deployment testing
- **nginx-ssl.conf**: Nginx configuration với SSL/HTTPS support
- **README.md**: Complete deployment documentation

#### Production Ready Features
- **Multi-stage Docker builds** cho optimized images
- **Health checks** cho tất cả services
- **Resource limits** và monitoring
- **Automated backup/restore** system
- **SSL/HTTPS support** với Let's Encrypt
- **Rate limiting** và security headers
- **Comprehensive testing** scripts
- **Environment separation** (dev/prod)
- **Database persistence** với volumes
- **Log management** và monitoring

## Tạo README.md Mới cho Project

### Thay đổi đã thực hiện:

#### 1. Xóa README.md cũ
- Đã xóa README.md cũ trong root folder
- Loại bỏ nội dung cũ không phù hợp với yêu cầu

#### 2. Tạo README.md mới với đầy đủ thông tin
- **Project Summary**: Tóm tắt về ứng dụng real-time chat
- **Highlight Features**: Các tính năng nổi bật với performance metrics
- **Performance Metrics**: 
  - Concurrent Users: 10,000+ simultaneous connections
  - Messages per Second: 1,000+ messages/second
  - API Requests: 5,000+ requests/second
  - WebSocket Connections: 10,000+ concurrent connections
  - Response Time: < 100ms for API calls, < 50ms for WebSocket messages
- **High-Level Design**: Mermaid diagram mô tả kiến trúc tổng thể
- **Detailed Design**: Links đến README files trong frontend và chat-service
- **Quick Start**: Hướng dẫn setup nhanh
- **Development**: Hướng dẫn development
- **Production Deployment**: Hướng dẫn deploy production
- **API Documentation**: Thông tin về API và WebSocket
- **Contributing**: Hướng dẫn đóng góp
- **License & Copyright**: MIT License với copyright information

#### 3. Tạo file LICENSE
- Tạo file LICENSE với MIT License
- Bao gồm copyright information
- Acknowledgment cho các third-party libraries

#### 4. Cấu trúc README.md mới
- **Badges**: Go, Next.js, Docker, License badges
- **Table of Contents**: Navigation dễ dàng
- **Mermaid Diagram**: High-level architecture visualization
- **Performance Metrics**: Detailed throughput estimates
- **Links to Detailed Documentation**: 
  - Backend: `./chat-service/README.md`
  - Frontend: `./frontend/README.md`
  - Deployment: `./deployments/README.md`
- **Quick Start Guide**: Step-by-step setup
- **Production Ready**: Complete deployment instructions
- **API Documentation**: Swagger/OpenAPI information
- **Contributing Guidelines**: Development workflow
- **License & Copyright**: MIT License với proper attribution

### Kết quả:
- README.md mới professional và comprehensive
- Bao gồm đầy đủ thông tin theo yêu cầu
- Mermaid diagram cho high-level design
- Performance metrics với estimates cụ thể
- Links đến detailed documentation
- MIT License với proper copyright
- Professional presentation với badges và formatting

## Cập nhật Home Page và Middleware

### Thay đổi đã thực hiện:

#### 1. Đơn giản hóa Home Page (`frontend/src/app/page.tsx`)
- Đã xóa toàn bộ nội dung phức tạp của home page
- Chỉ giữ lại một dummy page đơn giản với thông điệp "Welcome to Notify"
- Loại bỏ các import không cần thiết (Download icon, Image, Link, HomePageFooter, HomePageNavbar)
- Loại bỏ tất cả các section marketing và hero images

#### 2. Cập nhật Middleware (`frontend/src/middleware.ts`)
- Middleware đã được cấu hình để xử lý redirect cho home page một cách logic hơn
- Khi user truy cập vào root path (`/`):
  - **Nếu có token**: redirect tới `/messages` (user đã login)
  - **Nếu không có token**: redirect tới `/login` (user chưa login)
- Logic redirect hoạt động như sau:
  - Nếu user có token và truy cập `/` → redirect tới `/messages`
  - Nếu user không có token và truy cập `/` → redirect tới `/login`
  - Nếu user có token và truy cập auth pages → redirect tới `/messages`
  - Nếu user không có token và truy cập protected routes → redirect tới `/login`

## Implement Chức năng Edit Account

### Thay đổi Backend:

#### 3. Cập nhật Models (`chat-service/internal/models/user.go`)
- Thêm struct `UpdateProfileRequest` với các field:
  - `username`: username mới (optional)
  - `avatar`: avatar mới (optional) 
  - `password`: password mới (optional)
  - `currentPassword`: password hiện tại (required để xác thực)

#### 4. Cập nhật UserService (`chat-service/internal/services/user_service.go`)
- Thêm method `UpdateProfile` để xử lý việc cập nhật profile
- Verify current password trước khi cho phép update
- Hash password mới nếu được cung cấp
- Update các field được thay đổi

#### 5. Cập nhật UserRepository (`chat-service/internal/repositories/postgres/user_repository.go`)
- Cập nhật method `Update` để hỗ trợ avatar field
- Sử dụng raw SQL để update user với avatar

#### 6. Cập nhật UserHandler (`chat-service/internal/api/handlers/user.go`)
- Thêm handler `UpdateProfile` để xử lý PUT request `/users/profile`
- Validate current password là required
- Xử lý các error cases (current password incorrect, validation errors)
- Trả về user profile đã được cập nhật

#### 7. Cập nhật Routes (`chat-service/internal/api/routes/routes.go`)
- Thêm route PUT `/users/profile` với authentication middleware

#### 8. Generate API Documentation
- Chạy `make swagger` để generate Swagger docs
- Chạy `make swagger-sync` để convert sang OpenAPI 3.0.1 và sync với frontend
- Chạy `npm run gen:api` để generate TypeScript API client với orval

### Thay đổi Frontend:

#### 9. Cập nhật useAuthStore (`frontend/src/store/useAuthStore.ts`)
- Thêm method `updateUser` để cập nhật thông tin user trong store

#### 10. Cập nhật UserSettingDialog (`frontend/src/components/organisms/UserSettingDialog.tsx`)
- Import và sử dụng API `usePutUsersProfile` để update profile
- Cập nhật form để có field current password (required)
- Implement logic update thực sự thay vì dummy
- Xử lý success/error cases với toast notifications
- Reset form sau khi update thành công
- Update local state với thông tin user mới
- **Tối giản hóa**: Thu nhỏ dialog từ fullscreen xuống `max-w-md`
- **Loại bỏ**: Tabs, theme toggle, logout button, provider field, user ID field
- **Giữ lại**: Form update profile tối thiểu với username, avatar, new password, current password
- **UI cải thiện**: Sử dụng Label component, spacing tốt hơn, button full-width
- **Upload Avatar**: Sử dụng folder `public` thay vì `user_avatars` theo policy Supabase
- **Auto Close**: Dialog tự động đóng sau khi update profile thành công

#### 11. Cập nhật NavUser (`frontend/src/components/molecules/NavUser.tsx`)
- Wrap item "Account" với `UserSettingDialog` để mở dialog edit profile khi click
- **Fix lỗi dialog đóng ngay lập tức**: Sử dụng controlled state thay vì wrap trực tiếp
- Sử dụng `useState` để control dialog open/close
- Tránh conflict giữa dropdown menu và dialog trigger

### Kết quả:
- Home page giờ đây chỉ hiển thị một dummy page đơn giản
- **Quan trọng**: Home page không bao giờ được hiển thị cho user
- User đã login sẽ tự động được chuyển hướng tới trang messages
- User chưa login sẽ tự động được chuyển hướng tới trang login
- **Chức năng Edit Account hoàn chỉnh**:
  - User có thể edit username, avatar, password
  - Luôn yêu cầu nhập current password để xác thực
  - API backend xử lý update profile với validation
  - Frontend hiển thị form edit profile trong dialog
  - Local state được cập nhật sau khi update thành công
  - Toast notifications cho success/error cases
- Middleware đảm bảo flow navigation mượt mà và logic

### Files đã thay đổi:
- `frontend/src/app/page.tsx` - Đơn giản hóa thành dummy page
- `frontend/src/middleware.ts` - Cải thiện logic redirect cho home page
- `chat-service/internal/models/user.go` - Thêm UpdateProfileRequest
- `chat-service/internal/services/user_service.go` - Thêm UpdateProfile method
- `chat-service/internal/repositories/postgres/user_repository.go` - Cập nhật Update method
- `chat-service/internal/api/handlers/user.go` - Thêm UpdateProfile handler
- `chat-service/internal/api/routes/routes.go` - Thêm PUT /users/profile route
- `frontend/src/store/useAuthStore.ts` - Thêm updateUser method
- `frontend/src/components/organisms/UserSettingDialog.tsx` - Implement logic update profile thực sự
- `frontend/src/components/molecules/NavUser.tsx` - Gắn UserSettingDialog với item Account
