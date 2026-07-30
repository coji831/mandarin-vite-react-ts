/**
 * @file apps/backend/src/modules/quiz/strategies/index.ts
 * Quiz strategy barrel — only re-exports.
 */
export { radicalGateStrategy } from "./RadicalGateStrategy.js";
export { imeSimulatorStrategy } from "./ImeSimulatorStrategy.js";
export { audioToPinyinAndToneStrategy } from "./AudioToPinyinAndToneStrategy.js";
export { comprehensionQuizStrategy } from "./ComprehensionQuizStrategy.js";
export { qualificationQuizStrategy } from "./QualificationQuizStrategy.js";
export { getStrategy, getRegisteredTypes } from "./registry.js";
