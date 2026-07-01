/**
 * strategies/index.ts
 * Phase 1 Gate Quiz — Strategy registry barrel
 *
 * Only re-exports — no inline definitions.
 */

export { imeQuizStrategy } from "./IMEQuizStrategy";
export { radicalGateQuizStrategy } from "./RadicalGateQuizStrategy";
export { QUIZ_STRATEGIES, getStrategy } from "./quizStrategyRegistry";
