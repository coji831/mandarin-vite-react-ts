/**
 * @file modules/tts/index.ts
 * @description TTS module barrel exports.
 */
export { default as TtsController } from "./api/TtsController.js";
export { createTtsModule } from "./container.js";
export { default as ttsRoutes } from "./api/ttsRoutes.js";
