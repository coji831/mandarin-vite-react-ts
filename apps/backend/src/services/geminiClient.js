import { createLogger } from "../utils/logger.js";
import * as lowLevelGemini from "../infrastructure/external/GeminiClient.js";

const logger = createLogger("GeminiClientWrapper");

// Immutable system prefix for all Gemini structured prompts (Story 16.1 requirement)
export const PROMPT_SYSTEM_PREFIX = Object.freeze(
  "You are a concise Mandarin language teacher.\nRespond ONLY with a single JSON object with exact keys: 'chinese', 'pinyin', 'english'.\nDo NOT include any explanatory text, markup, or non-JSON content. If you cannot produce a valid object, return {}.",
);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Call low-level Gemini with retry/backoff for transient errors (per Story 16.1: 2 retries with 500ms,1500ms)
 */
async function callGeminiWithRetries(prompt, options = {}) {
  const backoffs = [0, 500, 1500];

  let lastErr = null;
  for (let attempt = 0; attempt < backoffs.length; attempt++) {
    if (attempt > 0) {
      await sleep(backoffs[attempt]);
    }
    try {
      logger.debug(`Calling Gemini (attempt ${attempt + 1})`);
      const text = await lowLevelGemini.generateText(prompt, options);
      return text;
    } catch (err) {
      lastErr = err;
      // Log full error details to server logs (redaction happens upstream when needed)
      logger.error(`Gemini call failed (attempt ${attempt + 1})`, {
        message: err?.message,
        stack: err?.stack,
      });
      // continue to retry
    }
  }

  throw lastErr || new Error("Gemini call failed after retries");
}

/**
 * Generate a structured JSON object from Gemini using the system prefix + user prompt.
 * Returns parsed object {chinese,pinyin,english} or throws on error.
 */
export async function generateStructured(userPrompt, options = {}) {
  const fullPrompt = `${PROMPT_SYSTEM_PREFIX}\n\n${userPrompt}`;

  const raw = await callGeminiWithRetries(fullPrompt, options);

  if (!raw || typeof raw !== "string") {
    throw new Error("Empty response from Gemini");
  }

  // Try to extract a JSON object from the response (robust parsing)
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  const jsonSub =
    firstBrace >= 0 && lastBrace > firstBrace ? raw.slice(firstBrace, lastBrace + 1) : raw;

  try {
    const parsed = JSON.parse(jsonSub);
    return parsed;
  } catch (err) {
    logger.error("Failed to parse Gemini structured response", {
      snippet: raw.slice(0, 300),
      error: err?.message,
    });
    throw new Error("Invalid structured JSON from Gemini");
  }
}

export async function healthCheck() {
  try {
    // cheap call to verify connectivity
    await callGeminiWithRetries("Hello", { maxTokens: 5 });
    return true;
  } catch (err) {
    logger.error("Gemini health check failed", { err: err?.message });
    return false;
  }
}
