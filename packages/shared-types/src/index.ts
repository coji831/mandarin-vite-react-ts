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
  qualificationScore: number | null;
  placedPhase: number | null;
  phase1Retention: number | null;
  phase2Retention: number | null;
  phase3Retention: number | null;
  gateCriteria: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Checks if a response is a guest-unlocked phase gate (vs a real persisted one).
 * Guest phase gates have id === "guest-unlocked" and all phases accessible.
 */
export function isGuestPhaseGate(
  gate: PhaseGate | { id: string },
): gate is PhaseGate & { id: "guest-unlocked" } {
  return gate.id === "guest-unlocked";
}

/**
 * Checks if a value is a valid PhaseGate object (has required fields).
 */
export function isPhaseGate(value: unknown): value is PhaseGate {
  if (!value || typeof value !== "object") return false;
  const g = value as Record<string, unknown>;
  return (
    typeof g.id === "string" &&
    typeof g.currentPhase === "number" &&
    typeof g.phase1Passed === "boolean" &&
    typeof g.phase2Passed === "boolean" &&
    typeof g.phase3Passed === "boolean" &&
    typeof g.phase4Unlocked === "boolean"
  );
}

// Pinyin universalization types (Phase 3)
/** A Hanzi glyph (a single Chinese character string). */
export type HanziGlyph = string;

/**
 * Pinyin syllable → Hanzi glyph map (e.g. "ba" → "八", null = unresolvable).
 * Re-declared here to keep shared-types dependency-free (mirrors the canonical
 * `PinyinCharacterMap` exported from @mandarin/shared-utils).
 */
export type PinyinCharacterMap = Record<string, string | null>;

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
  /** True when the backend served a pre-synthesized (cached) file; false when just synthesized. */
  cached?: boolean;
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

// Passage audio wire shapes (Epic 21 — graded readers, D5 promotion)
/** Source indicator for a passage sentence audio URL. */
export type AudioSource = "gcs" | "ondemand" | "failed";

/** Result for a single passage sentence. */
export interface SentenceAudioResult {
  /** Publicly accessible audio URL (empty string if failed). */
  url: string;
  /** How this URL was resolved. */
  source: AudioSource;
}

/** Response body for POST /v1/readers/passages/:id/audio. */
export interface PassageAudioResponse {
  /** Keyed by sentence index (0-based). */
  audioUrls: Record<number, SentenceAudioResult>;
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
  metadata?: {
    neutralToneTested: boolean;
    sandhiQuestions: number;
  } | null;
  createdAt: string;
  completedAt: string | null;
}

export interface QuizAttemptAnswer {
  id: string;
  attemptId: string;
  questionIndex: number;
  pinyinInput: string;
  selectedTone: number;
  /**
   * @deprecated Tri-modal field — use `expectedPinyin` (audio-to-pinyin-tone),
   * `correctOptionId` (radical-gate), or `correctGlyph` (ime-simulator). Kept
   * as the WIRE name (DB column unchanged — do not rename).
   */
  correctPinyin: string;
  correctTone: number;
  correct: boolean;
  category: string;
  /** Audio-to-pinyin-tone: expected pinyin string (marks/digits tolerated). */
  expectedPinyin?: string;
  /** Radical-gate: the correct multiple-choice option id. */
  correctOptionId?: string;
  /** IME-simulator: the expected Hanzi glyph. */
  correctGlyph?: string;
}

export interface QuizQuestion {
  id: string;
  audioKey: string;
  /**
   * @deprecated Tri-modal field — use `expectedPinyin` (audio-to-pinyin-tone),
   * `correctOptionId` (radical-gate), or `correctGlyph` (ime-simulator). Kept
   * as the WIRE name (DB column unchanged — do not rename).
   */
  correctPinyin: string;
  correctTone: number;
  category: "pinyin" | "tones" | "pairs" | "rules";
  displayPinyin?: string;
  isSandhiQuestion?: boolean;
  sandhiRule?: string;
  /** Audio-to-pinyin-tone: expected pinyin string (marks/digits tolerated). */
  expectedPinyin?: string;
  /** Radical-gate: the correct multiple-choice option id. */
  correctOptionId?: string;
  /** IME-simulator: the expected Hanzi glyph. */
  correctGlyph?: string;
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
