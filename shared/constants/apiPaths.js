// Shared API route constants for both frontend and backend
// Usage: import { API_ROUTES } from "../../shared/constants/apiPaths";

export const API_ROUTES = {
  // New structured conversation routes
  conversationText: "/api/conversation/text",
  conversationTextGenerate: "/api/conversation/text/generate",
  conversationTextGeneratorDirect: "/api/conversation/text/generate/direct",

  // Audio routes under conversation namespace
  conversationAudio: (hash) => `/api/conversation/audio/${hash}`,
  conversationAudioGenerate: "/api/conversation/audio/generate",
  ttsAudio: "/api/get-tts-audio",
};

// Route patterns for Express.js (without /api prefix)
export const ROUTE_PATTERNS = {
  // New patterns
  conversationText: "/conversation/text",
  conversationTextGenerate: "/conversation/text/generate",
  conversationTextGeneratorDirect: "/conversation/text/generate/direct",

  conversationAudio: "/conversation/audio/:hash",
  conversationAudioGenerate: "/conversation/audio/generate",
  ttsAudio: "/get-tts-audio",
};
