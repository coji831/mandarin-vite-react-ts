/**
 * @file modules/tts/container.ts
 * @description Module-level DI container factory for the TTS module.
 */
import { TtsService } from "../../shared/services/TtsService.js";
import TtsController from "./api/TtsController.js";

export interface TtsModuleDeps {
  ttsService: TtsService;
}

export function createTtsModule(deps: TtsModuleDeps) {
  const controller = new TtsController(deps.ttsService);
  return { controller };
}
