/**
 * @file apps/backend/src/shared/config/tts.js
 * @description TTS configuration
 * Migrated from modules/tts/config.js — TTS is now shared infrastructure.
 */

/** Storage path template for TTS audio files (use {hash} placeholder) */
export const TTS_STORAGE_PATH = "tts/{hash}.mp3";

/**
 * Signed URL lifetime for TTS audio (seconds).
 * Browser <audio>/Audio() elements fetch the URL anonymously right after the
 * API call, so 1 hour is plenty and keeps exposure minimal.
 */
export const TTS_SIGNED_URL_TTL_SECONDS = 3600;
