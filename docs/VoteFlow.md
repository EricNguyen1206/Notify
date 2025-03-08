```mermaid
sequenceDiagram
    Client->>+API: POST /vote
    API->>+Redis: INCR vote_counter
    Redis-->>-API: New count
    API->>+Redis: PUBLISH vote_update
    Redis->>+WebSocket Clients: Broadcast update
    WebSocket Clients-->>-Client: Real-time update
```
