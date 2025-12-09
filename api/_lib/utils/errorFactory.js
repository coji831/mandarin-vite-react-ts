export function createApiError(code, message, statusCode = 500, metadata = {}) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  error.metadata = metadata;
  return error;
}

export function ttsError(message, metadata = {}) {
  return createApiError("TTS_ERROR", message, 500, metadata);
}

export function convoTextError(message, metadata = {}) {
  return createApiError("CONVO_TEXT_ERROR", message, 500, metadata);
}

export function convoAudioError(message, metadata = {}) {
  return createApiError("CONVO_AUDIO_ERROR", message, 500, metadata);
}

export function validationError(message, metadata = {}) {
  return createApiError("VALIDATION_ERROR", message, 400, metadata);
}
