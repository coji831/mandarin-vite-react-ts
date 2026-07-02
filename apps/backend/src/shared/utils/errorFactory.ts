// apps/backend/src/shared/utils/errorFactory.ts
// Standardized error creation for consistent API error responses

/**
 * API error interface with code, statusCode, and metadata.
 */
export interface ApiError extends Error {
  code: string;
  statusCode: number;
  metadata: Record<string, unknown>;
}

/**
 * Create a standardized API error with consistent structure
 * @param code - Error code (e.g., 'TTS_ERROR', 'CONVO_TEXT_ERROR')
 * @param message - Human-readable error message
 * @param statusCode - HTTP status code (default: 500)
 * @param metadata - Additional error context (optional)
 * @returns Error object with code, statusCode, and metadata properties
 */
export function createApiError(
  code: string,
  message: string,
  statusCode: number = 500,
  metadata: Record<string, unknown> = {},
): ApiError {
  const error = new Error(message) as ApiError;
  error.code = code;
  error.statusCode = statusCode;
  error.metadata = metadata;
  return error;
}

/**
 * Create a validation error
 * @param message - Error message
 * @returns Error
 */
export function validationError(message: string): ApiError {
  return createApiError("VALIDATION_ERROR", message, 400);
}

/**
 * Create a TTS-related error
 * @param message - Error message
 * @param metadata - Additional context
 * @returns Error
 */
export function ttsError(message: string, metadata: Record<string, unknown> = {}): ApiError {
  return createApiError("TTS_ERROR", message, 500, metadata);
}

/**
 * Create a conversation text generation error
 * @param message - Error message
 * @param metadata - Additional context
 * @returns Error
 */
export function convoTextError(message: string, metadata: Record<string, unknown> = {}): ApiError {
  return createApiError("CONVO_TEXT_ERROR", message, 500, metadata);
}

/**
 * Create a conversation audio generation error
 * @param message - Error message
 * @param metadata - Additional context
 * @returns Error
 */
export function convoAudioError(message: string, metadata: Record<string, unknown> = {}): ApiError {
  return createApiError("CONVO_AUDIO_ERROR", message, 500, metadata);
}

export default { createApiError, validationError, ttsError, convoTextError, convoAudioError };
