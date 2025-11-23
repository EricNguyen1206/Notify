import { DataSource } from "typeorm";
import { config } from "./config";

// Check if URL is for Supabase (requires SSL)
const isSupabaseUrl = (url: string): boolean => {
  return url.includes("supabase.co");
};

// Parse database URL for application runtime - uses Session Pooler for Supabase
const getDatabaseConfig = () => {
  // Prefer pooler URL if available, otherwise use direct connection
  const connectionUrl = config.database.poolerUrl || config.database.url;

  if (connectionUrl) {
    try {
      const url = connectionUrl as string;
      const isSupabase = isSupabaseUrl(url);

      // For Supabase, convert to Session Pooler (port 6543) if using direct connection
      let finalUrl = url;
      if (isSupabase && url.includes(":5432/")) {
        // Convert direct connection to pooler
        finalUrl = url.replace(/:5432\//, ":6543/");
        console.log("🔄 Using Supabase Session Pooler (port 6543) for better connection management");
      }

      // Parse URL to extract components for better SSL control
      // Replace postgresql:// with http:// temporarily for URL parsing
      const parseUrl = finalUrl.replace(/^postgresql:\/\//, "http://");
      const urlObj = new URL(parseUrl);
      const baseConfig: any = {
        type: "postgres" as const,
        host: urlObj.hostname,
        port: parseInt(urlObj.port || "5432", 10),
        username: decodeURIComponent(urlObj.username),
        password: decodeURIComponent(urlObj.password),
        database: urlObj.pathname.slice(1), // Remove leading '/'
        extra: {
          max: 15, // Connection pool size for application
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
        },
      };

      // Supabase requires SSL - enforce it
      if (isSupabase) {
        // Set SSL config for TypeORM (top level)
        baseConfig.ssl = { rejectUnauthorized: false };
        // Also set SSL config in extra for pg library
        baseConfig.extra.ssl = { rejectUnauthorized: false };
      } else if (config.database.ssl) {
        baseConfig.ssl = { rejectUnauthorized: false };
        baseConfig.extra.ssl = { rejectUnauthorized: false };
      }

      return baseConfig;
    } catch (error) {
      console.error("Failed to parse database connection URL:", error);
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
      max: 15,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    },
    ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
  };
};

export const AppDataSource = new DataSource({
  ...getDatabaseConfig(),
  type: "postgres",
  synchronize: false, // Use migrations instead
  logging: config.database.logging || false,
  // Import entities directly as classes (required for TypeORM CLI)
  // Use relative paths from project root for runtime
  entities: [__dirname + "/../models/**/*.ts"],
  // Use glob pattern for migrations (TypeORM CLI handles this)
  migrations: [__dirname + "/../migrations/**/*.ts"],
  migrationsTableName: "migrations",
  migrationsRun: false, // Don't auto-run migrations
});

// This function is only used by your application code (index.ts)
// TypeORM CLI does NOT call this - it initializes DataSource itself
export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connection established successfully");

    // Log connection info
    const connectionUrl = config.database.poolerUrl || config.database.url;
    if (connectionUrl?.includes("supabase.co")) {
      const isPooler = connectionUrl.includes(":6543/");
      console.log(`📊 Using Supabase ${isPooler ? "Session Pooler" : "Direct Connection"}`);
    }
  } catch (error: any) {
    console.error("❌ Error during database initialization:", error);

    // Provide helpful error messages for common issues
    if (error.code === "ENOTFOUND") {
      console.error(
        "\n💡 Troubleshooting tips:\n" +
          "1. Check if your Supabase database is paused (free tier databases pause after inactivity)\n" +
          "2. Verify the hostname in your DATABASE_URL is correct\n" +
          "3. Check your internet connection\n" +
          "4. For Supabase: Go to your project settings and ensure the database is active"
      );
    } else if (error.code === "ECONNREFUSED") {
      console.error(
        "\n💡 Troubleshooting tips:\n" +
          "1. Verify the database host and port are correct\n" +
          "2. For Supabase Session Pooler, ensure you're using port 6543\n" +
          "3. Check if the database server is running\n" +
          "4. Verify your firewall settings allow the connection"
      );
    } else if (error.code === "28P01" || error.message?.includes("password")) {
      console.error(
        "\n💡 Troubleshooting tips:\n" +
          "1. Verify your database password is correct\n" +
          "2. If your password contains special characters, URL-encode them:\n" +
          "   - @ becomes %40\n" +
          "   - # becomes %23\n" +
          "   - / becomes %2F\n" +
          "   - etc.\n" +
          "3. Example: postgresql://user:p%40ssw%23rd@host:5432/db"
      );
    } else if (error.code === "SELF_SIGNED_CERT_IN_CHAIN" || error.message?.includes("SSL") || error.code === "08006") {
      console.error(
        "\n💡 SSL Certificate Error:\n" +
          "1. Supabase uses self-signed certificates which require special handling\n" +
          "2. The SSL configuration should allow self-signed certificates (rejectUnauthorized: false)\n" +
          "3. Ensure your connection string includes sslmode=require\n" +
          "4. For Session Pooler, use port 6543 with SSL enabled\n" +
          "5. If this error persists, check that the SSL config is properly set in both TypeORM and pg library settings"
      );
    }

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
