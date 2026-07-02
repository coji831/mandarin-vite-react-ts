/**
 * @file apps/backend/src/modules/quiz/types/ai.ts
 * @description Type definitions for AI feedback in the Quiz module
 */

/**
 * Feedback response containing explanation and error classification.
 */
export interface FeedbackResponse {
  explanation: string;
  errorType: string;
}

/**
 * AI client interface.
 */
export interface IAIClient {
  generateText(
    prompt: string,
    options?: { temperature?: number; maxTokens?: number },
  ): Promise<string>;
}

/**
 * Word repository interface.
 */
export interface IWordRepository {
  findById(id: string): Promise<WordData | null>;
}

/**
 * Word shape consumed by AIFeedbackService.
 */
export interface WordData {
  id: string;
  simplified: string;
  pinyin: string;
  english: string;
  [key: string]: unknown;
}
