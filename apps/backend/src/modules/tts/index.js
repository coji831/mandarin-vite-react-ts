/**
 * @file apps/backend/src/modules/tts/index.js
 * @description TTS module - Public API
 *
 * Text-to-speech generation module.
 * Exports only what other modules or container.js can consume.
 *
 * Exports:
 * - TtsController: TTS HTTP controller (audio generation, cache checking)
 *
 * NOT exported: ttsRoutes (imported directly by routes entry point)
 *
 * See: docs/architecture.md
 */

export { default as TtsController } from "./api/TtsController.js";
