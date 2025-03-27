#!/bin/bash
echo "Waiting for Kafka to be ready..."
cub kafka-ready -b kafka:9092 1 60

echo "Creating topics..."
kafka-topics.sh --create \
  --bootstrap-server kafka:9092 \
  --topic voting-events \
  --partitions 3 \
  --replication-factor 1 \
  --config retention.ms=604800000  # 7 days retention

kafka-topics.sh --create \
  --bootstrap-server kafka:9092 \
  --topic __consumer_offsets \
  --partitions 50 \
  --replication-factor 1

echo "Topics created:"
kafka-topics.sh --list --bootstrap-server kafka:9092