/**
 * @file api/conversation.js
 * @description Vercel serverless handler for unified Conversation API endpoint.
 *
 * This handler provides a stateless entry point for the /api/conversation endpoint,
 * supporting both conversation text generation and per-turn audio generation via
 * type-based routing.
 *
 * @endpoint POST /api/conversation
 * @request { type: "text", wordId: string, word: string } - Generate conversation turns
 * @request { type: "audio", conversationId: string, turnIndex: number, text: string, language: string } - Generate turn audio
 * @response { conversation: { id, wordId, word, turns: ConversationTurn[] } } - For type: "text"
 * @response { audioUrl: string } - For type: "audio"
 *
 * @dependencies
 * - api/_lib/controllers/conversationController.js - Type routing and orchestration
 *
 * @architecture Vercel Serverless Function (stateless, unified endpoint)
 * @related local-backend/controllers/conversationController.js (Express version with separate routes)
 * @see api/docs/api-spec.md for full endpoint documentation
 */
import { conversationController } from "./_lib/controllers/conversationController.js";

export default async function handler(req, res) {
  // Vercel provides (req, res) similar to Express, but stateless
  try {
    await conversationController(req, res);
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
