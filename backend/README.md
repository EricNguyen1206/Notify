# Chat Service Backend

A real-time chat application backend built with Express.js, TypeScript, TypeORM, Socket.IO, and Redis. This is a complete migration from the original Go-based chat service.

## 🚀 Features

- **Real-time Messaging**: WebSocket support with Socket.IO
- **Channel Management**: Direct messages and group channels
- **User Authentication**: JWT-based authentication
- **Rate Limiting**: Redis-based rate limiting
- **Database**: PostgreSQL with TypeORM
- **Caching**: Redis for user status and channel management
- **Clean Architecture**: Separation of concerns with services, repositories, and controllers

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with TypeORM
- **Cache**: Redis
- **WebSocket**: Socket.IO
- **Authentication**: JWT
- **Validation**: class-validator
- **Logging**: Winston

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   ├── entities/         # TypeORM entities
│   ├── migrations/       # Database migrations
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   ├── repositories/     # Data access layer
│   ├── middleware/       # Express middleware
│   ├── routes/           # Route definitions
│   ├── websocket/        # WebSocket handling
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
├── package.json
├── tsconfig.json
├── Dockerfile
└── docker-compose.yml
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 13+
- Redis 6+

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Environment setup:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Database setup:**
   ```bash
   # Run migrations
   npm run migration:run
   
   # Or generate new migration
   npm run migration:generate -- --name=YourMigrationName
   ```

4. **Start the application:**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm run build
   npm start
   ```

### Docker Setup

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/v1/auth/register
Register a new user.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "avatar": null,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /api/v1/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Channel Endpoints

#### GET /api/v1/channels
Get all channels for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": {
    "direct": [
      {
        "id": 1,
        "name": "jane@example.com",
        "avatar": "avatar.jpg",
        "type": "direct",
        "ownerId": 1
      }
    ],
    "group": [
      {
        "id": 2,
        "name": "General",
        "type": "group",
        "ownerId": 1
      }
    ]
  }
}
```

#### POST /api/v1/channels
Create a new channel.

**Request Body:**
```json
{
  "name": "My Channel",
  "type": "group",
  "userIds": [2, 3, 4]
}
```

#### GET /api/v1/channels/:id
Get channel by ID.

#### PUT /api/v1/channels/:id
Update channel name.

#### DELETE /api/v1/channels/:id
Delete channel (owner only).

#### POST /api/v1/channels/:id/users
Add user to channel (owner only).

#### DELETE /api/v1/channels/:id/users
Remove user from channel (owner only).

#### POST /api/v1/channels/:id/leave
Leave channel.

### Message Endpoints

#### GET /api/v1/messages/channel/:id
Get channel messages with pagination.

**Query Parameters:**
- `limit`: Number of messages to return (default: 20, max: 100)
- `before`: Message ID to fetch messages before

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "text",
      "senderId": 1,
      "senderName": "johndoe",
      "senderAvatar": "avatar.jpg",
      "text": "Hello world!",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "channelId": 1
    }
  ],
  "pagination": {
    "limit": 20,
    "before": null,
    "hasMore": false
  }
}
```

#### POST /api/v1/messages
Create a new message.

**Request Body:**
```json
{
  "channelId": 1,
  "text": "Hello world!"
}
```

#### GET /api/v1/messages/friend/:friendId
Get direct messages with a friend.

#### GET /api/v1/messages/:id
Get message by ID.

#### DELETE /api/v1/messages/:id
Delete message.

### WebSocket Endpoints

#### GET /api/v1/ws/stats
Get WebSocket statistics.

#### GET /api/v1/ws/channels/:channelId/members
Get channel members.

#### POST /api/v1/ws/channels/:channelId/broadcast
Broadcast message to channel (admin only).

#### GET /api/v1/ws/users
Get connected users.

#### DELETE /api/v1/ws/users/:userId
Disconnect user (admin only).

## 🔌 WebSocket Events

### Client Events

#### authenticate
Authenticate with JWT token.

```javascript
socket.emit('authenticate', { token: 'your-jwt-token' });
```

#### join_channel
Join a channel.

```javascript
socket.emit('join_channel', { channel_id: 1 });
```

#### leave_channel
Leave a channel.

```javascript
socket.emit('leave_channel', { channel_id: 1 });
```

#### message
Send a message.

```javascript
socket.emit('message', {
  type: 'channel.message',
  data: {
    channel_id: 1,
    text: 'Hello world!'
  }
});
```

### Server Events

#### authenticated
Authentication successful.

```javascript
socket.on('authenticated', (data) => {
  console.log('User ID:', data.userId);
});
```

#### message
Receive a message.

```javascript
socket.on('message', (message) => {
  console.log('Received:', message);
});
```

#### joined_channel
Successfully joined a channel.

```javascript
socket.on('joined_channel', (data) => {
  console.log('Joined channel:', data.channel_id);
});
```

#### left_channel
Successfully left a channel.

```javascript
socket.on('left_channel', (data) => {
  console.log('Left channel:', data.channel_id);
});
```

#### error
Error occurred.

```javascript
socket.on('error', (error) => {
  console.error('Error:', error.message);
});
```

## 🗄️ Database Schema

### Users Table
- `id`: Primary key
- `username`: Unique username
- `email`: Unique email
- `password`: Hashed password
- `avatar`: Avatar URL
- `createdAt`: Creation timestamp
- `updatedAt`: Update timestamp
- `deletedAt`: Soft delete timestamp

### Channels Table
- `id`: Primary key
- `name`: Channel name
- `ownerId`: Foreign key to users
- `type`: 'direct' or 'group'
- `createdAt`: Creation timestamp
- `updatedAt`: Update timestamp
- `deletedAt`: Soft delete timestamp

### Chats Table
- `id`: Primary key
- `senderId`: Foreign key to users
- `receiverId`: Foreign key to users (for direct messages)
- `channelId`: Foreign key to channels (for channel messages)
- `text`: Message text
- `url`: File URL
- `fileName`: File name
- `createdAt`: Creation timestamp
- `updatedAt`: Update timestamp
- `deletedAt`: Soft delete timestamp

### Channel Members Table
- `id`: Primary key
- `userId`: Foreign key to users
- `channelId`: Foreign key to channels
- `joinedAt`: Join timestamp

## 🔧 Configuration

### Environment Variables

```env
# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=chat_service
DB_SSL=false

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# WebSocket
WS_CORS_ORIGIN=http://localhost:3000
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📦 Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm start              # Start production server

# Database
npm run migration:generate  # Generate migration
npm run migration:run      # Run migrations
npm run migration:revert   # Revert last migration

# Linting
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint errors

# Type checking
npm run type-check      # Run TypeScript compiler
```

## 🚀 Deployment

### Docker

```bash
# Build image
docker build -t chat-service-backend .

# Run container
docker run -p 3000:3000 --env-file .env chat-service-backend
```

### Docker Compose

```bash
# Start all services
docker-compose up -d

# Scale backend
docker-compose up -d --scale backend=3
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Related Projects

- [Frontend](https://github.com/your-org/chat-service-frontend) - React/Next.js frontend
- [Original Go Backend](https://github.com/your-org/chat-service-go) - Original Go implementation

## 📞 Support

For support, email support@example.com or create an issue in the repository.