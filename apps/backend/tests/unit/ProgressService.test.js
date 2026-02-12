/**
 * @file apps/backend/tests/unit/ProgressService.test.js
 * @description Unit tests for ProgressService
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProgressService } from "../../src/core/services/ProgressService.js";
import { prisma } from "../../src/infrastructure/database/client.js";

// Mock Prisma client
vi.mock("../../src/infrastructure/database/client.js", () => ({
  prisma: {
    progress: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe("ProgressService", () => {
  let progressService;
  let mockRepository;

  beforeEach(() => {
    // Create mock repository with all required methods
    mockRepository = {
      findByUser: vi.fn(),
      findByUserAndWord: vi.fn(),
      upsert: vi.fn(),
    };

    progressService = new ProgressService(mockRepository);
    vi.clearAllMocks();
  });

  describe("calculateNextReview", () => {
    it("should return 1 day for 0% confidence", () => {
      const result = progressService.calculateNextReview(0);
      const daysDiff = Math.round((result - new Date()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(1);
    });

    it("should return ~30 days for 100% confidence", () => {
      const result = progressService.calculateNextReview(1);
      const daysDiff = Math.round((result - new Date()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(30);
    });

    it("should return ~8 days for 50% confidence", () => {
      const result = progressService.calculateNextReview(0.5);
      const daysDiff = Math.round((result - new Date()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThanOrEqual(7);
      expect(daysDiff).toBeLessThanOrEqual(9);
    });

    it("should return ~19 days for 80% confidence (mastered)", () => {
      const result = progressService.calculateNextReview(0.8);
      const daysDiff = Math.round((result - new Date()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThanOrEqual(18);
      expect(daysDiff).toBeLessThanOrEqual(20);
    });
  });

  describe("getProgressForUser", () => {
    it("should return all progress records for user", async () => {
      const mockProgress = [
        { id: "1", userId: "user1", wordId: "word1", confidence: 0.5 },
        { id: "2", userId: "user1", wordId: "word2", confidence: 0.8 },
      ];
      mockRepository.findByUser.mockResolvedValue(mockProgress);

      const result = await progressService.getProgressForUser("user1");

      expect(mockRepository.findByUser).toHaveBeenCalledWith("user1");
      expect(result).toEqual(mockProgress);
    });

    it("should return empty array if no progress", async () => {
      mockRepository.findByUser.mockResolvedValue([]);

      const result = await progressService.getProgressForUser("user1");

      expect(result).toEqual([]);
    });
  });

  describe("getProgressForWord", () => {
    it("should return progress for specific word", async () => {
      const mockProgress = {
        id: "1",
        userId: "user1",
        wordId: "word1",
        confidence: 0.5,
      };
      mockRepository.findByUserAndWord.mockResolvedValue(mockProgress);

      const result = await progressService.getProgressForWord("user1", "word1");

      expect(mockRepository.findByUserAndWord).toHaveBeenCalledWith("user1", "word1");
      expect(result).toEqual(mockProgress);
    });

    it("should return null if progress not found", async () => {
      mockRepository.findByUserAndWord.mockResolvedValue(null);

      const result = await progressService.getProgressForWord("user1", "word1");

      expect(result).toBeNull();
    });
  });

  describe("updateProgress", () => {
    it("should update existing progress", async () => {
      const mockUpdated = {
        id: "1",
        userId: "user1",
        wordId: "word1",
        studyCount: 5,
        correctCount: 4,
        confidence: 0.8,
        nextReview: new Date("2026-01-15"),
      };
      mockRepository.upsert.mockResolvedValue(mockUpdated);

      const result = await progressService.updateProgress("user1", "word1", {
        studyCount: 5,
        correctCount: 4,
        confidence: 0.8,
      });

      expect(mockRepository.upsert).toHaveBeenCalled();
      expect(result).toEqual(mockUpdated);
    });

    it("should create new progress if not exists", async () => {
      const mockCreated = {
        id: "1",
        userId: "user1",
        wordId: "word1",
        studyCount: 1,
        correctCount: 0,
        confidence: 0,
        nextReview: expect.any(Date),
      };
      mockRepository.upsert.mockResolvedValue(mockCreated);

      const result = await progressService.updateProgress("user1", "word1", {
        studyCount: 1,
      });

      expect(mockRepository.upsert).toHaveBeenCalled();
      expect(result).toEqual(mockCreated);
    });

    it("should calculate nextReview when confidence is provided", async () => {
      mockRepository.upsert.mockResolvedValue({ id: "1" });

      await progressService.updateProgress("user1", "word1", {
        confidence: 0.8,
      });

      const call = mockRepository.upsert.mock.calls[0];
      // Third argument is the data object
      expect(call[2].nextReview).toBeInstanceOf(Date);
    });

    it("should not recalculate nextReview if confidence not provided", async () => {
      mockRepository.upsert.mockResolvedValue({ id: "1" });

      await progressService.updateProgress("user1", "word1", {
        studyCount: 5,
      });

      const call = mockRepository.upsert.mock.calls[0];
      expect(call[2].nextReview).toBeUndefined();
    });
  });

  describe("batchUpdateProgress", () => {
    it("should update multiple words atomically", async () => {
      const updates = [
        { wordId: "word1", confidence: 0.5 },
        { wordId: "word2", confidence: 0.8 },
      ];
      const mockResults = [
        { id: "1", userId: "user1", wordId: "word1", confidence: 0.5 },
        { id: "2", userId: "user1", wordId: "word2", confidence: 0.8 },
      ];
      mockRepository.upsert
        .mockResolvedValueOnce(mockResults[0])
        .mockResolvedValueOnce(mockResults[1]);

      const result = await progressService.batchUpdateProgress("user1", updates);

      expect(mockRepository.upsert).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockResults);
    });

    it("should handle empty updates array", async () => {
      const result = await progressService.batchUpdateProgress("user1", []);

      expect(mockRepository.upsert).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe("getProgressStats", () => {
    it("should calculate statistics correctly", async () => {
      const past = new Date();
      past.setDate(past.getDate() - 1); // Yesterday

      const future = new Date();
      future.setDate(future.getDate() + 5); // 5 days from now

      const mockProgress = [
        {
          id: "1",
          userId: "user1",
          wordId: "word1",
          studyCount: 5,
          correctCount: 4,
          confidence: 0.8,
          nextReview: past, // Past - due for review
        },
        {
          id: "2",
          userId: "user1",
          wordId: "word2",
          studyCount: 3,
          correctCount: 2,
          confidence: 0.6,
          nextReview: future, // Future - not due yet
        },
        {
          id: "3",
          userId: "user1",
          wordId: "word3",
          studyCount: 0,
          correctCount: 0,
          confidence: 0,
          nextReview: future,
        },
      ];
      mockRepository.findByUser.mockResolvedValue(mockProgress);

      const result = await progressService.getProgressStats("user1");

      expect(result).toEqual({
        totalWords: 3,
        studiedWords: 2,
        masteredWords: 1,
        totalStudyCount: 8,
        averageConfidence: (0.8 + 0.6 + 0) / 3,
        wordsToReviewToday: 1, // Only word1 with past nextReview
      });
    });

    it("should return zeros for user with no progress", async () => {
      mockRepository.findByUser.mockResolvedValue([]);

      const result = await progressService.getProgressStats("user1");

      expect(result).toEqual({
        totalWords: 0,
        studiedWords: 0,
        masteredWords: 0,
        totalStudyCount: 0,
        averageConfidence: 0,
        wordsToReviewToday: 0,
      });
    });
  });

  // Story 15.1: Spaced Repetition Enhancement Tests
  describe("calculateNextReview with performanceMultiplier (Story 15.1)", () => {
    it("should use performanceMultiplier when provided (quiz mode)", () => {
      const result = progressService.calculateNextReview(0.5, 1.0);
      const daysDiff = Math.round((result - new Date()) / (1000 * 60 * 60 * 24));
      // 1.0 multiplier should give max days (30)
      expect(daysDiff).toBe(30);
    });

    it("should use performanceMultiplier 0.0 for immediate review", () => {
      const result = progressService.calculateNextReview(0.8, 0.0);
      const daysDiff = Math.round((result - new Date()) / (1000 * 60 * 60 * 24));
      // 0.0 multiplier should give min days (1)
      expect(daysDiff).toBe(1);
    });

    it("should fall back to confidence² when performanceMultiplier is null", () => {
      const resultWithNull = progressService.calculateNextReview(0.5, null);
      const resultWithoutParam = progressService.calculateNextReview(0.5);

      // Both should give same result (backward compatibility)
      expect(resultWithNull.getTime()).toBe(resultWithoutParam.getTime());
    });

    it("should prioritize performanceMultiplier over confidence", () => {
      // Even with high confidence, multiplier 0.0 should give 1 day
      const result = progressService.calculateNextReview(1.0, 0.0);
      const daysDiff = Math.round((result - new Date()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(1);
    });
  });

  describe("recordQuizResult (Story 15.1)", () => {
    let mockQuizResultRepository;

    beforeEach(() => {
      mockQuizResultRepository = {
        create: vi.fn(),
        findLatestByUserAndWord: vi.fn(),
      };
      progressService = new ProgressService(mockRepository, mockQuizResultRepository);
      vi.clearAllMocks();
    });

    it("should throw error if QuizResultRepository not injected", async () => {
      const serviceWithoutQuizRepo = new ProgressService(mockRepository);

      await expect(
        serviceWithoutQuizRepo.recordQuizResult({
          userId: "user1",
          wordId: "word1",
          correct: true,
          questionType: "multiple_choice",
        }),
      ).rejects.toThrow("QuizResultRepository not injected");
    });

    it("should record correct answer with 1.0x multiplier", async () => {
      const existingProgress = {
        userId: "user1",
        wordId: "word1",
        studyCount: 3,
        correctCount: 2,
        confidence: 0.6,
        lapseCount: 2,
        currentDelay: 5,
      };
      mockRepository.findByUserAndWord.mockResolvedValue(existingProgress);
      mockRepository.upsert.mockResolvedValue({ id: "1", lapseCount: 0 });
      mockQuizResultRepository.create.mockResolvedValue({ id: "qr1" });

      const result = await progressService.recordQuizResult({
        userId: "user1",
        wordId: "word1",
        correct: true,
        questionType: "type_pinyin",
        timeSpentMs: 3500,
      });

      // Check progress upsert called with correct data
      expect(mockRepository.upsert).toHaveBeenCalledWith("user1", "word1", {
        studyCount: 4,
        correctCount: 3,
        nextReview: expect.any(Date),
        lapseCount: 0, // Reset on correct
        currentDelay: 30, // 1.0 multiplier gives max days
        confidence: 0.6, // Preserved
      });

      // Check quiz result created
      expect(mockQuizResultRepository.create).toHaveBeenCalledWith({
        userId: "user1",
        wordId: "word1",
        correct: true,
        questionType: "type_pinyin",
        timeSpentMs: 3500,
      });

      // Check return value
      expect(result.lapseCount).toBe(0);
      expect(result.isLeech).toBe(false);
      expect(result.nextReviewDate).toBeInstanceOf(Date);
    });

    it("should record incorrect answer with 0.0x multiplier", async () => {
      const existingProgress = {
        userId: "user1",
        wordId: "word1",
        studyCount: 3,
        correctCount: 2,
        confidence: 0.6,
        lapseCount: 2,
        currentDelay: 5,
      };
      mockRepository.findByUserAndWord.mockResolvedValue(existingProgress);
      mockRepository.upsert.mockResolvedValue({ id: "1", lapseCount: 3 });
      mockQuizResultRepository.create.mockResolvedValue({ id: "qr1" });

      const result = await progressService.recordQuizResult({
        userId: "user1",
        wordId: "word1",
        correct: false,
        questionType: "multiple_choice",
      });

      // Check lapse count incremented
      expect(mockRepository.upsert).toHaveBeenCalledWith("user1", "word1", {
        studyCount: 4,
        correctCount: 2, // Not incremented
        nextReview: expect.any(Date),
        lapseCount: 3, // Incremented from 2
        currentDelay: 1, // 0.0 multiplier gives min days
        confidence: 0.6,
      });

      expect(result.lapseCount).toBe(3);
      expect(result.isLeech).toBe(false);
    });

    it("should mark as leech when lapseCount >= 5", async () => {
      const existingProgress = {
        userId: "user1",
        wordId: "word1",
        studyCount: 8,
        correctCount: 3,
        confidence: 0.3,
        lapseCount: 4,
        currentDelay: 2,
      };
      mockRepository.findByUserAndWord.mockResolvedValue(existingProgress);
      mockRepository.upsert.mockResolvedValue({ id: "1", lapseCount: 5 });
      mockQuizResultRepository.create.mockResolvedValue({ id: "qr1" });

      const result = await progressService.recordQuizResult({
        userId: "user1",
        wordId: "word1",
        correct: false,
        questionType: "type_character",
      });

      expect(result.lapseCount).toBe(5);
      expect(result.isLeech).toBe(true); // >= 5 threshold
    });

    it("should handle new word with no existing progress", async () => {
      mockRepository.findByUserAndWord.mockResolvedValue(null);
      mockRepository.upsert.mockResolvedValue({ id: "1", lapseCount: 0 });
      mockQuizResultRepository.create.mockResolvedValue({ id: "qr1" });

      const result = await progressService.recordQuizResult({
        userId: "user1",
        wordId: "word1",
        correct: true,
        questionType: "multiple_choice",
      });

      // Check default values used
      expect(mockRepository.upsert).toHaveBeenCalledWith("user1", "word1", {
        studyCount: 1,
        correctCount: 1,
        nextReview: expect.any(Date),
        lapseCount: 0,
        currentDelay: 30,
        confidence: 0, // Default
      });

      expect(result.isLeech).toBe(false);
    });
  });

  describe("determineAlgorithmMode (Story 15.1)", () => {
    let mockQuizResultRepository;

    beforeEach(() => {
      mockQuizResultRepository = {
        create: vi.fn(),
        findLatestByUserAndWord: vi.fn(),
      };
      progressService = new ProgressService(mockRepository, mockQuizResultRepository);
      vi.clearAllMocks();
    });

    it("should return 'flashcard' when QuizResultRepository not injected", async () => {
      const serviceWithoutQuizRepo = new ProgressService(mockRepository);

      const mode = await serviceWithoutQuizRepo.determineAlgorithmMode("user1", "word1");

      expect(mode).toBe("flashcard");
    });

    it("should return 'flashcard' when no quiz results exist", async () => {
      mockQuizResultRepository.findLatestByUserAndWord.mockResolvedValue(null);
      mockRepository.findByUserAndWord.mockResolvedValue({
        userId: "user1",
        wordId: "word1",
        updatedAt: new Date(),
      });

      const mode = await progressService.determineAlgorithmMode("user1", "word1");

      expect(mode).toBe("flashcard");
    });

    it("should return 'quiz' when quiz result exists but no progress", async () => {
      mockQuizResultRepository.findLatestByUserAndWord.mockResolvedValue({
        userId: "user1",
        wordId: "word1",
        answeredAt: new Date(),
      });
      mockRepository.findByUserAndWord.mockResolvedValue(null);

      const mode = await progressService.determineAlgorithmMode("user1", "word1");

      expect(mode).toBe("quiz");
    });

    it("should return 'quiz' when quiz result is more recent", async () => {
      const now = new Date();
      const recentQuiz = new Date(now.getTime() + 1000); // 1 second later
      const olderProgress = new Date(now.getTime() - 1000); // 1 second earlier

      mockQuizResultRepository.findLatestByUserAndWord.mockResolvedValue({
        answeredAt: recentQuiz,
      });
      mockRepository.findByUserAndWord.mockResolvedValue({
        updatedAt: olderProgress,
      });

      const mode = await progressService.determineAlgorithmMode("user1", "word1");

      expect(mode).toBe("quiz");
    });

    it("should return 'flashcard' when progress is more recent", async () => {
      const now = new Date();
      const recentProgress = new Date(now.getTime() + 1000); // 1 second later
      const olderQuiz = new Date(now.getTime() - 1000); // 1 second earlier

      mockQuizResultRepository.findLatestByUserAndWord.mockResolvedValue({
        answeredAt: olderQuiz,
      });
      mockRepository.findByUserAndWord.mockResolvedValue({
        updatedAt: recentProgress,
      });

      const mode = await progressService.determineAlgorithmMode("user1", "word1");

      expect(mode).toBe("flashcard");
    });
  });

  describe("getDueWords (Story 15.2 Phase 2)", () => {
    let mockVocabularyRepository;

    beforeEach(() => {
      mockVocabularyRepository = {
        findByIds: vi.fn(),
      };
      mockRepository.findDueByUserAndDate = vi.fn();
      progressService = new ProgressService(mockRepository, null, mockVocabularyRepository);
    });

    it("should return enriched due words with vocabulary data", async () => {
      const mockProgress = [
        {
          id: "p1",
          userId: "user1",
          wordId: "1",
          nextReview: "2025-01-15",
          lapseCount: 2,
          studyCount: 10,
          currentDelay: null,
        },
        {
          id: "p2",
          userId: "user1",
          wordId: "2",
          nextReview: "2025-01-15",
          lapseCount: 0,
          studyCount: 5,
          currentDelay: null,
        },
      ];
      const mockVocab = [
        {
          id: "1",
          simplified: "你好",
          traditional: "你好",
          pinyin: "nǐ hǎo",
          english: "hello",
          categories: [{ category: { name: "Greetings" } }],
        },
        {
          id: "2",
          simplified: "再见",
          traditional: "再見",
          pinyin: "zài jiàn",
          english: "goodbye",
          categories: [{ category: { name: "Farewells" } }],
        },
      ];
      mockRepository.findDueByUserAndDate.mockResolvedValue(mockProgress);
      mockVocabularyRepository.findByIds.mockResolvedValue(mockVocab);

      const result = await progressService.getDueWords("user1", "2025-01-15", 20);

      expect(mockRepository.findDueByUserAndDate).toHaveBeenCalledWith("user1", "2025-01-15", 20);
      expect(mockVocabularyRepository.findByIds).toHaveBeenCalledWith(["1", "2"]);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: "1",
        simplified: "你好",
        traditional: "你好",
        pinyin: "nǐ hǎo",
        english: "hello",
        nextReview: "2025-01-15",
        lapseCount: 2,
        studyCount: 10,
        categories: ["Greetings"],
      });
      expect(result[1]).toMatchObject({
        id: "2",
        simplified: "再见",
        traditional: "再見",
        pinyin: "zài jiàn",
        english: "goodbye",
        lapseCount: 0,
        studyCount: 5,
        categories: ["Farewells"],
      });
    });

    it("should filter out words without vocabulary data", async () => {
      const mockProgress = [
        { id: "p1", userId: "user1", wordId: "1", nextReview: "2025-01-15", lapseCount: 0 },
        { id: "p2", userId: "user1", wordId: "2", nextReview: "2025-01-15", lapseCount: 1 },
      ];
      const mockVocab = [
        {
          id: "1",
          simplified: "你好",
          traditional: "你好",
          pinyin: "nǐ hǎo",
          english: "hello",
          categories: [],
        },
      ];
      mockRepository.findDueByUserAndDate.mockResolvedValue(mockProgress);
      mockVocabularyRepository.findByIds.mockResolvedValue(mockVocab);

      const result = await progressService.getDueWords("user1", "2025-01-15", 20);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("1");
    });

    it("should return empty array if no due words", async () => {
      mockRepository.findDueByUserAndDate.mockResolvedValue([]);
      mockVocabularyRepository.findByIds.mockResolvedValue([]);

      const result = await progressService.getDueWords("user1", "2025-01-15", 20);

      expect(result).toEqual([]);
    });

    it("should return raw progress data when vocabularyRepository is missing", async () => {
      const serviceWithoutVocab = new ProgressService(mockRepository, null, null);
      const mockProgress = [{ id: "p1", userId: "user1", wordId: "1", nextReview: "2025-01-15" }];
      mockRepository.findDueByUserAndDate.mockResolvedValue(mockProgress);

      const result = await serviceWithoutVocab.getDueWords("user1", "2025-01-15", 20);

      // Should return raw progress records without enrichment
      expect(result).toEqual(mockProgress);
    });

    it("should use default limit if not provided", async () => {
      mockRepository.findDueByUserAndDate.mockResolvedValue([]);
      mockVocabularyRepository.findByIds.mockResolvedValue([]);

      await progressService.getDueWords("user1", "2025-01-15");

      expect(mockRepository.findDueByUserAndDate).toHaveBeenCalledWith("user1", "2025-01-15", 20);
    });
  });

  describe("getLeechesByUser (Story 15.2 Phase 2)", () => {
    let mockVocabularyRepository;

    beforeEach(() => {
      mockVocabularyRepository = {
        findByIds: vi.fn(),
      };
      mockRepository.findLeechesByUser = vi.fn();
      progressService = new ProgressService(mockRepository, null, mockVocabularyRepository);
    });

    it("should return enriched leeches with vocabulary data", async () => {
      const mockLeeches = [
        {
          id: "p1",
          userId: "user1",
          wordId: "3",
          nextReview: "2025-01-16",
          lapseCount: 8,
          studyCount: 20,
          correctCount: 5,
        },
        {
          id: "p2",
          userId: "user1",
          wordId: "4",
          nextReview: "2025-01-17",
          lapseCount: 6,
          studyCount: 15,
          correctCount: 4,
        },
      ];
      const mockVocab = [
        {
          id: "3",
          simplified: "难",
          traditional: "難",
          pinyin: "nán",
          english: "difficult",
          categories: [{ category: { name: "Adjectives" } }],
        },
        {
          id: "4",
          simplified: "复杂",
          traditional: "複雜",
          pinyin: "fù zá",
          english: "complex",
          categories: [{ category: { name: "Adjectives" } }],
        },
      ];
      mockRepository.findLeechesByUser.mockResolvedValue(mockLeeches);
      mockVocabularyRepository.findByIds.mockResolvedValue(mockVocab);

      const result = await progressService.getLeechesByUser("user1", 5, 20);

      expect(mockRepository.findLeechesByUser).toHaveBeenCalledWith("user1", 5, 20);
      expect(mockVocabularyRepository.findByIds).toHaveBeenCalledWith(["3", "4"]);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: "3",
        simplified: "难",
        traditional: "難",
        pinyin: "nán",
        english: "difficult",
        lapseCount: 8,
        studyCount: 20,
        correctCount: 5,
        categories: ["Adjectives"],
      });
      expect(result[1]).toMatchObject({
        id: "4",
        simplified: "复杂",
        traditional: "複雜",
        pinyin: "fù zá",
        english: "complex",
        lapseCount: 6,
        studyCount: 15,
        correctCount: 4,
        categories: ["Adjectives"],
      });
    });

    it("should filter out leeches without vocabulary data", async () => {
      const mockLeeches = [
        { id: "p1", userId: "user1", wordId: "3", lapseCount: 8, studyCount: 20, correctCount: 5 },
        { id: "p2", userId: "user1", wordId: "4", lapseCount: 6, studyCount: 15, correctCount: 4 },
      ];
      const mockVocab = [
        {
          id: "3",
          simplified: "难",
          traditional: "難",
          pinyin: "nán",
          english: "difficult",
          categories: [],
        },
      ];
      mockRepository.findLeechesByUser.mockResolvedValue(mockLeeches);
      mockVocabularyRepository.findByIds.mockResolvedValue(mockVocab);

      const result = await progressService.getLeechesByUser("user1", 5, 20);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("3");
    });

    it("should return empty array if no leeches", async () => {
      mockRepository.findLeechesByUser.mockResolvedValue([]);
      mockVocabularyRepository.findByIds.mockResolvedValue([]);

      const result = await progressService.getLeechesByUser("user1", 5, 20);

      expect(result).toEqual([]);
    });

    it("should return raw progress data when vocabularyRepository is missing", async () => {
      const serviceWithoutVocab = new ProgressService(mockRepository, null, null);
      const mockLeeches = [{ id: "p1", userId: "user1", wordId: "3", lapseCount: 8 }];
      mockRepository.findLeechesByUser.mockResolvedValue(mockLeeches);

      const result = await serviceWithoutVocab.getLeechesByUser("user1", 5, 20);

      // Should return raw progress records without enrichment
      expect(result).toEqual(mockLeeches);
    });

    it("should use default parameters if not provided", async () => {
      mockRepository.findLeechesByUser.mockResolvedValue([]);
      mockVocabularyRepository.findByIds.mockResolvedValue([]);

      await progressService.getLeechesByUser("user1");

      expect(mockRepository.findLeechesByUser).toHaveBeenCalledWith("user1", 5, 20);
    });
  });
});
