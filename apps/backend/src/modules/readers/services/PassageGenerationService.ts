/**
 * @file modules/readers/services/PassageGenerationService.ts
 * @description Domain service for AI-generated reading passages.
 *
 * Owns the passage-specific prompt construction and response parsing,
 * delegating the raw Gemini API call to the generic shared GeminiService.
 */

import { GeminiService } from "../../../shared/services/GeminiService.js";
import { PassageGenerationError } from "../types/readers-errors.js";
import { createLogger } from "../../../shared/utils/logger.js";

const logger = createLogger("PassageGenerationService");
const PASSAGE_TIMEOUT = 30_000; // 30 seconds

export interface PassageResult {
  sentences: Array<{ index: number; text: string }>;
}

export class PassageGenerationService {
  constructor(private geminiService: GeminiService) {}

  /**
   * Generate a passage with JSON response parsing.
   * Calls the generic GeminiService.generateRaw() then extracts and validates
   * the expected passage JSON format.
   *
   * @param prompt - The full prompt for passage generation.
   * @returns Parsed response with sentences array.
   * @throws PassageGenerationError on API failure, timeout, or invalid response.
   */
  async generatePassage(prompt: string): Promise<PassageResult> {
    logger.info("Generating passage via Gemini");

    let raw: string;
    try {
      raw = await this.geminiService.generateRaw(prompt, {
        maxTokens: 1024,
        timeout: PASSAGE_TIMEOUT,
      });
    } catch (error) {
      throw new PassageGenerationError(
        `Failed to generate passage: ${error instanceof Error ? error.message : String(error)}`,
        error,
      );
    }

    const jsonStr = this.extractJson(raw);

    let parsed: { sentences?: Array<{ index: number; text: string }> };
    try {
      parsed = JSON.parse(jsonStr);
    } catch (error) {
      throw new PassageGenerationError("Failed to parse passage response as JSON", error);
    }

    // Validate response format
    if (!parsed.sentences || !Array.isArray(parsed.sentences)) {
      throw new PassageGenerationError(
        "Invalid passage response format: missing 'sentences' array",
      );
    }

    for (const s of parsed.sentences) {
      if (typeof s.index !== "number" || typeof s.text !== "string") {
        throw new PassageGenerationError(
          "Invalid passage response format: each sentence must have 'index' (number) and 'text' (string)",
        );
      }
    }

    logger.info(`Passage generated with ${parsed.sentences.length} sentences`);
    return { sentences: parsed.sentences };
  }

  /**
   * Extract JSON from a response string that may include markdown code fences.
   */
  private extractJson(text: string): string {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return jsonMatch[1].trim();
    }
    return text;
  }
}
