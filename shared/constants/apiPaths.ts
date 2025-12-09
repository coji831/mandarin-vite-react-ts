// Shared API route constants for both frontend and backend
// Usage: import { API_ROUTES } from "../../shared/constants/apiPaths";

// Updated for Vercel serverless migration (December 2025)
export const API_ROUTES = {
  // TTS endpoint (migrated from /api/get-tts-audio)
  ttsAudio: "/api/tts",

  // Unified conversation endpoint with type-based routing
  // Use with { type: "text" } or { type: "audio" }
  conversation: "/api/conversation",

  // Legacy paths (deprecated, keep for backward compatibility during transition)
  conversationTextGenerate: "/api/conversation", // Use { type: "text" }
  conversationAudioGenerate: "/api/conversation", // Use { type: "audio" }
};

// Route patterns for Express.js (without /api prefix)
// Note: ROUTE_PATTERNS are for local-backend Express routes only
export const ROUTE_PATTERNS = {
  conversationTextGenerate: "/text/generate",
  conversationAudioGenerate: "/audio/generate",
  ttsAudio: "/get-tts-audio",
};
