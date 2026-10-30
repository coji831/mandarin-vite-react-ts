/**
 * index.ts
 * Phase 1 Gate Quiz — Barrel exports
 *
 * Public API surface for the Phase 1 Gate Quiz feature.
 * External consumers import from this barrel.
 */

// Shared quiz styles (legacy monolithic sheet; pending per-component split)
import "./components/Quiz.css";

// Engine
export { getStrategy, QUIZ_STRATEGIES } from "./engine/strategies";
export { getPhaseQuizzes, getQuizzesUpToPhase } from "./engine/PhaseStrategyRegistry";
export type { PhaseConfig, PhaseQuizConfig, PhaseQuizEntry } from "./engine/PhaseStrategyRegistry";

// Types
export type {
  QuizStrategy,
  StrategyType,
  QuizQuestion,
  AnswerResult,
  QuizPhase,
  PhoneticHintState,
} from "./types";
export type { QuizSession } from "./types";
export { createInitialSession } from "./types";

// Components
export { QuizCard } from "./components/QuizCard";
export { QuizRouter } from "./components/QuizRouter";
export { QuestionView } from "./components/QuestionView";
export { AnswerInput } from "./components/AnswerInput";
export { FeedbackView } from "./components/FeedbackView";
export { AudioPlayer } from "./components/AudioPlayer";
export { QuizProgressBar } from "./components/QuizProgressBar";
export { Timer } from "./components/Timer";
export { PinyinToneInput } from "./components/inputs/PinyinToneInput";
export { QuizResults } from "./components/results/QuizResults";
export { PhaseGateBadge } from "./components/results/PhaseGateBadge";
export { IMEQuestionView } from "./components/ime-input/IMEQuestionView";

// Hooks
export { useQuizEngine } from "./hooks";
export { useQuizCard, quizLabel } from "./hooks/useQuizCard";
export type { QuizAssessment, PhaseTimelineEntry, PhaseTimelineState } from "./hooks/useQuizCard";

// Stores
export { useQuizSessionStore } from "./stores";

// Services
export { quizService } from "./services/quizService";
export {
  getPhoneticHint,
  getRadicalHint,
  getCharacterDetail,
  searchPinyinCandidates,
} from "./services/hintService";
export type {
  RadicalHint,
  CharacterDetail,
  ImeCandidate,
  PinyinSearchResponse,
} from "./services/hintService";
export type { PhoneticHint } from "./types";
