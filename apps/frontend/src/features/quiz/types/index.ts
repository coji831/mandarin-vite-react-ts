/**
 * @file apps/frontend/src/features/quiz/types/index.ts
 * @description Centralized type exports for quiz feature
 */

// Modern Quiz Session API types
export type {
  QuizSessionQuestion,
  QuizSessionStartResponse,
  QuizAnswerRequest,
  QuizAnswerResponse,
  IncorrectWordDetail,
  LeechWordDetail,
  QuizSessionSummary,
  SessionAnswerDetail,
} from "./QuizSessionTypes";

export type { MysteryBox } from "../../gamification/types/GamificationTypes";

// UI component types
export type { QuestionMode, QuizQuestion, QuizAnswer } from "./QuizTypes";

// Phase 2 restructure: Progress and State types moved from mandarin
export type { UserState, UiState } from "./State";
export type { UserProgress, UserProgressListEntry, WordProgress, ProgressState } from "./Progress";
