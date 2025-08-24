# ================================================
# BUILD STAGE (uses full Go image to compile)
# ================================================
FROM golang:1.23-alpine AS builder

# Set working directory in container
WORKDIR /app

# Copy dependency files first (optimizes Docker layer caching)
COPY go.mod go.sum ./

# Download all Go module dependencies
RUN go mod download

# Copy the entire project source code
COPY . .

# Build the application:
# - CGO_ENABLED=0: Disables CGO for static linking
# - GOOS=linux: Ensures Linux-compatible binary
# - -o main: Output filename
# - ./cmd/server/main.go: Entry point of the application
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/server/main.go

# ================================================
# RUNTIME STAGE (uses minimal Alpine image)
# ================================================
FROM alpine:latest

# Install ca-certificates for HTTPS connections
RUN apk --no-cache add ca-certificates tzdata

# Create non-root user for security
RUN addgroup -g 1001 -S appgroup && \
  adduser -u 1001 -S appuser -G appgroup

# Set working directory
WORKDIR /app

# Copy only the compiled binary from builder stage
# (reduces final image size by excluding build tools)
COPY --from=builder /app/main .

# Change ownership to non-root user
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose the default application port
EXPOSE 8080

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Command to run the application when container starts
CMD ["./main"]
