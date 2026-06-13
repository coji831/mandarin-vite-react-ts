import { createLogger } from "../../../shared/utils/logger.js";
import { computeHash } from "../../../shared/utils/hashUtils.js";
import { validationError, createApiError } from "../../../shared/utils/errorFactory.js";

// Dependencies (domain-specific validators — co-located with the module)
import { validateAndCanonicalize, sanitizeForLogs } from "./inputSanitizer.js";
import { validateChineseTokens } from "./hskValidator.js";

const logger = createLogger("ExampleService");

const HTML_SCRIPT_REGEX = /<\s*script\b|<\/?[a-z][\s\S]*?>/i;

// ── Gemini retry/backoff helper (inlined from former services/geminiClient.js) ──

/** @const {string} Immutable system prefix for all Gemini structured prompts */
const PROMPT_SYSTEM_PREFIX = Object.freeze(
  "You are a concise Mandarin language teacher.\nRespond ONLY with a single JSON object with exact keys: 'chinese', 'pinyin', 'english'.\nDo NOT include any explanatory text, markup, or non-JSON content. If you cannot produce a valid object, return {}.",
);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── ExampleService class ──

export class ExampleService {
  /**
   * @param {Object} options
   * @param {Object} options.gcsService - GCS cache service (for reading/writing cached examples)
   * @param {import('../../../infrastructure/external/GeminiClient.js').GeminiClient} [options.geminiClient] - AI client implementing IAIClient interface
   * @param {Object} [options.ttsClient] - TTS client with synthesizeSpeech()
   * @param {Object} [options.cacheService] - Cache service for Redis lookups
   */
  constructor({ gcsService, geminiClient, ttsClient, cacheService } = {}) {
    this.gcs = gcsService;
    this.geminiClient = geminiClient;
    this.ttsClient = ttsClient;
    this.cacheService = cacheService;
  }

  /**
   * Call low-level Gemini with retry/backoff for transient errors (2 retries with 500ms,1500ms)
   */
  async _callGeminiWithRetries(prompt, options = {}) {
    const backoffs = [0, 500, 1500];

    let lastErr = null;
    for (let attempt = 0; attempt < backoffs.length; attempt++) {
      if (attempt > 0) {
        await sleep(backoffs[attempt]);
      }
      try {
        logger.debug(`Calling Gemini (attempt ${attempt + 1})`);
        const text = await this.geminiClient.generateText(prompt, options);
        return text;
      } catch (err) {
        lastErr = err;
        logger.error(`Gemini call failed (attempt ${attempt + 1})`, {
          message: err?.message,
          stack: err?.stack,
        });
      }
    }

    throw lastErr || new Error("Gemini call failed after retries");
  }

  /**
   * Generate a structured JSON object from Gemini using the system prefix + user prompt.
   * Returns parsed object {chinese, pinyin, english} or throws on error.
   */
  async _generateStructured(userPrompt, options = {}) {
    const fullPrompt = `${PROMPT_SYSTEM_PREFIX}\n\n${userPrompt}`;

    const raw = await this._callGeminiWithRetries(fullPrompt, options);

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

  async generateSingleLineExample(payload) {
    // Validate input before any external calls (Story 16.1 rule #1)
    const { word, hskLevel, language, canonicalInput } = validateAndCanonicalize(payload);

    const cacheHash = computeHash(canonicalInput);
    const objectPath = `examples/${cacheHash}.json`;

    try {
      // Cache check first (Story 16.1 rule #3)
      const cached = await this.gcs.get(objectPath);
      if (cached) {
        logger.info(`Cache hit for ${objectPath}`);
        return [{ ...cached, _cache: true }];
      }

      // Prepare the user-facing generation prompt
      const userPrompt = [
        `Target word: ${word}`,
        `HSK level: ${hskLevel}`,
        `Language: ${language}`,
        `Instruction: Produce one single-line Chinese example that contains ONLY HSK 1-3 vocabulary (except the target word which is allowed).`,
        `Respond EXACTLY with a single JSON object with keys: "chinese", "pinyin", "english" and no extra text or markup.`,
      ].join("\n");

      // Validation-after-generation loop: allow single retry if model output fails validation (Story 16.1 rule #4)
      let lastValidationError = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        let generated;
        try {
          generated = await this._generateStructured(userPrompt, { temperature: 0.3 });
        } catch (err) {
          // Gemini/internal errors must be logged fully, but clients receive opaque responses (rule #5)
          logger.error("Gemini generateStructured error", {
            err: err?.message,
            stack: err?.stack,
          });
          throw createApiError("GENERIC_ERROR", "Service unavailable", 502, {});
        }

        // Basic structural validation
        if (!generated || typeof generated !== "object") {
          lastValidationError = "Generated output is not an object";
          logger.warn("Validation failed: not an object", {
            generated: sanitizeForLogs(JSON.stringify(generated || "")),
          });
          if (attempt === 0) continue; // retry once
          throw createApiError("INVALID_GENERATION", "Model produced invalid output", 502, {});
        }

        const { chinese, pinyin, english } = generated;

        // Field presence checks
        if (!chinese || !pinyin || !english) {
          lastValidationError = "Missing required fields in generated object";
          logger.warn("Validation failed: missing fields", {
            generated: sanitizeForLogs(JSON.stringify(generated)),
          });
          if (attempt === 0) continue;
          throw createApiError("INVALID_GENERATION", "Model produced invalid output", 502, {});
        }

        // Reject HTML/script in model output (Story 16.1 rule #9)
        if (
          HTML_SCRIPT_REGEX.test(chinese) ||
          HTML_SCRIPT_REGEX.test(pinyin) ||
          HTML_SCRIPT_REGEX.test(english)
        ) {
          lastValidationError = "Detected HTML/script in generated output";
          logger.warn("Validation failed: HTML/script detected", {
            snippet: sanitizeForLogs((chinese || "").slice(0, 200)),
          });
          if (attempt === 0) continue;
          throw createApiError("INVALID_GENERATION", "Model produced disallowed content", 502, {});
        }

        // HSK token validation: log as warning only (non-fatal)
        // TODO: Proper HSK validation requires architectural redesign (see TODO.md - deferred)
        const tokenValidation = validateChineseTokens(chinese, word);
        if (!tokenValidation.valid) {
          // Log warning but do NOT reject — allows examples to be generated for multi-char words
          logger.warn("HSK tokens warning (non-fatal)", {
            invalidTokens: tokenValidation.invalidTokens,
            note: "HSK validation is advisory only; validation logic deferred for architectural fix",
          });
        }

        // All validations passed — cache and return
        const result = { chinese, pinyin, english };
        try {
          await this.gcs.set(objectPath, { chinese, pinyin, english, meta: { source: "gemini" } });
        } catch (err) {
          // Cache write errors are best-effort — log and continue
          logger.error("Cache write failed", err);
        }

        logger.info("Generated example successful", { word, hskLevel });
        return [result];
      }

      // If we reach here, something unexpected happened
      logger.error("Generation failed after validation retry", { reason: lastValidationError });
      throw createApiError("INVALID_GENERATION", "Model failed validation", 502, {});
    } catch (err) {
      // For validation errors coming from input sanitiser, forward as-is
      if (err && err.code === "VALIDATION_ERROR") throw err;

      // Log detailed server error, but do not leak internals
      logger.error("Example generation failed", { err: err?.message || err });
      throw createApiError("GENERIC_ERROR", "Internal Server Error", 500, {});
    }
  }
}

export default ExampleService;

/**
 * Get or generate audio for an example
 * Uses injected cacheService and ttsClient instead of direct infrastructure imports
 */
ExampleService.prototype.getOrGenerateAudio = async function (cacheKey) {
  const audioObjectPath = `examples-audio/${cacheKey}.mp3`;

  try {
    // 1) Try Redis cache for signed URL
    try {
      const cachedUrl = await this.cacheService.get(`audio-url:${cacheKey}`);
      if (cachedUrl) {
        logger.info("Audio cache hit (Redis)", { cacheKey });
        return cachedUrl;
      }
    } catch (err) {
      // Fail-open: log and continue to GCS checks
      logger.warn("Redis lookup failed for audio URL", { cacheKey, err: err?.message });
    }

    // 2) Check GCS for pre-existing audio
    const gcsExists = await this.gcs.exists(audioObjectPath);
    if (gcsExists) {
      logger.info("Audio cache hit (GCS)", { cacheKey });
      const signedUrl = await this.gcs.getSignedUrl(audioObjectPath, 3600);
      if (signedUrl) {
        try {
          await this.cacheService.set(`audio-url:${cacheKey}`, signedUrl, 3300); // 55 minutes
        } catch (err) {
          logger.warn("Failed to cache signed URL in Redis", { err: err?.message });
        }
      }
      return signedUrl;
    }

    // 3) Retrieve example JSON from GCS to produce TTS audio
    const exampleObjectPath = `examples/${cacheKey}.json`;
    const exampleData = await this.gcs.get(exampleObjectPath);
    if (!exampleData || !exampleData.chinese) {
      throw new Error("Example text not found for audio generation");
    }

    // 4) Generate audio via TTS
    const audioBuffer = await this.ttsClient.synthesizeSpeech(exampleData.chinese, {});

    // 5) Persist audio to GCS
    await this.gcs.set(audioObjectPath, audioBuffer, "audio/mpeg");

    // 6) Signed URL + cache in Redis
    const signedUrl = await this.gcs.getSignedUrl(audioObjectPath, 3600);
    try {
      if (signedUrl) await this.cacheService.set(`audio-url:${cacheKey}`, signedUrl, 3300);
    } catch (err) {
      logger.warn("Failed to cache signed URL after generation", { err: err?.message });
    }

    logger.info("Audio generated and cached", { cacheKey });
    return signedUrl;
  } catch (err) {
    logger.error("Audio generation/retrieval failed", { cacheKey, err: err?.message });
    throw createApiError("AUDIO_ERROR", "Failed to generate or retrieve audio", 502, {});
  }
};
