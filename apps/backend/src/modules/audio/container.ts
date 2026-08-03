/**
 * @file modules/audio/container.ts
 * @description Module-level DI container factory for the Audio module.
 */
import type { AudioServiceLike } from "./types/audio.js";
import AudioController from "./api/AudioController.js";

export interface AudioModuleDeps {
  audioService: AudioServiceLike;
}

export function createAudioModule(deps: AudioModuleDeps) {
  const controller = new AudioController(deps.audioService);
  return { controller };
}
