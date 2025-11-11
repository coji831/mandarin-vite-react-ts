// local-backend/server.js  (Updated for Stage 2: GCS Caching)

// Load environment variables from .env.local file in the project root
// The path is relative to this server.js file.

import { Storage } from "@google-cloud/storage"; // For Google Cloud Storage interaction
import dotenv from "dotenv";
import express, { json } from "express";
import path from "path";

import { fileURLToPath } from "url";
import conversationRoutes from "./routes/conversation.js";
import ttsRoutes from "./routes/tts.js";
import { initializeStorage } from "./utils/conversationCache.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from project root
const envPath = path.resolve(__dirname, "..", ".env.local");
console.log(`[Server] Loading env from: ${envPath}`);
dotenv.config({ path: envPath });

const app = express();
const PORT = 3001; // Choose a port for your local backend (e.g., 3001)

// Middleware to parse JSON request bodies
app.use(json());

const conversationMode = process.env.CONVERSATION_MODE;

console.log(
  `[Local Backend Init] Starting in ${
    conversationMode ? conversationMode.toUpperCase() : "UNDEFINED"
  } mode...`
);

// Initialize Google Cloud clients only in real mode
let storageClient;
let GCS_BUCKET_NAME;

if (conversationMode === "real") {
  try {
    console.log("[Local Backend Init] Real mode: Initializing Google Cloud clients...");

    // Parse credentials for GCS (use Gemini credentials for GCS operations)
    const gcsCredentialsJson = process.env.GEMINI_API_CREDENTIALS_RAW;
    if (!gcsCredentialsJson) {
      throw new Error("GEMINI_API_CREDENTIALS_RAW environment variable is not set in .env.local.");
    }
    const gcsCredentials = JSON.parse(gcsCredentialsJson);

    GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME;
    if (!GCS_BUCKET_NAME) {
      throw new Error(
        "GCS_BUCKET_NAME environment variable is not set in .env.local. Caching will not work."
      );
    }

    storageClient = new Storage({
      credentials: gcsCredentials,
      projectId: gcsCredentials.project_id,
    });

    // Initialize conversation generator with storage client
    initializeStorage(storageClient, GCS_BUCKET_NAME);

    console.log(`[Local Backend Init] GCS Caching enabled for bucket: ${GCS_BUCKET_NAME}`);
    console.log("[Local Backend Init] Google Cloud clients initialized.");
  } catch (initError) {
    console.error(
      "[Local Backend Init Error] Failed to initialize Google Cloud clients:",
      initError
    );
    process.exit(1);
  }
} else {
  console.log("[Local Backend Init] Scaffold mode: Skipping Google Cloud client initialization.");
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

// Register API routes
app.use("/api", conversationRoutes);
app.use("/api", ttsRoutes);

// Scaffolder/static serving (only in scaffold mode)
if (conversationMode === "scaffold") {
  app.use("/data", express.static(path.join(__dirname, "..", "public", "data")));
  app.use("/data/examples/conversations/audio", (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Range");
    res.header("Access-Control-Expose-Headers", "Content-Range, Content-Length");
    next();
  });
  console.log("Local backend started in SCAFFOLD mode:", "ENABLED");
} else {
  // Real mode: Add audio proxy endpoint to handle CORS for GCS audio files
  app.get("/audio/:filename", async (req, res) => {
    try {
      const { filename } = req.params;
      const audioUrl = `https://storage.googleapis.com/${GCS_BUCKET_NAME}/${filename}`;

      console.log(`[Audio Proxy] Proxying audio file: ${filename}`);

      const fetch = (await import("node-fetch")).default;
      const response = await fetch(audioUrl);

      if (!response.ok) {
        return res.status(404).json({ error: "Audio file not found" });
      }

      // Set proper headers for audio streaming with CORS
      res.set({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Range",
        "Access-Control-Expose-Headers": "Content-Range, Content-Length",
        "Content-Type": response.headers.get("content-type") || "audio/mpeg",
        "Content-Length": response.headers.get("content-length"),
        "Accept-Ranges": "bytes",
      });

      // Handle range requests for audio seeking
      const range = req.headers.range;
      if (range) {
        res.set("Content-Range", response.headers.get("content-range"));
        res.status(206);
      }

      // Get the audio buffer and send it
      const audioBuffer = await response.buffer();
      res.send(audioBuffer);
    } catch (error) {
      console.error("[Audio Proxy] Error:", error);
      res.status(500).json({ error: "Failed to proxy audio file" });
    }
  });

  console.log("Local backend started in REAL mode:", "ENABLED");
}

// Start the Express server
app.listen(PORT, () => {
  console.log(`[Local Backend] Server listening on http://localhost:${PORT}`);
});

/*
Required environment variables:
- CONVERSATION_MODE: "scaffold" for fixture mode, "real" for Gemini/TTS/GCS mode
- GCS_BUCKET_NAME: Google Cloud Storage bucket for audio/conversation cache
- GEMINI_API_CREDENTIALS_RAW: Service account JSON for Gemini API and GCS
- GOOGLE_TTS_CREDENTIALS_RAW: Service account JSON for GCP TTS (used in conversationProcessor)
*/
