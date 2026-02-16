/**
 * Cached AI Feedback Service
 * Generates personalized error explanations for incorrect quiz answers.
 * Wrapper service following clean architecture pattern with cache integration.
 * Matches TTS/Conversation service architecture (class-based with DI).
 */

import { generateText } from "../../infrastructure/external/GeminiClient.js";
import { cacheMetrics } from "../../utils/CacheMetrics.js";
import { createLogger } from "../../utils/logger.js";

const logger = createLogger("CachedAIFeedbackService");

/**
 * AI Feedback Service with caching layer
 * Follows same pattern as CachedTTSService and CachedConversationService
 */
export class CachedAIFeedbackService {
  /**
   * @param {Object} vocabularyRepo - VocabularyRepository instance
   * @param {import('../../infrastructure/cache/CacheService.js').CacheService} cacheService - Cache service instance
   */
  constructor(vocabularyRepo, cacheService) {
    this.vocabularyRepo = vocabularyRepo;
    this.cacheService = cacheService;
    this.metrics = {
      hits: 0,
      misses: 0,
    };
    logger.info("Initialized AI Feedback Service with cache");
  }

  /**
   * Generate AI-powered feedback for quiz errors
   * @param {Object} params - Feedback parameters
   * @param {string} params.wordId - Vocabulary word ID (e.g., "hsk3-band1-125")
   * @param {string} params.userAnswer - User's incorrect answer
   * @param {string} params.correctAnswer - Correct answer
   * @param {string} params.questionType - Type of question (multiple_choice, type_pinyin, type_character)
   * @returns {Promise<{explanation: string, errorType: string}>} Feedback object
   */
  async generateFeedback({ wordId, userAnswer, correctAnswer, questionType }) {
    // Input sanitization - prevent prompt injection
    const sanitizedUserAnswer = sanitizeInput(userAnswer);
    const sanitizedCorrectAnswer = sanitizeInput(correctAnswer);

    if (!sanitizedUserAnswer || !sanitizedCorrectAnswer) {
      throw new Error("Invalid input: answers cannot be empty after sanitization");
    }

    // Check cache first
    const cacheKey = this.generateCacheKey(wordId, sanitizedUserAnswer);
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      this.metrics.hits++;
      cacheMetrics.record("hit");
      logger.cacheHit(cacheKey);
      try {
        return JSON.parse(cached);
      } catch (error) {
        logger.error(`Failed to parse cached feedback: ${error.message}`);
        // Continue to generate new feedback if cache parse fails
      }
    }

    this.metrics.misses++;
    cacheMetrics.record("miss");
    logger.cacheMiss(cacheKey);

    // Fetch word details
    const word = await this.vocabularyRepo.findById(wordId);
    if (!word) {
      throw new Error(`Word not found: ${wordId}`);
    }

    // Generate AI feedback with 3-second timeout
    try {
      const feedback = await Promise.race([
        this.generateAIFeedback(sanitizedUserAnswer, sanitizedCorrectAnswer, word, questionType),
        timeoutPromise(3000),
      ]);

      // Cache successful result (24 hours TTL)
      await this.cacheService.set(cacheKey, JSON.stringify(feedback), 86400);
      logger.info(`Generated and cached feedback: ${cacheKey}`);

      return feedback;
    } catch (error) {
      if (error.message === "Request timeout") {
        logger.warn(`Gemini API timeout for wordId ${wordId}`);
      } else {
        logger.error(`Gemini API error for wordId ${wordId}: ${error.message}`);
        logger.error(`Error stack: ${error.stack}`);
        logger.error(`Error type: ${error.constructor.name}`);
      }

      // Return fallback feedback on timeout or error
      return getFallbackFeedback();
    }
  }

  /**
   * Generate cache key for feedback
   * @param {string} wordId - Word ID (e.g., "hsk3-band1-125")
   * @param {string} userAnswer - User's answer
   * @returns {string} Cache key
   */
  generateCacheKey(wordId, userAnswer) {
    return `quiz:feedback:${wordId}:${userAnswer.toLowerCase()}`;
  }

  /**
   * Generate AI feedback using Gemini API
   * @param {string} userAnswer - User's answer
   * @param {string} correctAnswer - Correct answer
   * @param {Object} word - Word details from database
   * @param {string} questionType - Question type
   * @returns {Promise<{explanation: string, errorType: string}>} Feedback
   * @private
   */
  async generateAIFeedback(userAnswer, correctAnswer, word, questionType) {
    const prompt = buildAIPrompt(userAnswer, correctAnswer, word, questionType);

    logger.info(`Calling Gemini API for wordId: ${word.id}`);
    logger.info(`Prompt length: ${prompt.length} characters`);

    try {
      const response = await generateText(prompt, {
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
        logger.warn(`Could not parse JSON from Gemini response, using raw text`);
        const errorType = classifyErrorType(userAnswer, correctAnswer, word);
        return {
          explanation: response.trim().substring(0, 300), // Limit length
          errorType,
        };
      } catch (parseError) {
        logger.warn(`Failed to parse Gemini JSON response: ${parseError.message}`);
        const errorType = classifyErrorType(userAnswer, correctAnswer, word);
        return {
          explanation: response.trim().substring(0, 300), // Limit length
          errorType,
        };
      }
    } catch (error) {
      logger.error(`generateAIFeedback error: ${error.message}`);
      throw error; // Re-throw to be caught by outer try-catch
    }
    {
      logger.warn(`Failed to parse Gemini JSON response, using raw text`);
      const errorType = classifyErrorType(userAnswer, correctAnswer, word);
      return {
        explanation: response.trim().substring(0, 300), // Limit length
        errorType,
      };
    }
  }

  /**
   * Get cache metrics for monitoring
   * @returns {{hits: number, misses: number}} Metrics object
   */
  getMetrics() {
    return {
      hits: this.metrics.hits,
      misses: this.metrics.misses,
    };
  }
}

/**
 * Sanitize user input to prevent prompt injection
 * @param {string} input - Raw user input
 * @returns {string} Sanitized input
 */
function sanitizeInput(input) {
  if (!input || typeof input !== "string") return "";

  // Remove potentially dangerous characters
  const sanitized = input
    .replace(/[<>{}[\]]/g, "") // Remove brackets and braces
    .trim();

  // Limit length to 100 characters
  return sanitized.substring(0, 100);
}

/**
 * Create timeout promise
 * @param {number} ms - Timeout in milliseconds
 * @returns {Promise<never>} Promise that rejects after timeout
 */
function timeoutPromise(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Request timeout")), ms);
  });
}

/**
 * Build prompt for Gemini API
 * @param {string} userAnswer - User's answer
 * @param {string} correctAnswer - Correct answer
 * @param {Object} word - Word details
 * @param {string} questionType - Question type
 * @returns {string} Formatted prompt
 */
function buildAIPrompt(userAnswer, correctAnswer, word, questionType) {
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
 * @param {string} userAnswer - User's answer
 * @param {string} correctAnswer - Correct answer
 * @param {Object} word - Word details
 * @returns {string} Error type: 'tone' | 'character' | 'meaning'
 */
function classifyErrorType(userAnswer, correctAnswer, word) {
  const userLower = userAnswer.toLowerCase();
  const correctLower = correctAnswer.toLowerCase();
  const wordChinese = word.simplified || word.traditional || "";

  // Character error: user answer contains Chinese character different from word
  if (/[\u4e00-\u9fa5]/.test(userAnswer) && userAnswer !== wordChinese) {
    return "character";
  }

  // Tone error: similar pinyin but possibly different tones
  // Simplified heuristic: if answers are similar (edit distance) and contain tone marks
  if (
    userLower.replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g, "") ===
      correctLower.replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g, "") ||
    (hasToneMarks(userAnswer) && hasToneMarks(correctAnswer))
  ) {
    return "tone";
  }

  // Default to meaning error
  return "meaning";
}

/**
 * Check if string contains tone marks
 * @param {string} str - Input string
 * @returns {boolean} True if contains tone marks
 */
function hasToneMarks(str) {
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
