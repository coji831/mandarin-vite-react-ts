/**
 * @file apps/backend/src/modules/quiz/strategies/index.js
 * Quiz strategy registry.
 * Add new strategies here as they are created.
 */
import { audioToPinyinAndToneStrategy } from "./AudioToPinyinAndToneStrategy.js";
import { imeSimulatorStrategy } from "./ImeSimulatorStrategy.js";
import { radicalSplitterStrategy } from "./RadicalSplitterStrategy.js";
import { radicalGateStrategy } from "./RadicalGateStrategy.js";

export { audioToPinyinAndToneStrategy } from "./AudioToPinyinAndToneStrategy.js";
export { imeSimulatorStrategy } from "./ImeSimulatorStrategy.js";
export { radicalSplitterStrategy } from "./RadicalSplitterStrategy.js";
export { radicalGateStrategy } from "./RadicalGateStrategy.js";

/**
 * Get a registered strategy by type name.
 * @param {string} type - The quiz type identifier
 * @returns {object|null} The strategy object, or null if not found
 */
export function getStrategy(type) {
  const strategies = {
    "audio-to-pinyin-tone": audioToPinyinAndToneStrategy,
    "ime-simulator": imeSimulatorStrategy,
    "radical-splitter": radicalSplitterStrategy,
    "radical-gate": radicalGateStrategy,
  };
  return strategies[type] ?? null;
}

/**
 * Get all registered strategy types.
 * @returns {string[]}
 */
export function getRegisteredTypes() {
  return Object.keys({
    "audio-to-pinyin-tone": audioToPinyinAndToneStrategy,
    "ime-simulator": imeSimulatorStrategy,
    "radical-splitter": radicalSplitterStrategy,
    "radical-gate": radicalGateStrategy,
  });
}
