import { Application } from "express";
import swaggerUi from "swagger-ui-express";
import { readFileSync } from "fs";
import { join } from "path";
import { config } from "./config";

// Load Swagger JSON file
const swaggerDocument = JSON.parse(
  readFileSync(join(__dirname, "../../docs/swagger.json"), "utf-8")
);

/**
 * Setup Swagger UI for API documentation
 * @param app Express application instance
 */
export const setupSwagger = (app: Application): void => {
  // Only enable Swagger UI in development and staging environments
  if (config.app.env === "production") {
    return;
  }

  // Swagger UI options
  const swaggerOptions = {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Notify Chat API Documentation",
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
    },
  };

  // Serve Swagger UI at /api-docs
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

  // Serve raw JSON at /api-docs.json
  app.get("/api-docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerDocument);
  });
};

