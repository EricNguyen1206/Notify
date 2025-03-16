# voting-service/Dockerfile
FROM golang:1.23-alpine AS builder
# Install build dependencies
RUN apk add --no-cache gcc musl-dev

WORKDIR /go/src/voting-service
COPY . .

# Download dependencies and build
RUN go mod download && \
    CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o voting-service ./cmd/api/main.go

FROM alpine:latest
WORKDIR /app

# Add necessary runtime dependencies
RUN apk add --no-cache tzdata netcat-openbsd

# Copy binary and config files
COPY --from=builder /go/src/voting-service/voting-service .
COPY --from=builder /go/src/voting-service/.env .
COPY --from=builder /go/src/voting-service/wait-for-it.sh ./wait-for-it.sh

# Set up permissions before switching user
RUN chmod +x ./wait-for-it.sh && \
    adduser -D appuser && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Default environment variables
ENV VOTIFY_SERVICE_PORT=8000 \
    VOTIFY_DB_HOST=mysql \
    VOTIFY_DB_PORT=3306 \
    VOTIFY_DB_USER=${VOTIFY_MYSQL_USER} \
    VOTIFY_DB_PASSWORD=${VOTIFY_MYSQL_PASSWORD} \
    VOTIFY_DB_NAME=${VOTIFY_MYSQL_DATABASE} \
    VOTIFY_DB_PROTOCOL="tcp" \
    VOTIFY_REDIS_ADDR=redis:6379 \
    VOTIFY_MINIO_ENDPOINT=minio:9000

EXPOSE ${VOTIFY_SERVICE_PORT}

CMD ["sh", "-c", "./wait-for-it.sh mysql:3306 -- ./voting-service"]