import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export const config = {
  app: {
    env: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT || "3000", 10),
    host: process.env.HOST || "localhost",
  },
  database: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "password",
    name: process.env.DB_NAME || "notify_chat",
    synchronize: process.env.DB_SYNCHRONIZE === "true",
    logging: process.env.DB_LOGGING === "true",
    ssl: process.env.NODE_ENV === "production",
  },
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || "0", 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET || "your-super-secure-jwt-secret-key",
    expire: process.env.JWT_EXPIRE || "7d",
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
  },
  websocket: {
    corsOrigin: process.env.WS_CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
  },
  logging: {
    level: process.env.LOG_LEVEL || "info",
  },
};
