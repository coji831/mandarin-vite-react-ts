import { createLogger } from "../utils/logger.js";
import { computeHash } from "../utils/hashUtils.js";
import { validationError, createApiError } from "../utils/errorFactory.js";

// Dependencies (wrappers we added for Story 16.1)
import { validateAndCanonicalize, sanitizeForLogs } from "./examples/inputSanitizer.js";
import { validateChineseTokens } from "./examples/hskValidator.js";
import * as gemini from "./geminiClient.js";
import GcsCacheService from "./gcsCacheService.js";

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
        return { ...cached, _cache: true };
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

        // HSK token validation: every token must be in HSK 1-3 OR equal the target word
        const tokenValidation = validateChineseTokens(chinese, word);
        if (!tokenValidation.valid) {
          lastValidationError = `HSK validation failed; invalid tokens: ${tokenValidation.invalidTokens?.slice(0, 5).join(",")}`;
          logger.warn("Validation failed: HSK tokens not allowed", {
            invalidTokens: tokenValidation.invalidTokens,
          });
          if (attempt === 0) continue;
          throw createApiError(
            "INVALID_GENERATION",
            "Model produced out-of-range vocabulary",
            502,
            {},
          );
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
        return result;
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
