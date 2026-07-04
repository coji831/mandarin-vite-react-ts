/**
 * @file apps/backend/src/app/index.ts
 * @description Backend server entry point
 * Clean architecture: Application initialization and wiring
 */

import cookieParser from "cookie-parser";
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
const app: express.Application = express();

// Catch unhandled errors so we see crashes in Railway logs
process.on("uncaughtException", (err) => {
  logger.error("FATAL: uncaughtException — process will exit", err);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  logger.error("FATAL: unhandledRejection — process may exit", reason);
});

// CORS must be first — before body parsers — so error responses also carry CORS headers
// TEMPORARY: allow all origins to debug Railway staging CORS issue
app.use(cors({ origin: true, credentials: true }));
/*
// CORS configuration with explicit origin whitelist
const allowedOrigins: string[] = [
  config.frontendUrl, // Production frontend (from FRONTEND_URL env var)
  "http://localhost:5173", // Local Vite dev server
  "http://localhost:5174", // Local Vite dev server (fallback port)
  "http://localhost:3000", // Alternative local port
];

app.use(
  cors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
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
*/

// Body parsers after CORS so error responses always include CORS headers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser for httpOnly cookie-based auth
app.use(cookieParser());

// Request ID middleware
app.use(requestIdMiddleware);

// Mount routes under /api
app.use("/api", routes);

// Swagger API documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (req: express.Request, res: express.Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Error handling middleware (must be last)
app.use(errorHandler);

/**
 * Type guard: checks if an object has a quit method (e.g. Redis connection).
 */
function hasQuitMethod(obj: unknown): obj is { quit: () => Promise<void> } {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "quit" in obj &&
    typeof (obj as { quit: unknown }).quit === "function"
  );
}

// Graceful shutdown handler
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");
  try {
    // Close Redis connection via CacheService if available
    if (hasQuitMethod(cacheService)) {
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
    // Close Redis connection via CacheService if available
    if (hasQuitMethod(cacheService)) {
      await cacheService.quit();
      logger.info("Cache connection closed");
    }
  } catch (error) {
    logger.error("Error during shutdown", error);
  }
  process.exit(0);
});

// Start server — bind to 0.0.0.0 as required by Railway's edge proxy
app.listen(config.port, "0.0.0.0", () => {
  logger.info(`Backend server running on port ${config.port}`);
  logger.info(`API docs: http://localhost:${config.port}/api-docs`);
  logger.info(`Environment: ${config.nodeEnvironment}`);
  logger.info("Server ready — accepting connections");
});

export default app;
