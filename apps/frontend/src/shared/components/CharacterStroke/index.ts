/**
 * @file index.ts
 * @description Barrel exports for CharacterStroke shared components
 * Story 18.4: Stroke Order Reference & Animations
 *
 * Only exports the public component (CharacterStrokePlayer) and its types.
 * Internal implementation details (useHanziWriter, AnimationCanvas, strokeUtils)
 * are not exported — consumers import them directly from their file paths
 * when needed by feature barrels.
 */
export { AnimationCanvas } from "./AnimationCanvas";
export type { AnimationCanvasProps } from "./AnimationCanvas";
export { CharacterStrokePlayer } from "./CharacterStrokePlayer";
export type { CharacterStrokePlayerProps, CharacterStrokeMode } from "./CharacterStrokePlayer";
