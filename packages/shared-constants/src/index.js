/**
 * Shared constants for Mandarin Learning App
 * JavaScript version for Node.js backend
 */

// API Endpoints
export const API_ENDPOINTS = {
  TTS: "/api/tts",
  CONVERSATION: "/api/conversation",
  HEALTH: "/health",
  AUTH_REGISTER: "/api/v1/auth/register",
  AUTH_LOGIN: "/api/v1/auth/login",
  AUTH_REFRESH: "/api/v1/auth/refresh",
  AUTH_LOGOUT: "/api/v1/auth/logout",
  AUTH_ME: "/api/v1/auth/me",
};

// HSK Levels
export const HSK_LEVELS = [1, 2, 3, 4, 5, 6];

// Language Codes
export const LANGUAGE_CODES = {
  CHINESE: "zh-CN",
  ENGLISH: "en-US",
};

// Voice Configuration
export const TTS_VOICES = {
  "zh-CN": {
    FEMALE: "zh-CN-Wavenet-A",
    MALE: "zh-CN-Wavenet-B",
  },
  "en-US": {
    FEMALE: "en-US-Wavenet-F",
    MALE: "en-US-Wavenet-D",
  },
};

// Confidence Levels
export const CONFIDENCE_LEVELS = {
  NEW: 0,
  LEARNING: 1,
  FAMILIAR: 2,
  KNOWN: 3,
  MASTERED: 4,
};

// Review Intervals (in days)
export const REVIEW_INTERVALS = {
  [CONFIDENCE_LEVELS.NEW]: 0,
  [CONFIDENCE_LEVELS.LEARNING]: 1,
  [CONFIDENCE_LEVELS.FAMILIAR]: 3,
  [CONFIDENCE_LEVELS.KNOWN]: 7,
  [CONFIDENCE_LEVELS.MASTERED]: 14,
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

// Cache TTL (in seconds)
export const CACHE_TTL = {
  VOCABULARY: 3600, // 1 hour
  USER_PROGRESS: 300, // 5 minutes
  TTS_AUDIO: 86400, // 24 hours
};

// Error Messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: "Unauthorized access",
  NOT_FOUND: "Resource not found",
  VALIDATION_ERROR: "Validation error",
  SERVER_ERROR: "Internal server error",
  TTS_ERROR: "Text-to-speech service error",
  CONVERSATION_ERROR: "Conversation service error",
};

// API Routes - Frontend usage (full paths including /api prefix)
export const API_ROUTES = {
  ttsAudio: "/api/tts",
  conversation: "/api/conversation",
  // Legacy (deprecated)
  conversationTextGenerate: "/api/conversation",
  conversationAudioGenerate: "/api/conversation",
};

// Route Patterns - Backend usage (Express route patterns without /api prefix)
export const ROUTE_PATTERNS = {
  ttsAudio: "/tts",
  conversationTextGenerate: "/text/generate",
  conversationAudioGenerate: "/audio/generate",
};
