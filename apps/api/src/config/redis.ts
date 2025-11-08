import { createClient, RedisClientType } from "redis";
import { config } from "./config";
import { logger } from "@/utils/logger";

// Parse Redis URL if provided, otherwise use individual config
const getRedisConfig = () => {
  if (config.redis.url) {
    // Use connection string directly
    return {
      url: config.redis.url,
    };
  }

  // Fallback to individual config
  return {
    socket: {
      host: config.redis.host,
      port: config.redis.port,
    },
    password: config.redis.password || undefined,
    database: config.redis.db,
  };
};

export class RedisConnection {
  private client: RedisClientType;

  constructor() {
    this.client = createClient(getRedisConfig() as any);

    this.client.on("error", (err) => {
      logger.error("Redis Client Error:", err);
    });

    this.client.on("connect", () => {
      logger.info("Redis Client Connected");
    });

    this.client.on("ready", () => {
      logger.info("Redis Client Ready");
    });

    this.client.on("end", () => {
      logger.info("Redis Client Disconnected");
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      logger.info("✅ Redis connection established successfully");
    } catch (error) {
      logger.error("❌ Error during Redis initialization:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      logger.info("✅ Redis connection closed");
    } catch (error) {
      logger.error("❌ Error closing Redis connection:", error);
      throw error;
    }
  }

  getClient(): RedisClientType {
    return this.client;
  }

  async ping(): Promise<string> {
    return await this.client.ping();
  }
}

// Singleton instance
let redisConnection: RedisConnection | null = null;

export const getRedisConnection = (): RedisConnection => {
  if (!redisConnection) {
    redisConnection = new RedisConnection();
  }
  return redisConnection;
};

export const initializeRedis = async (): Promise<void> => {
  const redis = getRedisConnection();
  await redis.connect();
};

export const closeRedis = async (): Promise<void> => {
  if (redisConnection) {
    await redisConnection.disconnect();
    redisConnection = null;
  }
};
