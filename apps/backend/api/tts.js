/**
 * @file apps/backend/api/tts.js
 * @description Vercel serverless handler for Text-to-Speech API endpoint.
 *
 * This handler provides a stateless entry point for the /api/tts endpoint,
 * delegating all business logic to the consolidated ttsController.
 *
 * @endpoint POST /api/tts
 * @request { text: string, voice?: string }
 * @response { audioUrl: string, cached: boolean }
 *
 * @architecture Vercel Serverless Function (stateless)
 * @see apps/backend/docs/api-spec.md for full endpoint documentation
 */
import express from "express";
import ttsRouter from "../controllers/ttsController.js";

export default async function handler(req, res) {
  const app = express();
  app.use(express.json());
  app.use("/", ttsRouter);

  return app(req, res);
}
