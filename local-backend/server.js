// local-backend/server.js
// Main Express server with mode-based initialization and route configuration

import express, { json } from "express";

import { config } from "./config/index.js";
import mainRouter from "./routes/index.js";
import { initializeGCS } from "./services/gcsService.js";
import { requestIdMiddleware, errorHandler } from "./middleware/errorHandler.js";
import { createLogger } from "./utils/logger.js";
import { configureScaffoldRoutes } from "./controllers/scaffoldController.js";

const logger = createLogger("Server");

const app = express();
const PORT = config.port;

// Middleware to parse JSON request bodies
app.use(json());

// Request ID middleware for all requests
app.use(requestIdMiddleware);

logger.info(`Starting in ${config.conversationMode.toUpperCase()} mode...`);

// Initialize Google Cloud services
// Note: Config module already validated credentials for real mode
// In scaffold mode, services will handle missing credentials gracefully
if (config.gcsCredentials && config.gcsBucket) {
  initializeGCS(config.gcsCredentials, config.gcsBucket);
  logger.info(`GCS service initialized for bucket: ${config.gcsBucket}`);
}

// CORS middleware for all API routes
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Register API routes (feature-based)
app.use("/api", mainRouter);

// Configure mode-specific routes
configureScaffoldRoutes(app); // Static file serving in scaffold mode

// Error handler middleware (must be after all routes)
app.use(errorHandler);

logger.info(`Backend started in ${config.conversationMode.toUpperCase()} mode: READY`);

// Start the Express server
app.listen(PORT, () => {
  logger.info(`Server listening on http://localhost:${PORT}`);
});

/*
Required environment variables:
- CONVERSATION_MODE: "scaffold" for fixture mode, "real" for Gemini/TTS/GCS mode
- GCS_BUCKET_NAME: Google Cloud Storage bucket for audio/conversation cache
- GEMINI_API_CREDENTIALS_RAW: Service account JSON for Gemini API and GCS
- GOOGLE_TTS_CREDENTIALS_RAW: Service account JSON for GCP TTS
*/
