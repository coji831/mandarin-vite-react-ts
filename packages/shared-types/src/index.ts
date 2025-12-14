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

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
