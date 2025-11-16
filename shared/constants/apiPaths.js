// Shared API route constants for both frontend and backend
// Usage: import { API_ROUTES } from "../../shared/constants/apiPaths";

export const API_ROUTES = {
  // New structured conversation routes
  conversationTextGenerate: "/api/mandarin/conversation/text/generate",
  conversationAudioGenerate: "/api/mandarin/conversation/audio/generate",
  ttsAudio: "/api/get-tts-audio",
};

// Route patterns for Express.js (without /api prefix)
export const ROUTE_PATTERNS = {
  // New patterns
  conversationTextGenerate: "/text/generate",
  conversationAudioGenerate: "/audio/generate",
  ttsAudio: "/get-tts-audio",
};
