<h1 style="width: 100%; text-align: center;">Realtime polling system with GO</h1>

## High-level design
```mermaid
graph TD
    A[Client] -->|WebSocket| B(API Gateway)
    B --> C(Voting Service)
    C --> D[Cache<br/>(Redis)]
    C --> E[Database<br/>(PostgreSQL)]
    
    subgraph Frontend
        A
    end
    
    subgraph Backend
        B
        C
        D
        E
    end
    
    A -->|1. Establish WebSocket| B
    B -->|2. Route Request| C
    C -->|3. Process Vote| D
    C -->|4. Persist Vote| E
    C -->|5. Broadcast Update| B
    B -->|6. Real-time Update| A

    classDef frontend fill:#f9f,stroke:#333,stroke-width:2px;
    classDef backend fill:#bbf,stroke:#333,stroke-width:2px;
    class A frontend;
    class B,C,D,E backend;

```

```
polling-system-backend/
├── cmd/
│   └── server/
│       └── main.go          # Application entry point
├── internal/
│   ├── adapters/            # Adapters for external systems
│   │   ├── handlers/        # HTTP handlers (e.g., Gin)
│   │   │   ├── poll.go      # Poll-related endpoints
│   │   │   ├── vote.go      # Vote-related endpoints
│   │   │   └── auth.go      # Authentication endpoints
│   │   ├── repositories/    # Data persistence implementations
│   │   │   ├── mysql/       # MySQL database access
│   │   │   │   └── poll_repository.go
│   │   │   ├── redis/       # Redis caching
│   │   │   │   └── vote_cache.go
│   │   │   └── kafka/       # Kafka messaging
│   │   │       └── vote_producer.go
│   │   └── external/        # External service implementations
│   │       ├── minio/       # MinIO for image uploads
│   │       │   └── image_uploader.go
│   │       └── socketio/    # Socket.IO for real-time updates
│   │           └── broadcaster.go
│   ├── core/                # Core business logic
│   │   ├── domain/          # Domain entities
│   │   │   ├── poll.go      # Poll entity
│   │   │   ├── poll_option.go # Poll option entity
│   │   │   ├── vote.go      # Vote entity
│   │   │   └── user.go      # User entity
│   │   └── services/        # Application services (use cases)
│   │       ├── poll_service.go   # Poll-related logic
│   │       ├── vote_service.go   # Vote-related logic
│   │       └── auth_service.go   # Authentication logic
│   └── ports/               # Interfaces for external interactions
│       ├── repositories.go  # Repository interfaces
│       ├── services.go      # Service interfaces (optional)
│       └── external.go      # External service interfaces
├── pkg/                     # Shared utilities (optional)
│   ├── config/              # Configuration management
│   │   └── config.go
│   └── middleware/          # Middleware functions
│       └── auth.go          # Authentication middleware
└── go.mod                   # Go module file
```
