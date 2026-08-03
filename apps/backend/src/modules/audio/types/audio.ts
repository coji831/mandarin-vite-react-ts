/**
 * @file apps/backend/src/modules/audio/types/audio.ts
 * @description Audio capability type contracts — the minimal client/service shapes
 * used across the audio module. HTTP-free by design (D1): no Request/Response
 * types live here; controllers in modules/audio own the HTTP mapping.
 */

/** Result of an audio resolution. `cached: true` = the file already existed in GCS; `false` = just synthesized. */
export interface AudioResult {
  audioUrl: string;
  cached: boolean;
}

/** Minimal path-cache interface (CacheService-compatible). */
export interface CacheServiceLike {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl: number): Promise<void>;
  delete(key: string): Promise<void>;
}

/** Minimal GCS client interface (GCSClient-compatible). */
export interface GcsClientLike {
  fileExists(path: string): Promise<boolean>;
  uploadFile(
    path: string,
    data: Buffer | Uint8Array | string | undefined,
    contentType: string,
  ): Promise<void>;
  getSignedUrl(path: string, expirySeconds?: number): Promise<string>;
  /** Optional — falls back to a default public URL template when absent. */
  getPublicUrl?(path: string): string;
}

/** Minimal Google TTS client interface (GoogleTTSClient-compatible). */
export interface TtsClientLike {
  synthesizeSpeech(
    text: string,
    options?: { voice?: string; languageCode?: string; audioEncoding?: string },
  ): Promise<Uint8Array | string | undefined>;
  healthCheck(): Promise<boolean>;
}

/**
 * The audio service contract consumed by modules (HTTP-free).
 * `synthesizeToPath` is the unified exists-or-synthesize primitive (D4);
 * `getSignedUrl` lets callers re-sign paths they already hold.
 */
export interface AudioServiceLike {
  getTtsUrl(text: string, voice?: string): Promise<AudioResult>;
  synthesizeToPath(text: string, path: string, voice?: string): Promise<AudioResult>;
  getSignedUrl(path: string, expirySeconds?: number): Promise<string>;
  healthCheck(): Promise<boolean>;
}
