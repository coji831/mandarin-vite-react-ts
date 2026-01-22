/**
 * @file apps/backend/src/index.js
 * @description Backend server entry point
 * Clean architecture: Application initialization and wiring
 */

import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import swaggerUi from "swagger-ui-express";
import config from "./config/index.js";
import { swaggerSpec } from "./api/docs/openapi.js";
import { getCacheService } from "./infrastructure/cache/index.js";
import { createLogger } from "./utils/logger.js";
import { errorHandler } from "./api/middleware/errorHandler.js";

// Load environment variables
dotenv.config();

const logger = createLogger("Server");
const app = express();

// Initialize cache service
const cacheService = getCacheService();
logger.info("Cache service initialized", {
  type: cacheService.constructor.name,
  enabled: cacheService.constructor.name !== "NoOpCacheService",
});

// Import routes after cache service is initialized
import routes from "./api/routes/index.js";

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware for development
app.use(
  cors({
    origin: true, // reflect request Origin (allows any origin in dev)
    credentials: true, // allow cookies/auth headers
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Mount routes
app.use("/api", routes);

// Swagger API documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown handler
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");
  try {
    // Close Redis connection if available
    if (cacheService.quit) {
      await cacheService.quit();
      logger.info("Cache connection closed");
    }
  } catch (error) {
    logger.error("Error during shutdown", error);
  }
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully");
  try {
    // Close Redis connection if available
    if (cacheService.quit) {
      await cacheService.quit();
      logger.info("Cache connection closed");
    }
  } catch (error) {
    logger.error("Error during shutdown", error);
  }
  process.exit(0);
});

// Start server
app.listen(config.port, () => {
  logger.info(`Backend server running on port ${config.port}`);
  logger.info(`API docs: http://localhost:${config.port}/api-docs`);
  logger.info(`Environment: ${config.nodeEnvironment}`);
});

export default app;
