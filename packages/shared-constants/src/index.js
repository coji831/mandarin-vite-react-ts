/**
 * Shared constants for Mandarin Learning App
 * JavaScript version for Node.js backend
 */

// Route Patterns - Backend usage (Express route patterns without /api prefix)
export const ROUTE_PATTERNS = {
  health: "/v1/health",
  ttsAudio: "/v1/tts",
  conversations: "/v1/conversations",
  conversationTextGenerate: "/text/generate",
  conversationAudioGenerate: "/audio/generate",
  progress: "/v1/progress",
  progressWord: (wordId) => `/v1/progress/${wordId}`,
  progressBatch: "/v1/progress/batch",
  progressStats: "/v1/progress/stats",
  progressStreak: "/v1/progress/streak",
  progressStreakFreeze: "/v1/progress/streak/freeze",
  gamificationBadges: "/v1/gamification/badges",
  quizFeedback: "/v1/quiz/feedback",
  authRegister: "/v1/auth/register",
  authLogin: "/v1/auth/login",
  authRefresh: "/v1/auth/refresh",
  authLogout: "/v1/auth/logout",
  authMe: "/v1/auth/me",
  vocabulary: "/v1/vocabulary",
  examples: "/v1/examples",
  examplesSingleLine: "/single-line",
  examplesAudio: "/audio",
  progressionFoundationProgress: "/v1/progression/foundation-progress",
  progressionFoundationProgressSection: (sectionId) =>
    `/v1/progression/foundation-progress/${sectionId}`,
  progressionPhaseGate: "/v1/progression/phase-gate",
  progressionRadicalProgress: "/v1/progression/radical-progress",
  progressionRadicalProgressById: (radicalId) => `/v1/progression/radical-progress/${radicalId}`,
  quizAttempts: "/v1/quiz/attempts",
  quizAttemptAnswer: (id) => `/v1/quiz/attempts/${id}/answers`,
  quizAttemptComplete: (id) => `/v1/quiz/attempts/${id}/complete`,
  reviewItems: "/v1/review/items",
  reviewResult: "/v1/review/result",
  reviewDueCount: "/v1/review/due-count",
  reviewPoolItems: "/v1/review/pool/items",
  reviewItemRate: (id) => `/v1/review/items/${id}/rate`,
  radicals: "/v1/radicals",
  radicalsById: (radicalId) => `/v1/radicals/${radicalId}`,
  radicalsByCharacter: (glyph) => `/v1/radicals/character/${glyph}`,
  foundationsPinyinTones: "/v1/foundations/data/pinyin-tones",
  foundationsPinyinCharacterMap: "/v1/foundations/data/pinyin-character-map",
  foundationsStrokes: "/v1/foundations/data/strokes",
  quizQuestions: "/v1/quiz/questions",
};

// HSK Levels
export const HSK_LEVELS = [1, 2, 3, 4, 5, 6];

// Language Codes
export const LANGUAGE_CODES = {
  CHINESE: "zh-CN",
  ENGLISH: "en-US",
};

// Foundations
export { FOUNDATION_SECTIONS, FOUNDATION_SECTION_LABELS } from "./foundations.js";

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
