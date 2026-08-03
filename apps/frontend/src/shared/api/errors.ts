/**
 * @file errors.ts
 * @description Shared API error classification + normalization helpers.
 *
 * Bug 2: `isAuthFailure` was extracted from the axiosClient response
 * interceptor's inline predicate into a single source of truth so feature code
 * (e.g. the ReviewView session-expiry upsell) classifies auth failures
 * identically to the global interceptor.
 */
import type { NormalizedError } from "@mandarin/shared-types";

/**
 * Classify an error as an authentication failure.
 *
 * Mirrors the axiosClient response interceptor predicate exactly:
 * - `401` — missing/expired access token
 * - `403` with backend code `INVALID_TOKEN` — tampered/forged access token
 *
 * Reads the `NormalizedError` shape produced by the interceptor (`status` +
 * `originalError`), so it works on any structurally-compatible object. Unknown
 * / non-object inputs are never auth failures.
 */
export function isAuthFailure(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const normalized = error as Partial<NormalizedError>;

  if (normalized.status === 401) return true;
  if (normalized.status !== 403) return false;

  // 403 INVALID_TOKEN: the backend flags a forged/tampered access token via
  // `code` on the raw axios response payload. Normalized errors carry the
  // original AxiosError under `originalError`.
  const original = normalized.originalError as
    { response?: { data?: { code?: string } } } | undefined;

  return original?.response?.data?.code === "INVALID_TOKEN";
}

/**
 * Coerce an unknown thrown value into the canonical `NormalizedError` shape.
 *
 * `apiClient` already rejects with a `NormalizedError`; this helper guarantees
 * the shape for non-object / plain-`Error` throw sites so callers can safely
 * inspect `status`/`code` (e.g. with `isAuthFailure`) and render `message`.
 */
export function toNormalizedError(
  error: unknown,
  fallbackMessage = "An unexpected error occurred",
): NormalizedError {
  if (error && typeof error === "object") {
    // Already canonical (apiClient interceptor output): return unchanged so
    // status/code/originalError survive for isAuthFailure classification.
    if ("status" in error || "originalError" in error) {
      return error as NormalizedError;
    }
    // Plain Error / message-only object: build a well-formed NormalizedError
    // instead of casting a bare Error (which lacks status/code/originalError).
    if ("message" in error) {
      const maybe = (error as { message?: unknown }).message;
      return {
        message: typeof maybe === "string" ? maybe : fallbackMessage,
        originalError: error,
      };
    }
  }
  return { message: fallbackMessage, originalError: error };
}
