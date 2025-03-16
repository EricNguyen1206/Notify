<h1 style="width: 100%; text-align: center;">Realtime polling system with GO</h1>

# Project Votify

One Paragraph of project description goes here

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

## High-level design

```mermaid
flowchart TD
    Client -->|WebSocket Connection| APIGateway
    Client -->|HTTP POST/GET /images| APIGateway
    APIGateway -->|Route Voting Messages| VotingService
    APIGateway -->|Route Image Requests| BlobService
    VotingService -->|Cache Results/Updates| Redis[(Redis)]
    VotingService -->|Persist Votes| Database[(Database)]
    BlobService -->|Store Metadata| Database
    BlobService -->|Store Image Data| ObjectStorage[(Object Storage)]
    VotingService -->|Publish Real-time Updates| Redis
    Redis -->|Notify Updates via Pub/Sub| APIGateway
    APIGateway -->|Push Updates via WebSocket| Client

    classDef service fill:#4a90e2,color:white;
    classDef storage fill:#7ed321,color:black;
    classDef gateway fill:#f5a623,color:white;
    classDef client fill:#bd10e0,color:white;

    class Client client;
    class APIGateway gateway;
    class VotingService,BlobService service;
    class Redis,Database,ObjectStorage storage;
```

```
voting-service/
|____cmd/
| |____api/
| | |____main.go
|____internal/
| |____server/
| | |____middleware/
| | | |____cors.go
| | | |____auth.go
| | |____repository/
| | | |____user_repository.go
| | | |____voting_repository.go
| | | |____auth_repository.go
| | |____server.go
| | |____routes_test.go
| | |____routes.go
| | |____service/
| | | |____voting_service.go
| | | |____auth_service.go
| | |____handlers/
| | | |____auth_handler.go
| |____adapters/
| | |____database/
| | | |____database.go
| | | |____database_test.go
| | | |____minio.go
| | | |____migrate.go
| | |____utils/
| | | |____uuid.go
| |____ports/
| | |____dao/
| | | |____option_dao.go
| | | |____auth_dao.go
| | | |____topic_dao.go
| | |____models/
| | | |____option.go
| | | |____user.go
| | | |____topic.go
| | | |____vote.go
|____docs/
| |____swagger.yaml
| |____docs.go
| |____swagger.json
|____.env
|____go.mod
|____go.sum
|____Dockerfile
|____Makefile
|____README.md

```
