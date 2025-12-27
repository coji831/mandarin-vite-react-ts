// local-backend/utils/errorFactory.js
// Standardized error creation for consistent API error responses

/**
 * Create a standardized API error with consistent structure
 * @param {string} code - Error code (e.g., 'TTS_ERROR', 'CONVO_TEXT_ERROR')
 * @param {string} message - Human-readable error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {Object} metadata - Additional error context (optional)
 * @returns {Error} Error object with code, statusCode, and metadata properties
 */
export function createApiError(code, message, statusCode = 500, metadata = {}) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  error.metadata = metadata;
  return error;
}

/**
 * Create a TTS-related error
 * @param {string} message - Error message
 * @param {Object} metadata - Additional context
 * @returns {Error}
 */
export function ttsError(message, metadata = {}) {
  return createApiError("TTS_ERROR", message, 500, metadata);
}

/**
 * Create a conversation text generation error
 * @param {string} message - Error message
 * @param {Object} metadata - Additional context
 * @returns {Error}
 */
export function convoTextError(message, metadata = {}) {
  return createApiError("CONVO_TEXT_ERROR", message, 500, metadata);
}

/**
 * Create a conversation audio generation error
 * @param {string} message - Error message
 * @param {Object} metadata - Additional context
 * @returns {Error}
 */
export function convoAudioError(message, metadata = {}) {
  return createApiError("CONVO_AUDIO_ERROR", message, 500, metadata);
}

/**
 * Create a validation error (400 Bad Request)
 * @param {string} message - Error message
 * @param {Object} metadata - Additional context (e.g., { field: 'text' })
 * @returns {Error}
 */
export function validationError(message, metadata = {}) {
  return createApiError("VALIDATION_ERROR", message, 400, metadata);
}

/**
 * Create a not found error (404)
 * @param {string} message - Error message
 * @param {Object} metadata - Additional context
 * @returns {Error}
 */
export function notFoundError(message, metadata = {}) {
  return createApiError("NOT_FOUND", message, 404, metadata);
}
