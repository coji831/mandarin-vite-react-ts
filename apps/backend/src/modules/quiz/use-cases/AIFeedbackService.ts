/**
 * @file apps/backend/src/modules/quiz/use-cases/AIFeedbackService.ts
 * @description Pure AI feedback business logic — no caching concerns.
 *
 * Extracted from CachedAIFeedbackService during modular monolith Phase 5.
 * Caching is now applied transparently via the withCache() decorator in container.js.
 *
 * Clean Architecture: Use Case / Application Service
 * Depends on WordRepository and IAIClient interfaces.
 *
 * See: docs/guides/references/modular-monolith-plan.md Phase 5
 * See: docs/guides/references/module-architecture-guide.md Section 1.3
 */

import { createLogger } from "../../../shared/utils/logger.js";

const logger = createLogger("AIFeedbackService");

/**
 * Feedback request parameters.
 */
export interface FeedbackRequest {
  wordId: string;
  userAnswer: string;
  correctAnswer: string;
  questionType: string;
}

/**
 * Feedback response containing explanation and error classification.
 */
export interface FeedbackResponse {
  explanation: string;
  errorType: string;
}

/**
 * Word shape consumed by AIFeedbackService.
 */
interface WordData {
  id: string;
  simplified: string;
  pinyin: string;
  english: string;
  [key: string]: unknown;
}

/**
 * AI client interface.
 */
interface IAIClient {
  generateText(
    prompt: string,
    options?: { temperature?: number; maxTokens?: number },
  ): Promise<string>;
}

/**
 * Word repository interface.
 */
interface IWordRepository {
  findById(id: string): Promise<WordData | null>;
}

/**
 * AI Feedback Service — generates personalized explanations for quiz errors.
 * Pure business logic with zero caching or HTTP concerns.
 */
export class AIFeedbackService {
  private wordRepository: IWordRepository;
  private aiClient: IAIClient;

  constructor(wordRepository: IWordRepository, aiClient: IAIClient) {
    this.wordRepository = wordRepository;
    this.aiClient = aiClient;
    logger.info("Initialized AI Feedback Service");
  }

  /**
   * Generate AI-powered feedback for quiz errors
   * @param params - Feedback parameters
   */
  async generateFeedback({
    wordId,
    userAnswer,
    correctAnswer,
    questionType,
  }: FeedbackRequest): Promise<FeedbackResponse> {
    // Input sanitization - prevent prompt injection
    const sanitizedUserAnswer = sanitizeInput(userAnswer);
    const sanitizedCorrectAnswer = sanitizeInput(correctAnswer);

    if (!sanitizedUserAnswer || !sanitizedCorrectAnswer) {
      throw new Error("Invalid input: answers cannot be empty after sanitization");
    }

    // Fetch word details
    const word = await this.wordRepository.findById(wordId);
    if (!word) {
      throw new Error(`Word not found: ${wordId}`);
    }

    // Generate AI feedback with 3-second timeout
    try {
      const feedback = await Promise.race([
        this.generateAIFeedback(sanitizedUserAnswer, sanitizedCorrectAnswer, word, questionType),
        timeoutPromise(3000),
      ]);

      logger.info(`Generated feedback for wordId: ${wordId}`);
      return feedback;
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "Request timeout") {
        logger.warn(`Gemini API timeout for wordId ${wordId}`);
      } else if (error instanceof Error) {
        logger.error(`Gemini API error for wordId ${wordId}: ${error.message}`, null);
      }

      // Return fallback feedback on timeout or error
      return getFallbackFeedback();
    }
  }

  /**
   * Generate AI feedback using Gemini API
   * @private
   */
  private async generateAIFeedback(
    userAnswer: string,
    correctAnswer: string,
    word: WordData,
    questionType: string,
  ): Promise<FeedbackResponse> {
    const prompt = buildAIPrompt(userAnswer, correctAnswer, word, questionType);

    logger.info(`Calling Gemini API for wordId: ${word.id}`);
    logger.info(`Prompt length: ${prompt.length} characters`);

    try {
      const response = await this.aiClient.generateText(prompt, {
        temperature: 0.7,
        maxTokens: 200,
      });

      logger.info(`Gemini response received: ${response.substring(0, 100)}...`);

      // Parse response - expect JSON format
      try {
        // Try to extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.explanation && parsed.errorType) {
            logger.info(`Successfully parsed JSON response for wordId: ${word.id}`);
            return {
              explanation: parsed.explanation,
              errorType: parsed.errorType.toLowerCase(),
            };
          }
        }

        // Fallback: use the whole response as explanation, classify manually
        logger.warn("Could not parse JSON from Gemini response, using raw text");
        const errorType = classifyErrorType(userAnswer, correctAnswer, word);
        return {
          explanation: response.trim().substring(0, 300),
          errorType,
        };
      } catch (parseError: unknown) {
        const msg = parseError instanceof Error ? parseError.message : String(parseError);
        logger.warn(`Failed to parse Gemini JSON response: ${msg}`);
        const errorType = classifyErrorType(userAnswer, correctAnswer, word);
        return {
          explanation: response.trim().substring(0, 300),
          errorType,
        };
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`generateAIFeedback error: ${msg}`, null);
      throw error;
    }
  }
}

// ── Module-level helpers (extracted from CachedAIFeedbackService) ──────────

/**
 * Sanitize user input to prevent prompt injection
 * @param input - Raw user input
 * @returns Sanitized input
 */
function sanitizeInput(input: string): string {
  if (!input || typeof input !== "string") return "";

  const sanitized = input.replace(/[<>{}[\]]/g, "").trim();

  return sanitized.substring(0, 100);
}

/**
 * Create timeout promise
 * @param ms - Timeout in milliseconds
 */
function timeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Request timeout")), ms);
  });
}

/**
 * Build prompt for Gemini API
 * @param userAnswer - User's answer
 * @param correctAnswer - Correct answer
 * @param word - Word details
 * @param questionType - Question type
 * @returns Formatted prompt
 */
function buildAIPrompt(
  userAnswer: string,
  correctAnswer: string,
  word: WordData,
  questionType: string,
): string {
  return `You are a Mandarin Chinese tutor helping a beginner student understand their mistake.

**Student's mistake:**
- Question type: ${questionType}
- Student answered: "${userAnswer}"
- Correct answer: "${correctAnswer}"
- Word: ${word.simplified} (${word.pinyin}) meaning "${word.english}"

**Task:**
1. Classify the error type as one of: "tone", "character", or "meaning"
   - "tone": Different tone marks (e.g., mā vs mǎ)
   - "character": Different Chinese characters (e.g., 妈 vs 马)
   - "meaning": Semantic confusion (e.g., confusing hello with hi)

2. Explain the confusion in 2-3 simple sentences suitable for beginners.
3. Provide a helpful learning tip if applicable.

**Format your response as JSON:**
{
  "errorType": "tone"|"character"|"meaning",
  "explanation": "Your 2-3 sentence explanation here."
}

Keep language simple and encouraging. Focus on helping the student understand WHY they made this mistake.`;
}

/**
 * Classify error type based on answer comparison
 * Fallback logic if Gemini doesn't provide classification
 * @param userAnswer - User's answer
 * @param correctAnswer - Correct answer
 * @param word - Word details
 * @returns Error type: 'tone' | 'character' | 'meaning'
 */
function classifyErrorType(userAnswer: string, correctAnswer: string, word: WordData): string {
  const userLower = userAnswer.toLowerCase();
  const correctLower = correctAnswer.toLowerCase();
  const wordChinese = word.simplified || word.traditional || "";

  if (/[\u4e00-\u9fa5]/.test(userAnswer) && userAnswer !== wordChinese) {
    return "character";
  }

  if (
    userLower.replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g, "") ===
      correctLower.replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g, "") ||
    (hasToneMarks(userAnswer) && hasToneMarks(correctAnswer))
  ) {
    return "tone";
  }

  return "meaning";
}

/**
 * Check if string contains tone marks
 * @param str - Input string
 * @returns True if contains tone marks
 */
function hasToneMarks(str: string): boolean {
  return /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(str);
}

/**
 * Get fallback feedback when AI is unavailable
 * @returns {{explanation: string, errorType: string}} Generic feedback
 */
function getFallbackFeedback() {
  return {
    explanation:
      "We couldn't generate detailed feedback right now. Review this word again to reinforce your memory. Pay attention to tones, character shapes, and meanings.",
    errorType: "generic",
  };
}
