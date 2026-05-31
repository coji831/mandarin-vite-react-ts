import { validationError } from "../../utils/errorFactory.js";

// Validation / sanitization rules used by Story 16.1
const CONTROL_CHAR_REGEX = /[\x00-\x1F\x7F]/;
const HTML_SCRIPT_REGEX = /<\s*script\b|<\/?[a-z][\s\S]*?>/i;
const SQL_INJECTION_REGEX = /\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|--|;|\bOR\b|\bAND\b)\b/i;
const SYSTEM_TOKEN_REGEX = /\b(system|assistant|user)\s*:/i;

export function sanitizeForLogs(str) {
  if (!str) return str;
  // redact private_key blocks and long-looking secrets
  return str.replace(/("private_key"\s*:\s*")([\s\S]*?)(")/gi, "$1REDACTED$3");
}

/**
 * Domain class for Example API requests.
 * Encapsulates validation logic using constructor guards.
 * Throws validationError if input is invalid.
 */
export class ExampleRequest {
  constructor(word, hskLevel, language = "zh-CN") {
    this.word = this.normalizeWord(word);
    this.hskLevel = this.normalizeHskLevel(hskLevel);
    this.language = this.normalizeLanguage(language);
    this.canonicalInput = `${this.word}|${this.hskLevel}|${this.language}|v1`;
  }

  normalizeWord(word) {
    const normalized = (word || "").toString().trim();

    if (!normalized) {
      throw validationError("Missing required field 'word'", { field: "word" });
    }

    if (normalized.length < 1 || normalized.length > 20) {
      throw validationError("'word' must be 1-20 characters", { field: "word" });
    }

    // Reject control characters early (null bytes, etc.)
    if (CONTROL_CHAR_REGEX.test(normalized)) {
      throw validationError("Invalid characters in 'word'", { field: "word" });
    }

    // Reject obvious prompt-injection patterns in the incoming fields
    if (
      HTML_SCRIPT_REGEX.test(normalized) ||
      SQL_INJECTION_REGEX.test(normalized) ||
      SYSTEM_TOKEN_REGEX.test(normalized)
    ) {
      throw validationError("Detected disallowed content in input 'word'", { field: "word" });
    }

    return normalized;
  }

  normalizeHskLevel(hskLevel) {
    const normalized = Number(hskLevel);

    if (!Number.isInteger(normalized) || ![1, 2, 3].includes(normalized)) {
      throw validationError("Invalid 'hskLevel' - permitted values: 1,2,3", {
        field: "hskLevel",
      });
    }

    return normalized;
  }

  normalizeLanguage(language) {
    const normalized = (language || "zh-CN").toString();

    if (HTML_SCRIPT_REGEX.test(normalized) || SQL_INJECTION_REGEX.test(normalized)) {
      throw validationError("Detected disallowed content in 'language'", { field: "language" });
    }

    return normalized;
  }
}

/**
 * Legacy function for backward compatibility with existing code.
 * Creates and returns an ExampleRequest domain object.
 */
export function validateAndCanonicalize(input) {
  const request = new ExampleRequest(input.word, input.hskLevel, input.language);
  return {
    word: request.word,
    hskLevel: request.hskLevel,
    language: request.language,
    canonicalInput: request.canonicalInput,
  };
}
