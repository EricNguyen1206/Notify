import { DataSource } from "typeorm";
import { config } from "./config";
import { User } from "@/entities/User";
import { Conversation } from "@/entities/Conversation";
import { Message } from "@/entities/Message";
import { ConversationMember } from "@/entities/ConversationMember";
import { Session } from "@/entities/Session";

// Parse database URL if provided, otherwise use individual config
const getDatabaseConfig = () => {
  if (config.database.url) {
    // Parse PostgreSQL connection string: postgresql://username:password@host:port/database
    // Also supports postgres:// protocol
    try {
      const url = new URL(config.database.url);
      const sslMode = url.searchParams.get("sslmode");
      const requiresSSL = sslMode === "require" || sslMode === "prefer" || config.database.ssl;
      
      return {
        type: "postgres" as const,
        host: url.hostname,
        port: parseInt(url.port || "5432", 10),
        username: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password || ""),
        database: url.pathname.slice(1), // Remove leading '/'
        ssl: requiresSSL ? { rejectUnauthorized: false } : false,
      };
    } catch (error) {
      console.error("Failed to parse DATABASE_URL:", error);
      throw new Error("Invalid DATABASE_URL format. Expected: postgresql://username:password@host:port/database");
    }
  }

  // Fallback to individual config
  return {
    type: "postgres" as const,
    host: config.database.host,
    port: config.database.port,
    username: config.database.username,
    password: config.database.password,
    database: config.database.name,
    ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
  };
};

export const AppDataSource = new DataSource({
  ...getDatabaseConfig(),
  synchronize: false, // Use migrations instead
  logging: config.database.logging,
  entities: [User, Conversation, Message, ConversationMember, Session],
  migrations: ["src/migrations/*.ts"],
  migrationsRun: false, // Don't auto-run migrations
  subscribers: ["src/subscribers/*.ts"],
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connection established successfully");
  } catch (error) {
    console.error("❌ Error during database initialization:", error);
    process.exit(1);
  }
};

export const closeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.destroy();
    console.log("✅ Database connection closed");
  } catch (error) {
    console.error("❌ Error closing database connection:", error);
  }
};
