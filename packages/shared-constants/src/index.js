/**
 * Shared constants for Mandarin Learning App
 * JavaScript version for Node.js backend
 */

// Route Patterns - Backend usage (Express route patterns without /api prefix)
export const ROUTE_PATTERNS = {
  health: "/v1/health",
  ttsAudio: "/v1/tts",
  quizFeedback: "/v1/quiz/feedback",
  authRegister: "/v1/auth/register",
  authLogin: "/v1/auth/login",
  authRefresh: "/v1/auth/refresh",
  authLogout: "/v1/auth/logout",
  authMe: "/v1/auth/me",
  progressionFoundationProgress: "/v1/progression/foundation-progress",
  progressionFoundationProgressSection: (sectionId) =>
    `/v1/progression/foundation-progress/${sectionId}`,
  progressionPhaseGate: "/v1/progression/phase-gate",
  progressionGates: "/v1/progression/gates",
  progressionRadicalProgress: "/v1/progression/radical-progress",
  progressionRadicalProgressById: (radicalId) => `/v1/progression/radical-progress/${radicalId}`,
  quizAttempts: "/v1/quiz/attempts",
  quizAttemptAnswer: (id) => `/v1/quiz/attempts/${id}/answers`,
  quizAttemptComplete: (id) => `/v1/quiz/attempts/${id}/complete`,
  reviewItems: "/v1/review/items",
  reviewResult: "/v1/review/result",
  reviewDueCount: "/v1/review/due-count",
  radicals: "/v1/radicals",
  radicalsById: (radicalId) => `/v1/radicals/${radicalId}`,
  radicalsByCharacter: (glyph) => `/v1/radicals/character/${glyph}`,
  radicalsCharacters: (radicalId) => `/v1/radicals/${radicalId}/characters`,
  foundationsPinyinTones: "/v1/foundations/data/pinyin-tones",
  foundationsPinyinCharacterMap: "/v1/foundations/data/pinyin-character-map",
  foundationsStrokes: "/v1/foundations/data/strokes",
  charactersByGlyph: (glyph) => `/v1/characters/${glyph}`,
  wordsByGlyph: (glyph) => `/v1/words/${glyph}`,
  wordsMeasureWords: (wordId) => `/v1/words/${wordId}/measure-words`,
  mnemonics: "/v1/mnemonics",
  mnemonicsByChar: (glyph) => `/v1/mnemonics/${glyph}`,
  quizConfig: "/v1/quiz/config",
  quizQuestions: "/v1/quiz/questions",
  quizSandhiDrill: "/v1/quiz/sandhi-drill/questions",
  readersPassages: "/v1/readers/passages",
  readersPassageById: (id) => `/v1/readers/passages/${id}`,
  readersGenerate: "/v1/readers/generate",
  readersPassageAudioById: (id) => `/v1/readers/passages/${id}/audio`,
  readersSessionByPassageId: (id) => `/v1/readers/sessions/${id}`,
  readersSessionCompleteByPassageId: (id) => `/v1/readers/sessions/${id}/complete`,
  readersBookmarks: "/v1/readers/bookmarks",
  readersBookmarkByPassageId: (id) => `/v1/readers/bookmarks/by-passage/${id}`,
  phoneticClusters: "/v1/phonetic-clusters",
  phoneticClustersById: (id) => `/v1/phonetic-clusters/${id}`,
  charactersPhonetic: (glyph) => `/v1/characters/${glyph}/phonetic`,
  charactersHomophones: (glyph) => `/v1/characters/${glyph}/homophones`,
  charactersDecomposition: (glyph) => `/v1/characters/${glyph}/decomposition`,
  charactersSearch: "/v1/characters/search",
  charactersFrequency: "/v1/characters/frequency",
  radicalsCharacters: (radicalId) => `/v1/radicals/${radicalId}/characters`,
  pinyinSearch: "/v1/pinyin/search",
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

/**
 * Creates a guest phase gate response — returned when no user is authenticated.
 * All phases unlocked (currentPhase: 4) so guests can browse all content.
 */
export function createGuestPhaseGate() {
  const now = new Date().toISOString();
  return {
    id: "guest-unlocked",
    currentPhase: 4,
    phase1Passed: false,
    phase2Passed: false,
    phase3Passed: false,
    phase4Unlocked: true,
    qualificationScore: null,
    placedPhase: null,
    phase1Retention: null,
    phase2Retention: null,
    phase3Retention: null,
    gateCriteria: null,
    createdAt: now,
    updatedAt: now,
  };
}

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

// HSK Word/Character Counts
export {
  HSK_WORD_COUNTS,
  HSK_CHAR_COUNTS,
  getCumulativeWordCount,
  getCumulativeCharCount,
} from "./hsk-word-counts.js";
