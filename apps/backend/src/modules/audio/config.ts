/**
 * @file apps/backend/src/modules/audio/config.ts
 * @description Audio capability configuration — moved from the retired shared
 * TTS config module (and the former shared/config/tts.ts block). Self-contained
 * so modules/audio owns its own defaults (signed-URL TTL, voice/language/maxWords/encoding).
 * Values are byte-identical to the previous `ttsConfig`.
 */

/** Storage path template for TTS audio files (use {hash} placeholder). */
export const TTS_STORAGE_PATH = "tts/{hash}.mp3";

/**
 * Signed URL lifetime for TTS audio (seconds).
 * Browser <audio>/Audio() elements fetch the URL anonymously right after the
 * API call, so 1 hour is plenty and keeps exposure minimal.
 */
export const TTS_SIGNED_URL_TTL_SECONDS = 3600;

/** Audio synthesis defaults — mirrors the former `config.tts` block. */
export const audioConfig = {
  voiceDefault: "cmn-CN-Wavenet-B",
  languageCode: "cmn-CN",
  maxWords: 15,
  audioEncoding: "MP3" as const,
  signedUrlTtlSeconds: TTS_SIGNED_URL_TTL_SECONDS,
};
