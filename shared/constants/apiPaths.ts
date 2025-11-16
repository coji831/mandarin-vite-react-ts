// Shared API route constants for both frontend and backend
// Usage: import { API_ROUTES } from "../../shared/constants/apiPaths";

export const API_ROUTES = {
  // New structured conversation routes
  // Note: serverless functions have been reorganized under api/mandarin/conversation/*
  // The runtime paths are kept the same for backward compatibility.
  conversationTextGenerate: "/api/mandarin/conversation/text/generate",

  // Audio routes under conversation namespace
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
