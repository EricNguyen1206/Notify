FROM golang:1.19-alpine AS builder
WORKDIR /app
COPY . .
RUN go mod init aggregation-service
RUN go get github.com/IBM/sarama
RUN go get github.com/go-redis/redis/v8
RUN go get github.com/gorilla/websocket
RUN go get gorm.io/gorm
RUN go get gorm.io/driver/mysql
RUN go build -o /aggregation-service ./cmd/api/main.go

FROM alpine:latest
COPY --from=builder /aggregation-service /aggregation-service
EXPOSE 8080
CMD ["/aggregation-service"]