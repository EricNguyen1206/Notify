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
# - ./cmd/api/main.go: Entry point of the application
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/api/main.go

# ================================================
# RUNTIME STAGE (uses minimal Alpine image)
# ================================================
FROM golang:1.23-alpine

# Set working directory
WORKDIR /app

# Copy only the compiled binary from builder stage
# (reduces final image size by excluding build tools)
COPY --from=builder /app/main .

# Expose the default application port
# (change this if your app uses a different port)
EXPOSE 8081

# Command to run the application when container starts
CMD ["./main"]