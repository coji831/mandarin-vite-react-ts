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

// Progress API types (Story 13.4)
export interface ProgressResponse {
  id: string;
  wordId: string;
  studyCount: number;
  correctCount: number;
  confidence: number;
  nextReview: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}

export interface ProgressStatsResponse {
  totalWords: number;
  studiedWords: number;
  masteredWords: number;
  totalStudyCount: number;
  averageConfidence: number;
  wordsToReviewToday: number;
}

export interface UpdateProgressRequest {
  studyCount?: number;
  correctCount?: number;
  confidence?: number;
}

export interface BatchUpdateRequest {
  updates: Array<{
    wordId: string;
    studyCount?: number;
    correctCount?: number;
    confidence?: number;
  }>;
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
