// api/get-tts-audio.js (Updated for ES Module Syntax on Vercel)

// Use ES Module import syntax
import { TextToSpeechClient } from "@google-cloud/text-to-speech";

// Initialize the Text-to-Speech client.
// This code explicitly reads the GOOGLE_TTS_CREDENTIALS_RAW environment variable,
// which you must set in your Vercel project's Environment Variables.
let textToSpeechClient; // Declare client outside to potentially reuse across warm invocations

// Use ES Module export syntax for the Vercel Serverless Function handler
export default async function handler(req, res) {
  // Renamed to 'handler' for clarity, but 'default' is key
  console.log("[Vercel Function Start] Request received.");

  // Initialize client only once per function instance (cold start)
  if (!textToSpeechClient) {
    try {
      console.log("[Vercel Function Init] Initializing TextToSpeechClient...");
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
      console.log("[Vercel Function Init] TextToSpeechClient initialized.");
    } catch (initError) {
      console.error(
        "[Vercel Function Init Error] Failed to initialize TextToSpeechClient:",
        initError,
      );
      // Send a 500 Internal Server Error response to the client
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

  try {
    console.log(`[Vercel Function] Preparing TTS request for: "${text}"`);
    // Configure the speech synthesis request
    const request = {
      input: { text }, // The text to be converted
      // Select the language code for Mandarin Chinese (cmn-CN for Mainland China)
      // Use a high-quality WaveNet voice for best results and natural intonation
      voice: {
        languageCode: "cmn-CN",
        name: "cmn-CN-Wavenet-B",
        ssmlGender: "FEMALE",
      },
      audioConfig: { audioEncoding: "MP3" },
    };

    console.log("[Vercel Function] Calling synthesizeSpeech API...");
    const [response] = await textToSpeechClient.synthesizeSpeech(request);
    const audioContent = response.audioContent;
    console.log(
      "[Vercel Function] synthesizeSpeech API call successful. Audio content received.",
    );

    res.setHeader("Content-Type", "audio/mpeg");
    res.status(200).send(audioContent);
    console.log("[Vercel Function End] Audio sent successfully.");
  } catch (error) {
    console.error(
      "[Vercel Function Error] Error during speech synthesis or response sending:",
      error,
    );
    // Check for specific Google Cloud errors if possible
    if (error.code === 7 || error.details?.includes("API key not valid")) {
      // Example: UNAUTHENTICATED (7)
      console.error(
        "[Vercel Function Error] Authentication issue with Google Cloud TTS API. Check GOOGLE_TTS_CREDENTIALS_RAW in Vercel settings.",
      );
      res
        .status(500)
        .send("Authentication error with TTS API. Please check Vercel logs.");
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
    } else {
      res.status(500).send("Error generating audio.");
    }
  }
}
