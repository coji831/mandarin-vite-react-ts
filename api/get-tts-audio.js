// api/get-tts-audio.js (Updated for Stage 2: GCS Caching on Vercel)

// Use ES Module import syntax
import { Storage } from "@google-cloud/storage"; // Import Storage
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import md5 from "md5"; // Import md5

// Initialize the Text-to-Speech client.
// This code explicitly reads the GOOGLE_TTS_CREDENTIALS_RAW environment variable,
// which you must set in your Vercel project's Environment Variables.
let textToSpeechClient;
let storageClient;
let GCS_BUCKET_NAME; // Declare to be accessible

// Use ES Module export syntax for the Vercel Serverless Function handler
export default async function handler(req, res) {
  // Renamed to 'handler' for clarity, but 'default' is key
  console.log("[Vercel Function Start] Request received.");

  // Initialize clients only once per function instance (cold start)
  if (!textToSpeechClient || !storageClient) {
    try {
      console.log("[Vercel Function Init] Initializing clients...");
      // *** IMPORTANT CHANGE HERE ***
      // Explicitly parse the credential JSON from the environment variable
      const credentialsJson = process.env.GOOGLE_TTS_CREDENTIALS_RAW;
      if (!credentialsJson) {
        // This error will be caught and logged by Vercel if the variable is missing
        throw new Error(
          "GOOGLE_TTS_CREDENTIALS_RAW environment variable is not set on Vercel.",
        );
      }
      const credentials = JSON.parse(credentialsJson);
      textToSpeechClient = new TextToSpeechClient({ credentials });

      GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME;
      if (!GCS_BUCKET_NAME) {
        throw new Error(
          "GCS_BUCKET_NAME environment variable is not set on Vercel. Caching will not work.",
        );
      }
      storageClient = new Storage({ credentials }); // Initialize Storage client with credentials

      console.log(
        `[Vercel Function Init] Clients initialized. GCS Bucket: ${GCS_BUCKET_NAME}`,
      );
    } catch (initError) {
      console.error(
        "[Vercel Function Init Error] Failed to initialize clients:",
        initError,
      );
      return res
        .status(500)
        .send(
          `Server initialization error: ${
            initError.message || "Unknown credential error"
          }.`,
        );
    }
  }

  // Ensure the request method is POST
  if (req.method !== "POST") {
    console.log(`[Vercel Function] Method not allowed: ${req.method}`);
    return res.status(405).send("Method Not Allowed");
  }

  // Extract text from the request body
  const { text } = req.body;

  // Basic input validation
  if (!text || text.trim() === "") {
    console.log("[Vercel Function] Text is empty or whitespace.");
    return res.status(400).send("Text is required.");
  }

  // Enforce the 1 to 15 word limit
  const words = text.split(/\s+/).filter(Boolean); // Splits by whitespace and removes empty strings
  if (words.length === 0 || words.length > 15) {
    console.log(`[Vercel Function] Word count out of range: ${words.length}`);
    return res.status(400).send("Please enter between 1 and 15 words.");
  }

  // --- Caching Logic (New in Stage 2) ---
  const textHash = md5(text);
  const filename = `${textHash}.mp3`;
  const gcsFile = storageClient.bucket(GCS_BUCKET_NAME).file(filename);

  try {
    // 1. Check if file exists in GCS (cache hit)
    const [exists] = await gcsFile.exists();
    if (exists) {
      const audioUrl = `https://storage.googleapis.com/${GCS_BUCKET_NAME}/${filename}`;
      console.log(
        `[Vercel Function] GCS Cache Hit: ${filename}. Serving from ${audioUrl}`,
      );
      return res.status(200).json({ audioUrl }); // Return JSON with URL
    }

    // 2. Cache Miss: Generate new audio
    console.log(
      `[Vercel Function] Cache Miss. Generating audio for: "${text}"`,
    );

    const request = {
      input: { text },
      voice: {
        languageCode: "cmn-CN",
        name: "cmn-CN-Wavenet-B",
        ssmlGender: "FEMALE",
      },
      audioConfig: { audioEncoding: "MP3" },
    };

    const [response] = await textToSpeechClient.synthesizeSpeech(request);
    const audioContent = response.audioContent;

    // 3. Upload to GCS
    await gcsFile.save(audioContent, {
      metadata: { contentType: "audio/mpeg" },
      public: true, // Make the object publicly readable
    });
    const audioUrl = `https://storage.googleapis.com/${GCS_BUCKET_NAME}/${filename}`;
    console.log(
      `[Vercel Function] Uploaded to GCS: ${filename}. Serving from ${audioUrl}`,
    );

    // Return JSON with the public URL of the audio file
    res.status(200).json({ audioUrl });
  } catch (error) {
    console.error(
      "[Vercel Function Error] Error during speech synthesis or GCS operation:",
      error,
    );
    // Check for specific Google Cloud errors if possible
    if (error.code === 7 || error.details?.includes("API key not valid")) {
      // Example: UNAUTHENTICATED (7)
      console.error(
        "[Vercel Function Error] Authentication issue with Google Cloud TTS/GCS API. Check GOOGLE_TTS_CREDENTIALS_RAW in Vercel settings.",
      );
      res
        .status(500)
        .send(
          "Authentication error with TTS/GCS API. Please check Vercel logs.",
        );
    } else if (
      error.code === 3 &&
      error.details?.includes("Billing account not enabled")
    ) {
      console.error(
        "[Vercel Function Error] Google Cloud Billing not enabled.",
      );
      res
        .status(500)
        .send("Google Cloud Billing not enabled. Please check Vercel logs.");
    } else if (error.code === 403 && error.details?.includes("Forbidden")) {
      console.error(
        "[Vercel Function Error] GCS permission denied. Ensure service account has Storage Object Creator/Viewer roles.",
      );
      res
        .status(500)
        .send(
          "GCS permission denied. Please check Vercel logs and service account permissions.",
        );
    } else {
      res.status(500).send("Error generating or caching audio.");
    }
  }
}
