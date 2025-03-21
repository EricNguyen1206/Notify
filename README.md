<h1 style="width: 100%; text-align: center;">Realtime polling system with GO</h1>

# Project Votify

One Paragraph of project description goes here

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

## High-level design

```mermaid
%%{
  init: {
    'theme': 'forest',
    'themeVariables': {
      'primaryColor': '#BB2528',
      'primaryTextColor': '#000',
    }
  }
}%%
flowchart TD
    %% Client Layer
    subgraph Client Layer
        A[🖥️ Next.js Frontend<br/>Client]
    end
    style A fill:#E3F2FD,stroke:#1E88E5,stroke-width:2px

    %% API Gateway Layer
    subgraph API Gateway Layer
        B[🌐 NGINX API Gateway<br/>& Load Balancer]
    end
    style B fill:#E1F5FE,stroke:#0288D1,stroke-width:2px

    %% Backend Services Layer
    subgraph Backend Services
        C[🔄 Vote API Service<br/>Golang]
        D[📨 Message Broker<br/>Apache Kafka]
        E[📊 Vote Aggregation Service<br/>Golang]
        G[📡 Realtime Notification<br/>WebSocket Service<br/>Golang]
    end
    style C fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px
    style D fill:#FFF3E0,stroke:#F57C00,stroke-width:2px
    style E fill:#F1F8E9,stroke:#33691E,stroke-width:2px
    style G fill:#F3E5F5,stroke:#8E24AA,stroke-width:2px

    %% Supporting Infrastructure Layer
    subgraph Infrastructure
        F[⚡ In-Memory Cache<br/>Redis]
        H[🗄️ MySQL Database]
    end
    style F fill:#FBE9E7,stroke:#D84315,stroke-width:2px
    style H fill:#ECEFF1,stroke:#455A64,stroke-width:2px

    %% Connections
    A -- "Submit Vote & Request Results" --> B
    B --> C

    %% Vote API Service interactions
    C -- "Check Campaign<br/>(Start/End Times)" --> H
    C -- "Valid Vote Message" --> D

    %% Vote Processing Pipeline
    D --> E
    E -- "Store Final Vote Counts" --> H
    E -- "Update Cache" --> F

    %% Real-Time Updates
    F -- "Real-Time Data" --> G
    G -- "Push Updates" --> A

    %% Optional Monitoring & Logging (Not colored for brevity)
    C --- M[📈 Monitoring & Logging <br/> Prometheus & Grafana]
    E --- M
    G --- M

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
