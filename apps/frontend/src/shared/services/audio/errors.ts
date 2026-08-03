/**
 * @file shared/services/audio/errors.ts
 * @description Typed failure info for word-audio generation.
 *
 * Audio Playback consolidation (Phase A): `AudioBackend.fetchWordAudio` used to
 * swallow the real error and rethrow a generic message, destroying the
 * 401-vs-5xx-vs-network discrimination the fallback policy needs. This module
 * gives the backend a typed way to surface that discrimination while keeping
 * the service-layer contract clean (the resolver maps kinds → fallback policy).
 */

export type WordAudioFailureKind = "auth" | "rate-limit" | "network" | "server" | "unknown";

/** Typed audio-generation failure, preserving the classification + HTTP status. */
export class WordAudioError extends Error {
  readonly kind: WordAudioFailureKind;
  readonly status?: number;

  constructor(message: string, kind: WordAudioFailureKind, status?: number) {
    super(message);
    this.name = "WordAudioError";
    this.kind = kind;
    this.status = status;
  }
}

/**
 * Classify an arbitrary error (usually from `apiClient`) into a `WordAudioError`.
 * Handles BOTH the raw AxiosError shape (`err.response.status`) AND the
 * interceptor's `NormalizedError` shape (`err.status`).
 *  - 401/403 → "auth"          (AUTH_REQUIRED / INVALID_TOKEN)
 *  - 429     → "rate-limit"    (guest limiter)
 *  - 5xx     → "server"
 *  - no response / network / timeout → "network"
 *  - anything else → "unknown"
 */
export function classifyWordAudioError(err: unknown): WordAudioError {
  if (err instanceof WordAudioError) return err;

  const maybe = err as {
    response?: { status?: number };
    status?: number;
    code?: string;
  };
  const status = maybe.response?.status ?? maybe.status;
  const code = maybe.code;

  if (status === 401 || status === 403) {
    return new WordAudioError("Authentication required to generate audio", "auth", status);
  }
  if (status === 429) {
    return new WordAudioError("Audio generation rate limit exceeded", "rate-limit", status);
  }
  if (typeof status === "number" && status >= 500) {
    return new WordAudioError("Audio generation service error", "server", status);
  }
  if (!status || code === "ERR_NETWORK" || code === "ECONNABORTED" || code === "ETIMEDOUT") {
    return new WordAudioError("Network error while generating audio", "network");
  }
  return new WordAudioError("Failed to generate audio", "unknown", status);
}
