// Shared API route constants for both frontend and backend
// Usage: import { API_ROUTES } from "../../shared/constants/apiPaths";

export const API_ROUTES = {
  // New structured conversation routes
  conversationTextGenerate: "/api/conversation/text/generate",
  conversationAudioGenerate: "/api/conversation/audio/generate",
  ttsAudio: "/api/get-tts-audio",
};

// Route patterns for Express.js (without /api prefix)
export const ROUTE_PATTERNS = {
  // New patterns
  conversationTextGenerate: "/conversation/text/generate",
  conversationAudioGenerate: "/conversation/audio/generate",
  ttsAudio: "/get-tts-audio",
};
