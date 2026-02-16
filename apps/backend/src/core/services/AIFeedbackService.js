/**
 * AI Feedback Service
 * Generates personalized error explanations for incorrect quiz answers.
 * Uses Gemini API with Redis caching for cost optimization.
 * Architecture: Core/Domain service layer - orchestrates Gemini API + caching.
 */

import { generateText } from "../../infrastructure/external/GeminiClient.js";
import { cacheMetrics } from "../../utils/CacheMetrics.js";
import { createLogger } from "../../utils/logger.js";

const logger = createLogger("AIFeedbackService");

/**
 * Generate AI-powered feedback for quiz errors
 * @param {Object} params - Feedback parameters
 * @param {string} params.wordId - Vocabulary word ID (e.g., "hsk3-band1-125")
 * @param {string} params.userAnswer - User's incorrect answer
 * @param {string} params.correctAnswer - Correct answer
 * @param {string} params.questionType - Type of question (multiple_choice, type_pinyin, type_character)
 * @param {Object} cacheService - Redis cache service instance
 * @param {Object} vocabularyRepo - VocabularyRepository instance
 * @returns {Promise<{explanation: string, errorType: string}>} Feedback object
 */
export async function generateFeedback(
  { wordId, userAnswer, correctAnswer, questionType },
  cacheService,
  vocabularyRepo,
) {
  // Input sanitization - prevent prompt injection
  const sanitizedUserAnswer = sanitizeInput(userAnswer);
  const sanitizedCorrectAnswer = sanitizeInput(correctAnswer);

  if (!sanitizedUserAnswer || !sanitizedCorrectAnswer) {
    throw new Error("Invalid input: answers cannot be empty after sanitization");
  }

  // Check cache first
  const cacheKey = generateCacheKey(wordId, sanitizedUserAnswer);
  const cached = await cacheService.get(cacheKey);

  if (cached) {
    cacheMetrics.record("hit");
    try {
      return JSON.parse(cached);
    } catch (error) {
      logger.error(`Failed to parse cached feedback: ${error.message}`);
      // Continue to generate new feedback if cache parse fails
    }
  }

  cacheMetrics.record("miss");

  // Fetch word details
  const word = await vocabularyRepo.findById(wordId);
  if (!word) {
    throw new Error(`Word not found: ${wordId}`);
  }

  // Generate AI feedback with 3-second timeout
  try {
    const feedback = await Promise.race([
      generateAIFeedback(sanitizedUserAnswer, sanitizedCorrectAnswer, word, questionType),
      timeoutPromise(3000),
    ]);

    // Cache successful result (24 hours TTL)
    await cacheService.set(cacheKey, JSON.stringify(feedback), 86400);

    return feedback;
  } catch (error) {
    if (error.message === "Request timeout") {
      logger.warn(`Gemini API timeout for wordId ${wordId}`);
    } else {
      logger.error(`Gemini API error: ${error.message}`);
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
function generateCacheKey(wordId, userAnswer) {
  return `quiz:feedback:${wordId}:${userAnswer.toLowerCase()}`;
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
 * Generate AI feedback using Gemini API
 * Prompts Gemini to classify error type AND provide explanation
 * @param {string} userAnswer - User's answer
 * @param {string} correctAnswer - Correct answer
 * @param {Object} word - Word details from database
 * @param {string} questionType - Question type
 * @returns {Promise<{explanation: string, errorType: string}>} Feedback
 */
async function generateAIFeedback(userAnswer, correctAnswer, word, questionType) {
  const prompt = buildAIPrompt(userAnswer, correctAnswer, word, questionType);

  logger.debug(`Calling Gemini API for wordId: ${word.id}`);

  const response = await generateText(prompt, {
    temperature: 0.7,
    maxTokens: 200,
  });

  // Parse response - expect JSON format
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.explanation && parsed.errorType) {
        return {
          explanation: parsed.explanation,
          errorType: parsed.errorType.toLowerCase(),
        };
      }
    }

    // Fallback: use the whole response as explanation, classify manually
    const errorType = classifyErrorType(userAnswer, correctAnswer, word);
    return {
      explanation: response.trim().substring(0, 300), // Limit length
      errorType,
    };
  } catch (error) {
    logger.warn(`Failed to parse Gemini JSON response, using raw text`);
    const errorType = classifyErrorType(userAnswer, correctAnswer, word);
    return {
      explanation: response.trim().substring(0, 300), // Limit length
      errorType,
    };
  }
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
