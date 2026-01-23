/**
 * TypeScript definitions for shared constants
 * Provides IDE autocomplete for JavaScript exports
 */

// API Endpoints
export declare const API_ENDPOINTS: {
  readonly TTS: string;
  readonly CONVERSATION: string;
  readonly VOCABULARY: string;
  readonly HEALTH: string;
  readonly AUTH_REGISTER: string;
  readonly AUTH_LOGIN: string;
  readonly AUTH_REFRESH: string;
  readonly AUTH_LOGOUT: string;
  readonly AUTH_ME: string;
  readonly PROGRESS: string;
  readonly PROGRESS_WORD: (wordId: string) => string;
  readonly PROGRESS_BATCH: string;
  readonly PROGRESS_STATS: string;
};

// Route Patterns
export declare const ROUTE_PATTERNS: {
  readonly health: string;
  readonly ttsAudio: string;
  readonly vocabulary: string;
  readonly conversations: string;
  readonly conversationTextGenerate: string;
  readonly conversationAudioGenerate: string;
  readonly progress: string;
  readonly progressWord: (wordId: string) => string;
  readonly progressBatch: string;
  readonly progressStats: string;
  readonly authRegister: string;
  readonly authLogin: string;
  readonly authRefresh: string;
  readonly authLogout: string;
  readonly authMe: string;
};

// HSK Levels
export declare const HSK_LEVELS: readonly number[];

// Language Codes
export declare const LANGUAGE_CODES: {
  readonly CHINESE: string;
  readonly ENGLISH: string;
};

// Voice Configuration
export declare const TTS_VOICES: {
  readonly [key: string]: {
    readonly FEMALE: string;
    readonly MALE: string;
  };
};

// Confidence Levels
export declare const CONFIDENCE_LEVELS: {
  readonly NEW: number;
  readonly LEARNING: number;
  readonly FAMILIAR: number;
  readonly KNOWN: number;
  readonly MASTERED: number;
};

// Review Intervals
export declare const REVIEW_INTERVALS: {
  readonly [key: number]: number;
};

// Pagination
export declare const PAGINATION: {
  readonly DEFAULT_PAGE_SIZE: number;
  readonly MAX_PAGE_SIZE: number;
};

// Cache TTL
export declare const CACHE_TTL: {
  readonly VOCABULARY: number;
  readonly USER_PROGRESS: number;
  readonly TTS_AUDIO: number;
};

// Error Messages
export declare const ERROR_MESSAGES: {
  readonly UNAUTHORIZED: string;
  readonly NOT_FOUND: string;
  readonly VALIDATION_ERROR: string;
  readonly SERVER_ERROR: string;
  readonly TTS_ERROR: string;
  readonly CONVERSATION_ERROR: string;
};
