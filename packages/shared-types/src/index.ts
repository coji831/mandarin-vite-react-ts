/**
 * Shared TypeScript types for Mandarin Learning App
 * Exports common types used across frontend and backend
 */

// Vocabulary types
export interface VocabularyItem {
  id: string;
  chinese: string;
  pinyin: string;
  english: string;
  hskLevel?: number;
  category?: string;
}

// User progress types
export interface UserProgress {
  userId: string;
  itemId: string;
  correctCount: number;
  incorrectCount: number;
  lastReviewed: string;
  confidenceLevel: number;
}

// Progress API types (Story 13.4 / Story 14.4 - Enhanced)
/**
 * Word progress data structure (matches backend schema)
 */
export interface WordProgress {
  wordId: string;
  userId: string;
  studyCount: number;
  correctCount: number;
  confidence: number; // 0.0 - 1.0
  learnedAt: string | null; // ISO 8601 datetime
  nextReviewDate: string | null; // ISO 8601 datetime
  lastReviewedAt: string | null; // ISO 8601 datetime
  createdAt: string;
  updatedAt: string;
}

/**
 * Legacy alias for backward compatibility
 * @deprecated Use WordProgress instead
 */
export interface ProgressResponse {
  id: string;
  wordId: string;
  studyCount: number;
  correctCount: number;
  confidence: number;
  nextReview: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}

/**
 * API response for progress queries
 */
export interface ProgressApiResponse {
  success: boolean;
  data: WordProgress[];
  message?: string;
}

/**
 * API response for single progress item
 */
export interface SingleProgressApiResponse {
  success: boolean;
  data: WordProgress;
  message?: string;
}

export interface ProgressStatsResponse {
  totalWords: number;
  studiedWords: number;
  masteredWords: number;
  totalStudyCount: number;
  averageConfidence: number;
  wordsToReviewToday: number;
}

/**
 * Request payload for updating word progress
 */
export interface UpdateProgressRequest {
  studyCount?: number;
  correctCount?: number;
  confidence?: number;
  learnedAt?: string | null;
  nextReviewDate?: string | null;
  lastReviewedAt?: string | null;
}

/**
 * Request payload for batch progress updates
 */
export interface BatchUpdateRequest {
  updates: Array<{
    wordId: string;
    data: UpdateProgressRequest;
  }>;
}

/**
 * API response for batch updates
 */
export interface BatchUpdateApiResponse {
  success: boolean;
  data: {
    updated: number;
    failed: number;
    results: WordProgress[];
  };
  message?: string;
}

// Conversation types
export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

export interface ConversationRequest {
  messages: ConversationMessage[];
  hskLevel?: number;
  context?: string;
}

export interface ConversationResponse {
  message: ConversationMessage;
  suggestions?: string[];
}

// TTS types
export interface TTSRequest {
  text: string;
  languageCode?: string;
  voiceName?: string;
}

export interface TTSResponse {
  audioContent: string;
  success: boolean;
  error?: string;
}

// API Response types (Story 14.2a - Enhanced)
export * from "./api";
