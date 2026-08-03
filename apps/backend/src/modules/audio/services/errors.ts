/**
 * @file apps/backend/src/modules/audio/services/errors.ts
 * @description Audio error taxonomy — maps upstream (GCS/TTS) failures onto the
 * repo's standardized `ttsError` convention (shared/utils/errorFactory). No new
 * error pattern invented here.
 */

import { ttsError } from "../../../shared/utils/errorFactory.js";
import type { ApiError } from "../../../shared/utils/errorFactory.js";

/**
 * Classify an upstream TTS/GCS error into a user-facing `ttsError` with a
 * consistent message. Unknown errors are wrapped generically.
 * @param error - The raw upstream error
 * @returns A standardized ApiError with code "TTS_ERROR"
 */
export function classifyTtsError(error: unknown): ApiError {
  const err = error as { code?: number; details?: string; message?: string };
  if (err.code === 7 || err.details?.includes("API key not valid")) {
    return ttsError("Authentication error with TTS/GCS API. Check local backend logs.", {
      originalError: err.message,
    });
  }
  if (err.code === 3 && err.details?.includes("Billing account not enabled")) {
    return ttsError("Google Cloud Billing not enabled. Check local backend logs.", {
      originalError: err.message,
    });
  }
  if (err.code === 403 && err.details?.includes("Forbidden")) {
    return ttsError(
      "GCS permission denied. Ensure service account has Storage Object Creator/Viewer roles.",
      { originalError: err.message },
    );
  }
  return ttsError(err.message || "TTS generation failed", {
    originalError: err.message,
  });
}
