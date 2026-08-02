/**
 * @file lib/index.ts
 * @description Barrel exports for readers feature lib classes.
 * Phase 2: Plain JS classes extracted from hooks for stability and testability.
 * Phase 3: Re-exported from shared/lib/ for cross-feature reuse.
 */
export { AudioEngine } from "../../../shared/lib/audioEngine";
export { BrowserTTS } from "../../../shared/lib/browserTTS";
