import { createLogger } from "../utils/logger.js";
import { computeHash } from "../utils/hashUtils.js";
import { validationError, createApiError } from "../utils/errorFactory.js";

// Dependencies (wrappers we added for Story 16.1)
import { validateAndCanonicalize, sanitizeForLogs } from "./examples/inputSanitizer.js";
import { validateChineseTokens } from "./examples/hskValidator.js";
import * as gemini from "./geminiClient.js";
import GcsCacheService from "./gcsCacheService.js";
import { getCacheService } from "../infrastructure/cache/index.js";
import * as ttsClient from "../infrastructure/external/GoogleTTSClient.js";

const logger = createLogger("ExampleService");

const HTML_SCRIPT_REGEX = /<\s*script\b|<\/?[a-z][\s\S]*?>/i;

export class ExampleService {
  constructor(gcsService) {
    this.gcs = gcsService || new GcsCacheService();
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
          generated = await gemini.generateStructured(userPrompt, { temperature: 0.3 });
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

// Audio generation helper: added for examples audio endpoint
ExampleService.prototype.getOrGenerateAudio = async function (cacheKey) {
  const audioObjectPath = `examples-audio/${cacheKey}.mp3`;

  try {
    const cacheService = getCacheService();

    // 1) Try Redis cache for signed URL
    try {
      const cachedUrl = await cacheService.get(`audio-url:${cacheKey}`);
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
          await cacheService.set(`audio-url:${cacheKey}`, signedUrl, 3300); // 55 minutes
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
    const audioBuffer = await ttsClient.synthesizeSpeech(exampleData.chinese, {});

    // 5) Persist audio to GCS
    await this.gcs.set(audioObjectPath, audioBuffer, "audio/mpeg");

    // 6) Signed URL + cache in Redis
    const signedUrl = await this.gcs.getSignedUrl(audioObjectPath, 3600);
    try {
      if (signedUrl) await cacheService.set(`audio-url:${cacheKey}`, signedUrl, 3300);
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
