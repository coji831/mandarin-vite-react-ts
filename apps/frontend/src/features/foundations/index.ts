/**
 * Foundations feature — character foundations learning path
 * Story 18.1: Foundations Page Structure
 *
 * Provides the foundations page with Pinyin, Tones, Strokes, and Animations tabs.
 * Phase-gated as the first content area in Phase 1.
 */

export { FoundationsProgressBar } from "./components/FoundationsProgressBar";
export { useFoundationsProgress } from "./hooks/useFoundationsProgress";
export { foundationsService } from "./services/foundationsService";
export type { FoundationProgress, PhaseGate } from "./types";
