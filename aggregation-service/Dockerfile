FROM golang:1.23-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git make gcc musl-dev

WORKDIR /app

# Copy go mod files first for better layer caching
COPY go.mod go.sum ./

# Update go.mod to use correct version and download dependencies
RUN go mod edit -go=1.23 && \
  go mod tidy && \
  go mod download

# Copy source code
COPY . .

# Build application with all necessary tags
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
  -ldflags="-w -s" \
  -tags musl,netgo \
  -o /aggregation-service ./cmd/api/main.go

FROM alpine:latest

# Install runtime dependencies
RUN apk add --no-cache \
  ca-certificates \
  tzdata \
  netcat-openbsd \
  wget

WORKDIR /app

# Copy binary and configs
COPY --from=builder /aggregation-service ./aggregation-service
COPY --from=builder /app/configs/ ./configs/

# Create non-root user
RUN adduser -D appuser && \
  chown -R appuser:appuser /app

USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["./aggregation-service"]