/**
 * @file apps/backend/src/modules/audio/index.ts
 * @description modules/audio public barrel — the ONLY public surface other
 * modules import. HTTP-free by design (D1): no controllers/routes live here
 * (the HTTP layer is served by the Nest controllers under `nest/`).
 */

// Facade
export { AudioService } from "./services/AudioService.js";

// Composable capability pieces
export { AudioSynthesizer } from "./services/AudioSynthesizer.js";
export { AudioPathCache } from "./services/AudioPathCache.js";
export { AudioUrlSigner } from "./services/AudioUrlSigner.js";

// Types
export type {
  AudioServiceLike,
  AudioResult,
  CacheServiceLike,
  GcsClientLike,
  TtsClientLike,
} from "./types/audio.js";

// Path helpers + hashing
export { defaultWordPath, passagePath, passageHashFor, computeTTSHash } from "./services/paths.js";

// Config
export { TTS_STORAGE_PATH, TTS_SIGNED_URL_TTL_SECONDS, audioConfig } from "./config.js";
