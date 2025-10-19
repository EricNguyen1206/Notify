import { DataSource } from "typeorm";
import { config } from "./config";
import { User } from "@/entities/User";
import { Channel } from "@/entities/Channel";
import { Chat } from "@/entities/Chat";
import { ChannelMember } from "@/entities/ChannelMember";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.name,
  synchronize: config.database.synchronize,
  logging: config.database.logging,
  entities: [User, Channel, Chat, ChannelMember],
  migrations: ["src/migrations/*.ts"],
  subscribers: ["src/subscribers/*.ts"],
  ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
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
