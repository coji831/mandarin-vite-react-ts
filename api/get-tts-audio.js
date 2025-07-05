// api/get-tts-audio.js (For Vercel Production Deployment)
// This file is automatically detected by Vercel as a Serverless Function.

// Import the Google Cloud Text-to-Speech client library
import { TextToSpeechClient } from "@google-cloud/text-to-speech";

// Initialize the Text-to-Speech client.
// In Vercel's production environment, the GOOGLE_APPLICATION_CREDENTIALS_JSON
// environment variable (which you'll set in Vercel's dashboard) is automatically
// picked up by the Google Cloud client libraries for authentication.
const textToSpeechClient = new TextToSpeechClient();

// The main handler function for the Vercel Serverless Function
export default async (req, res) => {
  // Ensure the request method is POST
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  // Extract text from the request body
  const { text } = req.body;

  // Basic input validation
  if (!text || text.trim() === "") {
    return res.status(400).send("Text is required.");
  }

  // Enforce the 1 to 15 word limit
  const words = text.split(/\s+/).filter(Boolean); // Splits by whitespace and removes empty strings
  if (words.length === 0 || words.length > 15) {
    return res.status(400).send("Please enter between 1 and 15 words.");
  }

  try {
    // Configure the speech synthesis request
    const request = {
      input: { text: text }, // The text to be converted
      // Select the language code for Mandarin Chinese (cmn-CN for Mainland China)
      // Use a high-quality WaveNet voice for best results and natural intonation
      voice: {
        languageCode: "cmn-CN",
        name: "cmn-CN-Wavenet-B",
        ssmlGender: "FEMALE",
      },
      audioConfig: { audioEncoding: "MP3" }, // Request MP3 audio format
    };

    // Call the Text-to-Speech API to synthesize the speech
    const [response] = await textToSpeechClient.synthesizeSpeech(request);
    const audioContent = response.audioContent; // This is a Node.js Buffer containing the audio data

    // Set the appropriate Content-Type header for MP3 audio
    res.setHeader("Content-Type", "audio/mpeg");
    // Send the raw audio content directly as the response
    res.status(200).send(audioContent);
  } catch (error) {
    // Log any errors that occur during the process
    console.error("Error synthesizing speech:", error);
    // Send a 500 Internal Server Error response to the client
    res.status(500).send("Error generating audio.");
  }
};
