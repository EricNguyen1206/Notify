import "reflect-metadata";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { config } from "@/config/config";
import { initializeDatabase, closeDatabase } from "@/config/database";
import { setupRoutes } from "@/routes";
import { errorHandler } from "@/middleware/errorHandler";
import { notFoundHandler } from "@/middleware/notFoundHandler";
import { logger } from "@/utils/logger";

class App {
  public app: express.Application;
  public server: any;
  public io: SocketIOServer;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: config.websocket.corsOrigin,
        methods: ["GET", "POST"],
      },
    });

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet());

    // CORS middleware
    this.app.use(
      cors({
        origin: config.cors.origin,
        credentials: true,
      })
    );

    // Compression middleware
    this.app.use(compression());

    // Logging middleware
    this.app.use(
      morgan("combined", {
        stream: { write: (message: string) => logger.info(message.trim()) },
      })
    );

    // Body parsing middleware
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Health check endpoint
    this.app.get("/health", (req, res) => {
      res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });
  }

  private initializeRoutes(): void {
    setupRoutes(this.app, this.io);
  }

  private initializeErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Initialize database
      await initializeDatabase();

      // Start server
      this.server.listen(config.app.port, config.app.host, () => {
        logger.info(`🚀 Server running on http://${config.app.host}:${config.app.port}`);
        logger.info(`📊 Environment: ${config.app.env}`);
        logger.info(`🔗 WebSocket enabled`);
      });

      // Graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      logger.error("Failed to start server:", error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      this.server.close(async () => {
        logger.info("HTTP server closed");

        await closeDatabase();
        logger.info("Database connection closed");

        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  }
}

// Start the application
const app = new App();
app.start().catch((error) => {
  logger.error("Failed to start application:", error);
  process.exit(1);
});

export default app;
