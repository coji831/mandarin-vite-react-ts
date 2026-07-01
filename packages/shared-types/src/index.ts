/**
 * Shared TypeScript types for Mandarin Learning App
 * Exports common types used across frontend and backend
 */

// Foundations types (Story 18.1)
export interface FoundationProgress {
  sectionId: string;
  completed: boolean;
  completedAt: string | null;
}

export interface PhaseGate {
  id: string;
  currentPhase: number;
  phase1Passed: boolean;
  phase2Passed: boolean;
  phase3Passed: boolean;
  phase4Unlocked: boolean;
  qualificationScore?: number;
  placedPhase?: number;
  phase1Retention?: number;
  phase2Retention?: number;
  phase3Retention?: number;
  gateCriteria: string | null;
  createdAt: string;
  updatedAt: string;
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

// Audio API types (Story 14.6)
export interface WordAudio {
  audioUrl: string;
  audioContent?: string;
  text: string;
  languageCode?: string;
  voiceName?: string;
}

export interface WordAudioRequest {
  chinese: string;
  voice?: string;
}

export interface WordAudioApiResponse {
  success: boolean;
  data: WordAudio;
  message?: string;
}

export interface TurnAudioRequest {
  wordId: string;
  turnIndex: number;
  text: string;
  voice?: string;
}

export interface TurnAudioResponse {
  audioUrl: string;
}

export interface TurnAudioApiResponse {
  success: boolean;
  data: TurnAudioResponse;
  message?: string;
}

export interface ConversationAudio {
  audioUrl: string;
  conversationId?: string;
  turnIndex?: number;
}

export interface ConversationAudioRequest {
  conversationId: string;
  turnIndex?: number;
  text?: string;
}

// Quiz types (Story 18.6)
export interface QuizAttempt {
  id: string;
  userId: string;
  quizType: string;
  phase?: number;
  totalScore: number;
  maxScore: number;
  passed: boolean;
  createdAt: string;
  completedAt: string | null;
}

export interface QuizAttemptAnswer {
  id: string;
  attemptId: string;
  questionIndex: number;
  pinyinInput: string;
  selectedTone: number;
  correctPinyin: string;
  correctTone: number;
  correct: boolean;
  category: string;
}

export interface QuizQuestion {
  id: string;
  audioKey: string;
  correctPinyin: string;
  correctTone: number;
  category: "pinyin" | "tones" | "pairs" | "rules";
  displayPinyin?: string;
}

export interface CategoryBreakdown {
  pinyin: number;
  tones: number;
  pairs: number;
  rules: number;
}

export interface GateQuizResult {
  totalScore: number;
  maxScore: number;
  passed: boolean;
  accuracy: number;
  categoryBreakdown: CategoryBreakdown;
}

// Quiz & Spaced Repetition types (Epic 15: Learning Retention)
/**
 * Quiz result audit record (Story 15.1)
 */
export interface QuizResult {
  id: string;
  userId: string;
  wordId: string;
  correct: boolean;
  questionType: "multiple_choice" | "type_pinyin" | "type_character";
  timeSpentMs: number | null;
  answeredAt: string; // ISO 8601 datetime
}

/**
 * Study streak tracking (Story 15.1)
 */
export interface StudyStreak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string; // ISO 8601 datetime
  freezeCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Record quiz result request payload (Story 15.1)
 */
export interface RecordQuizResultRequest {
  wordId: string;
  correct: boolean;
  questionType: "multiple_choice" | "type_pinyin" | "type_character";
  timeSpentMs?: number;
}

/**
 * Record quiz result response (Story 15.1)
 */
export interface RecordQuizResultResponse {
  nextReviewDate: string; // ISO 8601 datetime
  lapseCount: number;
  isLeech: boolean;
}

// API Response types (Story 14.2a - Enhanced)
export * from "./api";
