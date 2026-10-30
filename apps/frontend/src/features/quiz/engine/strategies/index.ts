/**
 * strategies/index.ts
 * Phase 1 Gate Quiz — Strategy registry barrel
 *
 * Only re-exports — no inline definitions.
 */

export { audioToPinyinAndToneStrategy } from "./AudioToPinyinAndToneStrategy";
export { clozeStrategy } from "./ClozeStrategy";
export { imeQuizStrategy } from "./IMEQuizStrategy";
export { listeningDictationStrategy } from "./ListeningDictationStrategy";
export { radicalGateQuizStrategy } from "./RadicalGateQuizStrategy";
export { sentenceBuildingStrategy } from "./SentenceBuildingStrategy";
export { toneJudgmentStrategy } from "./ToneJudgmentStrategy";
export { QUIZ_STRATEGIES, getStrategy } from "./quizStrategyRegistry";
