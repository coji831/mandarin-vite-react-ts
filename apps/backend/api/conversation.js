/**
 * @file apps/backend/api/conversation.js
 * @description Vercel serverless handler for unified Conversation API endpoint.
 *
 * This handler provides a stateless entry point for the /api/conversation endpoint,
 * supporting both conversation text generation and per-turn audio generation via
 * type-based routing.
 *
 * @endpoint POST /api/conversation
 * @request { type: "text", wordId: string, word: string } - Generate conversation turns
 * @request { type: "audio", wordId: string, turnIndex: number, text: string, voice?: string } - Generate turn audio
 * @response { conversation: object, mode: string } - For type: "text"
 * @response { audioUrl: string } - For type: "audio"
 *
 * @architecture Vercel Serverless Function (stateless, unified endpoint)
 * @see apps/backend/docs/api-spec.md for full endpoint documentation
 */
import express from "express";
import conversationRouter from "../controllers/conversationController.js";

export default async function handler(req, res) {
  const app = express();
  app.use(express.json());
  app.use("/", conversationRouter);

  return app(req, res);
}
