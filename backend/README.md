# Notify Backend - Express + TypeScript + TypeORM

A modern, scalable chat service backend built with Express.js, TypeScript, and TypeORM.

## 🚀 Features

- **Real-time Messaging** with Socket.IO
- **JWT Authentication** with secure token management
- **TypeORM** for database operations with PostgreSQL
- **Redis** for caching and session management
- **Clean Architecture** with separation of concerns
- **TypeScript** for type safety and better development experience
- **Input Validation** with class-validator
- **Rate Limiting** for API protection
- **Comprehensive Logging** with structured logging
- **Error Handling** with centralized error management

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- PostgreSQL >= 12
- Redis >= 6

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb notify_chat
   
   # Run migrations (when available)
   npm run migration:run
   ```

## 🚀 Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
src/
├── config/           # Configuration files
│   ├── config.ts     # Main configuration
│   └── database.ts   # Database configuration
├── controllers/      # HTTP request handlers
│   ├── auth/         # Authentication controllers
│   ├── user/         # User management controllers
│   ├── channel/      # Channel management controllers
│   ├── message/      # Message controllers
│   └── websocket/    # WebSocket controllers
├── entities/         # TypeORM entities
│   ├── User.ts       # User entity
│   ├── Channel.ts    # Channel entity
│   ├── Chat.ts       # Chat message entity
│   └── ChannelMember.ts # Channel membership entity
├── middleware/       # Express middleware
│   ├── auth/         # Authentication middleware
│   ├── rateLimit/    # Rate limiting middleware
│   └── validation/   # Input validation middleware
├── routes/           # Route definitions
│   ├── auth.routes.ts
│   ├── user.routes.ts
│   ├── channel.routes.ts
│   ├── message.routes.ts
│   └── websocket.routes.ts
├── services/         # Business logic layer
│   ├── auth/         # Authentication services
│   ├── user/         # User services
│   ├── channel/      # Channel services
│   └── message/      # Message services
├── types/            # TypeScript type definitions
│   ├── dto/          # Data Transfer Objects
│   └── response/     # Response types
├── utils/            # Utility functions
│   └── logger.ts     # Logging utility
└── index.ts          # Application entry point
```

## 🔧 Configuration

The application uses environment variables for configuration. See `env.example` for all available options.

### Key Configuration Options

- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 3000)
- `DB_*`: Database connection settings
- `REDIS_*`: Redis connection settings
- `JWT_SECRET`: JWT signing secret
- `CORS_ORIGIN`: Allowed CORS origins

## 📡 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login

### User Management
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `GET /api/v1/users/search` - Search users

### Channel Management
- `GET /api/v1/channels` - Get user channels
- `POST /api/v1/channels` - Create channel
- `GET /api/v1/channels/:id` - Get channel details
- `PUT /api/v1/channels/:id` - Update channel
- `DELETE /api/v1/channels/:id` - Delete channel
- `POST /api/v1/channels/:id/user` - Add user to channel
- `PUT /api/v1/channels/:id/user` - Leave channel
- `DELETE /api/v1/channels/:id/user` - Remove user from channel

### Messaging
- `GET /api/v1/messages/channel/:id` - Get channel messages

### WebSocket
- `GET /api/v1/ws` - WebSocket connection endpoint

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run migration:generate` - Generate migration
- `npm run migration:run` - Run migrations
- `npm run migration:revert` - Revert last migration

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS protection
- Input validation and sanitization
- Helmet.js for security headers

## 🚀 Deployment

### Docker (Recommended)

```bash
# Build Docker image
docker build -t notify-backend .

# Run container
docker run -p 3000:3000 --env-file .env notify-backend
```

### Manual Deployment

```bash
# Build application
npm run build

# Start production server
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Run linting and tests
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions, please open an issue in the repository.
