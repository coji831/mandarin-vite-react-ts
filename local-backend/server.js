// local-backend/server.js  (Updated for Stage 2: GCS Caching)

// Load environment variables from .env.local file in the project root
// The path is relative to this server.js file.

import { Storage } from "@google-cloud/storage"; // For Google Cloud Storage interaction
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import dotenv from "dotenv";
import express, { json } from "express";
import md5 from "md5"; // For hashing text

dotenv.config({ path: ".env.local" });
const app = express();
const PORT = 3001; // Choose a port for your local backend (e.g., 3001)

// Middleware to parse JSON request bodies
app.use(json());

// Initialize Google Cloud Text-to-Speech client
let textToSpeechClient;
let storageClient;
let GCS_BUCKET_NAME; // Declare here to be accessible

try {
  console.log(
    "[Local Backend Init] Initializing Google Cloud Text-to-Speech client...",
  );
  // Explicitly parse the credential JSON from the environment variable
  const credentialsJson = process.env.GOOGLE_TTS_CREDENTIALS_RAW;
  if (!credentialsJson) {
    throw new Error(
      "GOOGLE_TTS_CREDENTIALS_RAW environment variable is not set in .env.local.",
    );
  }
  const credentials = JSON.parse(credentialsJson);
  textToSpeechClient = new TextToSpeechClient({ credentials });
  console.log(
    "[Local Backend Init] Google Cloud Text-to-Speech client initialized.",
  );

  GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME; // Get bucket name
  if (!GCS_BUCKET_NAME) {
    throw new Error(
      "GCS_BUCKET_NAME environment variable is not set in .env.local. Caching will not work.",
    );
  }
  storageClient = new Storage({ credentials }); // Initialize Storage client

  console.log(
    `[Local Backend Init] GCS Caching enabled for bucket: ${GCS_BUCKET_NAME}`,
  );

  console.log("[Local Backend Init] Google Cloud clients initialized.");
} catch (initError) {
  console.error(
    "[Local Backend Init Error] Failed to initialize Google Cloud clients:",
    initError,
  );
  // Exit the process if critical initialization fails
  process.exit(1);
}

// Define your TTS API endpoint
app.post("/api/get-tts-audio", async (req, res) => {
  console.log("[Local Backend] Request received at /api/get-tts-audio");

  const { text } = req.body;

  if (!text || text.trim() === "") {
    console.log("[Local Backend] Text is empty or whitespace.");
    return res.status(400).send("Text is required.");
  }

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 15) {
    console.log(`[Local Backend] Word count out of range: ${words.length}`);
    return res.status(400).send("Please enter between 1 and 15 words.");
  }

  // --- Caching Logic (New in Stage 2) ---
  const textHash = md5(text); // Create a unique hash for the text
  const filename = `${textHash}.mp3`;
  const gcsFile = storageClient.bucket(GCS_BUCKET_NAME).file(filename);

  try {
    // 1. Check if file exists in GCS (cache hit)
    const [exists] = await gcsFile.exists();
    if (exists) {
      const audioUrl = `https://storage.googleapis.com/${GCS_BUCKET_NAME}/${filename}`;
      console.log(
        `[Local Backend] GCS Cache Hit: ${filename}. Serving from ${audioUrl}`,
      );
      return res.status(200).json({ audioUrl }); // Return JSON with URL
    }

    // 2. Cache Miss: Generate new audio
    console.log(`[Local Backend] Cache Miss. Generating audio for: "${text}"`);

    const request = {
      input: { text: text },
      voice: {
        languageCode: "cmn-CN",
        name: "cmn-CN-Wavenet-B",
        ssmlGender: "FEMALE",
      },
      audioConfig: { audioEncoding: "MP3" },
    };

    console.log("[Local Backend] Calling synthesizeSpeech API...");
    const [response] = await textToSpeechClient.synthesizeSpeech(request);
    // This is a Node.js Buffer
    const audioContent = response.audioContent;

    // 3. Upload to GCS
    await gcsFile.save(audioContent, {
      metadata: { contentType: "audio/mpeg" },
      public: true, // Make the object publicly readable
    });
    const audioUrl = `https://storage.googleapis.com/${GCS_BUCKET_NAME}/${filename}`;
    console.log(
      `[Local Backend] Uploaded to GCS: ${filename}. Serving from ${audioUrl}`,
    );

    // Return JSON with the public URL of the audio file
    res.status(200).json({ audioUrl });
  } catch (error) {
    console.error(
      "[Local Backend Error] Error during speech synthesis or GCS operation:",
      error,
    );
    if (error.code === 7 || error.details?.includes("API key not valid")) {
      res
        .status(500)
        .send(
          "Authentication error with TTS/GCS API. Check local backend logs.",
        );
    } else if (
      error.code === 3 &&
      error.details?.includes("Billing account not enabled")
    ) {
      res
        .status(500)
        .send("Google Cloud Billing not enabled. Check local backend logs.");
    } else if (error.code === 403 && error.details?.includes("Forbidden")) {
      // Specific GCS permission error
      res
        .status(500)
        .send(
          "GCS permission denied. Ensure service account has Storage Object Creator/Viewer roles.",
        );
    } else {
      res.status(500).send("Error generating or caching audio.");
    }
  }
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`[Local Backend] Server listening on http://localhost:${PORT}`);
});
