import "reflect-metadata";
import { DataSource } from "typeorm";
import { config } from "./config";

// Check if URL is for Supabase (requires SSL)
const isSupabaseUrl = (url: string): boolean => {
  return url.includes("supabase.co");
};

// Parse database URL if provided, otherwise use individual config
// This is for TypeORM CLI migrations - uses direct connection (port 5432)
const getDatabaseConfig = () => {
  if (config.database.url) {
    try {
      const url = config.database.url as string;
      const isSupabase = isSupabaseUrl(url);

      // For migrations, use direct connection (port 5432)
      const baseConfig: any = {
        type: "postgres" as const,
        url,
        extra: {
          max: 5, // Smaller pool for migrations
        },
      };

      // Supabase requires SSL - enforce it
      if (isSupabase) {
        // Ensure sslmode=require in URL or add SSL config
        if (!url.includes("sslmode=")) {
          baseConfig.ssl = { rejectUnauthorized: false };
        } else {
          // If sslmode is in URL, ensure it's require
          const urlWithSSL = url.includes("sslmode=require") ? url : url.replace(/sslmode=[^&]*/, "sslmode=require");
          baseConfig.url = urlWithSSL;
        }
      } else if (config.database.ssl) {
        baseConfig.ssl = { rejectUnauthorized: false };
      }

      return baseConfig;
    } catch (error) {
      console.error("Failed to parse DATABASE_URL:", error);
      throw new Error(
        "Invalid DATABASE_URL format. Expected: postgresql://username:password@host:port/database\n" +
          "Note: If your password contains special characters, URL-encode them (e.g., @ becomes %40)"
      );
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
    extra: {
      max: 5,
    },
    ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
  };
};

// This DataSource is specifically for TypeORM CLI
// TypeORM CLI uses ts-node, so we can use relative paths from project root
// The paths are resolved relative to where the CLI is executed (project root)
export const AppDataSource = new DataSource({
  ...getDatabaseConfig(),
  type: "postgres",
  synchronize: false, // Use migrations instead
  logging: config.database.logging || false,
  // Use relative paths from project root (TypeORM CLI resolves these)
  entities: ["src/models/**/*.ts"],
  // Use relative paths from project root (TypeORM CLI resolves these)
  migrations: ["src/migrations/**/*.ts"],
  migrationsTableName: "migrations",
  migrationsRun: false, // Don't auto-run migrations
  // Additional TypeORM CLI options
  subscribers: [],
});
