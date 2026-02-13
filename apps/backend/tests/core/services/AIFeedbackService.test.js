/**
 * Unit tests for CachedAIFeedbackService
 * Tests AI feedback generation, caching, timeout handling, and error classification
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { CachedAIFeedbackService } from "../../../src/core/services/CachedAIFeedbackService.js";
import * as GeminiClient from "../../../src/infrastructure/external/GeminiClient.js";
import { cacheMetrics } from "../../../src/utils/CacheMetrics.js";

// Mock external dependencies
vi.mock("../../../src/infrastructure/external/GeminiClient.js");

describe("CachedAIFeedbackService", () => {
  let feedbackService;
  let mockCacheService;
  let mockVocabularyRepo;
  let mockWord;

  beforeEach(() => {
    // Reset cache metrics
    cacheMetrics.reset();

    // Mock cache service
    mockCacheService = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
    };

    // Mock word data
    mockWord = {
      id: 1,
      simplified: "妈",
      traditional: "媽",
      pinyin: "mā",
      english: "mother",
    };

    // Mock VocabularyRepository instance
    mockVocabularyRepo = {
      findById: vi.fn().mockResolvedValue(mockWord),
    };

    // Mock GeminiClient.generateText
    vi.spyOn(GeminiClient, "generateText").mockResolvedValue(
      JSON.stringify({
        errorType: "tone",
        explanation:
          "You confused mā (mother) with mǎ (horse). These words use the same syllable but different tones. The first tone (mā) is high and level, while the third tone (mǎ) starts low, dips, and rises. Practice listening carefully to tone differences!",
      }),
    );

    // Initialize service with dependencies
    feedbackService = new CachedAIFeedbackService(mockVocabularyRepo, mockCacheService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("generateFeedback", () => {
    it("should return cached feedback on cache hit", async () => {
      const cachedFeedback = {
        explanation: "Cached explanation",
        errorType: "tone",
      };

      mockCacheService.get.mockResolvedValue(JSON.stringify(cachedFeedback));

      const result = await feedbackService.generateFeedback({
        wordId: 1,
        userAnswer: "mǎ",
        correctAnswer: "mā",
        questionType: "tone_audio",
      });

      expect(result).toEqual(cachedFeedback);
      expect(mockCacheService.get).toHaveBeenCalledWith("quiz:feedback:1:mǎ");
      expect(GeminiClient.generateText).not.toHaveBeenCalled();
      expect(cacheMetrics.getSnapshot().hits).toBe(1);
      expect(cacheMetrics.getSnapshot().misses).toBe(0);
    });

    it("should call Gemini API on cache miss", async () => {
      mockCacheService.get.mockResolvedValue(null);

      const result = await feedbackService.generateFeedback({
        wordId: 1,
        userAnswer: "mǎ",
        correctAnswer: "mā",
        questionType: "tone_audio",
      });

      expect(result.errorType).toBe("tone");
      expect(result.explanation).toContain("confused mā");
      expect(GeminiClient.generateText).toHaveBeenCalled();
      expect(mockCacheService.set).toHaveBeenCalledWith(
        "quiz:feedback:1:mǎ",
        expect.stringContaining("tone"),
        86400, // 24 hours
      );
      expect(cacheMetrics.getSnapshot().misses).toBe(1);
    });

    it("should sanitize user input before processing", async () => {
      const maliciousInput = "<script>alert('xss')</script>mǎ";

      await feedbackService.generateFeedback({
        wordId: 1,
        userAnswer: maliciousInput,
        correctAnswer: "mā",
        questionType: "tone_audio",
      });

      // Check that cache key uses sanitized input (brackets removed)
      expect(mockCacheService.get).toHaveBeenCalledWith(
        expect.stringMatching(/quiz:feedback:1:scriptalert\('xss'\)\/scriptmǎ/),
      );
    });

    it("should throw error for empty answers after sanitization", async () => {
      await expect(
        feedbackService.generateFeedback({
          wordId: 1,
          userAnswer: "<<<>>>", // Will be empty after sanitization
          correctAnswer: "mā",
          questionType: "tone_audio",
        }),
      ).rejects.toThrow("Invalid input");
    });

    it("should return fallback feedback on Gemini API timeout", async () => {
      // Mock slow Gemini response (> 3 seconds)
      vi.spyOn(GeminiClient, "generateText").mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve("Too slow"), 5000);
          }),
      );

      const result = await feedbackService.generateFeedback({
        wordId: 1,
        userAnswer: "mǎ",
        correctAnswer: "mā",
        questionType: "tone_audio",
      });

      expect(result.errorType).toBe("generic");
      expect(result.explanation).toContain("couldn't generate detailed feedback");
    }, 6000); // Test timeout > 3s API timeout

    it("should return fallback feedback on Gemini API error", async () => {
      vi.spyOn(GeminiClient, "generateText").mockRejectedValue(new Error("Gemini API failed"));

      const result = await feedbackService.generateFeedback({
        wordId: 1,
        userAnswer: "mǎ",
        correctAnswer: "mā",
        questionType: "tone_audio",
      });

      expect(result.errorType).toBe("generic");
      expect(result.explanation).toContain("couldn't generate detailed feedback");
    });

    it("should handle word not found error", async () => {
      mockVocabularyRepo.findById.mockResolvedValue(null);

      await expect(
        feedbackService.generateFeedback({
          wordId: 999,
          userAnswer: "mǎ",
          correctAnswer: "mā",
          questionType: "tone_audio",
        }),
      ).rejects.toThrow("Word not found: 999");
    });

    it("should parse JSON response from Gemini correctly", async () => {
      const geminiResponse = {
        errorType: "character",
        explanation: "These characters look similar but have different radicals.",
      };

      vi.spyOn(GeminiClient, "generateText").mockResolvedValue(JSON.stringify(geminiResponse));

      const result = await feedbackService.generateFeedback({
        wordId: 1,
        userAnswer: "马",
        correctAnswer: "妈",
        questionType: "character_choice",
      });

      expect(result.errorType).toBe("character");
      expect(result.explanation).toContain("similar");
    });

    it("should extract JSON from Gemini response with extra text", async () => {
      const geminiResponseWithExtra = `Here is the feedback:
      {
        "errorType": "meaning",
        "explanation": "You confused similar meanings."
      }
      Hope this helps!`;

      vi.spyOn(GeminiClient, "generateText").mockResolvedValue(geminiResponseWithExtra);

      const result = await feedbackService.generateFeedback({
        wordId: 1,
        userAnswer: "hello",
        correctAnswer: "hi",
        questionType: "english_choice",
      });

      expect(result.errorType).toBe("meaning");
      expect(result.explanation).toContain("similar meanings");
    });

    it("should fallback to raw text if JSON parsing fails", async () => {
      vi.spyOn(GeminiClient, "generateText").mockResolvedValue(
        "This is a plain text explanation without JSON format.",
      );

      const result = await feedbackService.generateFeedback({
        wordId: 1,
        userAnswer: "mǎ",
        correctAnswer: "mā",
        questionType: "tone_audio",
      });

      expect(result.explanation).toBe("This is a plain text explanation without JSON format.");
      expect(result.errorType).toBe("tone"); // Classified by fallback logic
    });

    it("should generate correct cache key for multiple requests", async () => {
      await feedbackService.generateFeedback({
        wordId: 1,
        userAnswer: "mǎ",
        correctAnswer: "mā",
        questionType: "tone_audio",
      });

      await feedbackService.generateFeedback({
        wordId: 2,
        userAnswer: "nǐ",
        correctAnswer: "ní",
        questionType: "pinyin_choice",
      });

      expect(mockCacheService.get).toHaveBeenNthCalledWith(1, "quiz:feedback:1:mǎ");
      expect(mockCacheService.get).toHaveBeenNthCalledWith(2, "quiz:feedback:2:nǐ");
    });

    it("should cache feedback with 24-hour TTL", async () => {
      await feedbackService.generateFeedback({
        wordId: 1,
        userAnswer: "mǎ",
        correctAnswer: "mā",
        questionType: "tone_audio",
      });

      expect(mockCacheService.set).toHaveBeenCalledWith(
        "quiz:feedback:1:mǎ",
        expect.any(String),
        86400, // 24 hours in seconds
      );
    });

    it("should classify tone errors correctly (fallback logic)", async () => {
      // Mock Gemini to return plain text without JSON
      vi.spyOn(GeminiClient, "generateText").mockResolvedValue("Tone marks change the meaning.");

      const result = await feedbackService.generateFeedback({
        wordId: 1,
        userAnswer: "mǎ", // Different tone
        correctAnswer: "mā",
        questionType: "tone_audio",
      });

      expect(result.errorType).toBe("tone");
    });

    it("should classify character errors correctly (fallback logic)", async () => {
      vi.spyOn(GeminiClient, "generateText").mockResolvedValue("Different characters.");

      mockVocabularyRepo.findById.mockResolvedValue({
        id: 1,
        simplified: "妈",
        pinyin: "mā",
        english: "mother",
      });

      const result = await feedbackService.generateFeedback({
        wordId: 1,
        userAnswer: "马", // Different Chinese character
        correctAnswer: "妈",
        questionType: "character_choice",
      });

      expect(result.errorType).toBe("character");
    });

    it("should limit explanation length when parsing plain text", async () => {
      const longText = "a".repeat(500);
      vi.spyOn(GeminiClient, "generateText").mockResolvedValue(longText);

      const result = await feedbackService.generateFeedback({
        wordId: 1,
        userAnswer: "mǎ",
        correctAnswer: "mā",
        questionType: "tone_audio",
      });

      expect(result.explanation.length).toBeLessThanOrEqual(300);
    });
  });

  describe("Error type classification (fallback)", () => {
    it("should classify meaning errors as default", async () => {
      vi.spyOn(GeminiClient, "generateText").mockResolvedValue(
        "Semantic confusion between similar words.",
      );

      const result = await feedbackService.generateFeedback({
        wordId: 1,
        userAnswer: "hello",
        correctAnswer: "hi",
        questionType: "english_choice",
      });

      expect(result.errorType).toBe("meaning");
    });
  });
});
