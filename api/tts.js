/**
 * @file api/tts.js
 * @description Vercel serverless handler for Text-to-Speech API endpoint.
 *
 * This handler provides a stateless entry point for the /api/tts endpoint,
 * delegating all business logic to the ttsController. Supports generating
 * audio files from text using Google Cloud TTS, with caching in GCS.
 *
 * @endpoint POST /api/tts
 * @request { text: string, language?: string, voiceName?: string }
 * @response { audioUrl: string }
 *
 * @dependencies
 * - api/_lib/controllers/ttsController.js - TTS validation and orchestration
 *
 * @architecture Vercel Serverless Function (stateless)
 * @related local-backend/controllers/ttsController.js (Express version)
 * @see api/docs/api-spec.md for full endpoint documentation
 */
import { ttsController } from "./_lib/controllers/ttsController.js";

export default async function handler(req, res) {
  // Vercel provides (req, res) similar to Express, but stateless
  // Delegate to controller (refactored for direct call)
  try {
    await ttsController(req, res);
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
