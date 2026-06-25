/**
 * @file apps/backend/src/app/index.js
 * @description Backend server entry point
 * Clean architecture: Application initialization and wiring
 */

import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { config, validateConfig } from "../shared/config/index.js";
import { swaggerSpec } from "../shared/docs/openapi.js";
import { cacheService } from "./container.js";
import { createLogger } from "../shared/utils/logger.js";
import { errorHandler, requestIdMiddleware } from "../shared/middleware/errorHandler.js";
import routes from "./routes.js";

// Validate required configuration at startup (not at import time)
// Note: config/index.js already loads .env.local — no need for extra dotenv.config() here
validateConfig();

const logger = createLogger("Server");
const app = express();

// CORS must be first — before body parsers — so error responses also carry CORS headers
// CORS configuration with explicit origin whitelist
const allowedOrigins = [
  config.frontendUrl, // Production frontend (from FRONTEND_URL env var)
  "http://localhost:5173", // Local Vite dev server
  "http://localhost:5174", // Local Vite dev server (fallback port)
  "http://localhost:3000", // Alternative local port
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is explicitly whitelisted
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow Vercel preview deployments (*.vercel.app)
      if (origin.endsWith(".vercel.app")) {
        logger.info(`CORS: Allowing Vercel preview origin: ${origin}`);
        return callback(null, true);
      }

      // Allow Railway preview deployments (*.up.railway.app)
      if (origin.endsWith(".up.railway.app")) {
        logger.info(`CORS: Allowing Railway preview origin: ${origin}`);
        return callback(null, true);
      }

      // Reject all other origins
      logger.warn(`CORS: Rejected origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true, // Required for cookie-based auth
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Body parsers after CORS so error responses always include CORS headers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request ID middleware
app.use(requestIdMiddleware);

// Mount routes under /api
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
