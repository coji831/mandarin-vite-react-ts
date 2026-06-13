/**
 * @file apps/backend/src/modules/tts/config.js
 * @description TTS module configuration
 * Clean architecture: Module-level configuration
 */

/** Storage path template for TTS audio files (use {hash} placeholder) */
export const TTS_STORAGE_PATH = "tts/{hash}.mp3";
