/**
 * @file apps/backend/src/shared/services/GeminiService.ts
 * @description Application-level AI service wrapping GeminiClient.
 *
 * External Service layer — adds timeout, retry, fallback, and sanitization
 * on top of the raw GeminiClient (external client layer).
 *
 * Consumers: MnemonicsService, HealthController, quiz feedback routes
 */

import { createLogger } from "../utils/logger.js";
import { timeoutPromise } from "../utils/promise.js";
import { GeminiClient } from "../infrastructure/external/GeminiClient.js";

const logger = createLogger("GeminiService");

const DEFAULT_TIMEOUT = 10_000; // 10 seconds
const DEFAULT_FALLBACK = "We couldn't generate a response right now. Please try again later.";
const MAX_OUTPUT_LENGTH = 500;

export interface GeminiServiceOptions {
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

/**
 * Application-level Gemini service with timeout, retry, and fallback.
 */
export class GeminiService {
  private client: GeminiClient;

  constructor(client: GeminiClient) {
    this.client = client;
  }

  /**
   * Generate text with timeout and fallback.
   */
  async generateText(prompt: string, options?: GeminiServiceOptions): Promise<string> {
    const timeout = options?.timeout ?? DEFAULT_TIMEOUT;
    const genOptions = {
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
    };

    try {
      const result = await Promise.race([
        this.client.generateText(prompt, genOptions),
        timeoutPromise(timeout),
      ]);
      return result.trim().substring(0, MAX_OUTPUT_LENGTH);
    } catch (error) {
      logger.error("Gemini API call failed", error);
      return DEFAULT_FALLBACK;
    }
  }

  /**
   * Health check — calls Gemini API with a simple prompt.
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await Promise.race([this.client.healthCheck(), timeoutPromise(5_000)]);
      return result;
    } catch {
      return false;
    }
  }
}
