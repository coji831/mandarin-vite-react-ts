import { validationError } from "../../../shared/utils/errorFactory.js";

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
      throw validationError("Word is required");
    }

    if (normalized.length > 20) {
      throw validationError("Word must be 20 characters or less");
    }

    if (CONTROL_CHAR_REGEX.test(normalized)) {
      throw validationError("Word contains control characters");
    }

    if (HTML_SCRIPT_REGEX.test(normalized)) {
      throw validationError("Word contains HTML/script tags");
    }

    if (SQL_INJECTION_REGEX.test(normalized)) {
      throw validationError("Word contains SQL injection patterns");
    }

    if (SYSTEM_TOKEN_REGEX.test(normalized)) {
      throw validationError("Word contains system tokens");
    }

    return normalized;
  }

  normalizeHskLevel(hskLevel) {
    if (hskLevel === undefined || hskLevel === null || hskLevel === "") {
      return "all";
    }

    const num = Number(hskLevel);
    if (isNaN(num) || num < 1 || num > 6) {
      throw validationError("HSK level must be a number between 1 and 6");
    }

    return String(num);
  }

  normalizeLanguage(language) {
    const lang = (language || "zh-CN").toString().trim().toLowerCase();

    const validLanguages = ["zh-cn", "en", "ja"];
    if (!validLanguages.includes(lang)) {
      throw validationError(`Language must be one of: ${validLanguages.join(", ")}`);
    }

    // Normalize to uppercase region
    if (lang === "zh-cn") return "zh-CN";
    return lang;
  }
}

export function validateAndCanonicalize(payload) {
  const { word, hskLevel, language } = payload || {};
  const request = new ExampleRequest(word, hskLevel, language);
  return {
    word: request.word,
    hskLevel: request.hskLevel,
    language: request.language,
    canonicalInput: request.canonicalInput,
  };
}

export default { sanitizeForLogs, ExampleRequest, validateAndCanonicalize };
