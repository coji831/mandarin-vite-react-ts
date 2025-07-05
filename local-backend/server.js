// local-backend/server.js (Local Node.js Express Server)

// Load environment variables from .env.local file in the project root
// The path is relative to this server.js file.

import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import dotenv from "dotenv";
import express, { json } from "express";

dotenv.config({ path: ".env.local" });
const app = express();
const PORT = 3001; // Choose a port for your local backend (e.g., 3001)

// Middleware to parse JSON request bodies
app.use(json());

// Initialize Google Cloud Text-to-Speech client
let textToSpeechClient;

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
} catch (initError) {
  console.error(
    "[Local Backend Init Error] Failed to initialize Text-to-Speech client:",
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

  try {
    console.log(`[Local Backend] Preparing TTS request for: "${text}"`);
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
    const audioContent = response.audioContent;
    console.log(
      "[Local Backend] synthesizeSpeech API call successful. Audio content received.",
    );

    // Set the appropriate Content-Type header for MP3 audio
    res.setHeader("Content-Type", "audio/mpeg");
    // Send the raw audio content directly as the response
    res.status(200).send(audioContent);
    console.log("[Local Backend] Audio sent successfully.");
  } catch (error) {
    console.error(
      "[Local Backend Error] Error during speech synthesis or response sending:",
      error,
    );
    // Provide more specific error messages if possible
    if (error.code === 7 || error.details?.includes("API key not valid")) {
      res
        .status(500)
        .send("Authentication error with TTS API. Check local backend logs.");
    } else if (
      error.code === 3 &&
      error.details?.includes("Billing account not enabled")
    ) {
      res
        .status(500)
        .send("Google Cloud Billing not enabled. Check local backend logs.");
    } else {
      res.status(500).send("Error generating audio.");
    }
  }
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`[Local Backend] Server listening on http://localhost:${PORT}`);
});
