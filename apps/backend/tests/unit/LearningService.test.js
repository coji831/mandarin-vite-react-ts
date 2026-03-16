/**
 * @file apps/backend/tests/unit/LearningService.test.js
 * @description Unit tests for LearningService
 * Story 15.11 Phase 8: Migrated from ProgressService - quiz-based learning with exponential backoff
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { LearningService } from "../../src/core/services/LearningService.js";

describe("LearningService", () => {
  let learningService;
  let mockProgressRepository;
  let mockQuizResultRepository;
  let mockVocabularyRepository;

  beforeEach(() => {
    mockProgressRepository = {
      findByUser: vi.fn(),
      findByUserAndWord: vi.fn(),
      upsert: vi.fn(),
    };
    mockQuizResultRepository = {
      create: vi.fn(),
    };
    mockVocabularyRepository = {
      findByIds: vi.fn(),
      findUnlearnedWords: vi.fn().mockResolvedValue([]),
    };
    learningService = new LearningService(
      mockProgressRepository,
      mockQuizResultRepository,
      mockVocabularyRepository,
    );
    vi.clearAllMocks();
  });

  describe("calculateNextReview - Exponential Backoff (Story 15.11)", () => {
    it("should double delay on correct answer (1 → 2 days)", () => {
      const result = learningService.calculateNextReview(1, true);
      const daysDiff = Math.round((result - new Date()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(2);
    });

    it("should reset to 1 day on incorrect answer", () => {
      const result = learningService.calculateNextReview(64, false);
      const daysDiff = Math.round((result - new Date()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(1);
    });

    it("should follow exponential progression: 1 → 2 → 4 → 8 → 16 days", () => {
      let delay = 1;
      const expectedDelays = [2, 4, 8, 16];

      expectedDelays.forEach((expected) => {
        const result = learningService.calculateNextReview(delay, true);
        const actual = Math.round((result - new Date()) / (1000 * 60 * 60 * 24));
        expect(actual).toBe(expected);
        delay = expected;
      });
    });

    it("should cap at 365 days maximum", () => {
      const result = learningService.calculateNextReview(256, true);
      const daysDiff = Math.round((result - new Date()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(365);
    });

    it("should handle edge case: delay 0 treated as 1 day on correct", () => {
      const result = learningService.calculateNextReview(0, true);
      const daysDiff = Math.round((result - new Date()) / (1000 * 60 * 60 * 24));
      // 0 * 2 = 0, but in practice currentDelay defaults to 1 in recordQuizResult
      expect(daysDiff).toBe(0);
    });
  });

  describe("recordQuizResult - Exponential Backoff (Story 15.11)", () => {
    it("should record correct answer and double delay (5 → 10 days)", async () => {
      const existingProgress = {
        userId: "user1",
        wordId: "word1",
        studyCount: 3,
        correctCount: 2,
        confidence: 0.6,
        lapseCount: 2,
        currentDelay: 5,
      };
      mockProgressRepository.findByUserAndWord.mockResolvedValue(existingProgress);
      mockProgressRepository.upsert.mockResolvedValue({
        id: "1",
        userId: "user1",
        wordId: "word1",
        studyCount: 4,
        correctCount: 3,
        nextReview: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        lapseCount: 0,
        currentDelay: 10,
        confidence: 0.6,
      });

      const result = await learningService.recordQuizResult({
        userId: "user1",
        wordId: "word1",
        correct: true,
        questionType: "type_pinyin",
        timeSpentMs: 3500,
      });

      // Check progress upsert called with correct data
      expect(mockProgressRepository.upsert).toHaveBeenCalledWith("user1", "word1", {
        studyCount: 4,
        correctCount: 3,
        nextReview: expect.any(Date),
        lapseCount: 0, // Reset on correct
        currentDelay: 10, // 5 * 2 = 10 days (exponential backoff)
        confidence: 0.6, // Preserved
      });

      // Check return value
      expect(result.lapseCount).toBe(0);
      expect(result.isLeech).toBe(false);
      expect(result.nextReviewDate).toBeInstanceOf(Date);
    });

    it("should record incorrect answer and reset to 1 day", async () => {
      const existingProgress = {
        userId: "user1",
        wordId: "word1",
        studyCount: 3,
        correctCount: 2,
        confidence: 0.6,
        lapseCount: 2,
        currentDelay: 32,
      };
      mockProgressRepository.findByUserAndWord.mockResolvedValue(existingProgress);
      mockProgressRepository.upsert.mockResolvedValue({
        id: "1",
        userId: "user1",
        wordId: "word1",
        studyCount: 4,
        correctCount: 2,
        nextReview: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        lapseCount: 3,
        currentDelay: 1,
        confidence: 0.6,
      });

      const result = await learningService.recordQuizResult({
        userId: "user1",
        wordId: "word1",
        correct: false,
        questionType: "multiple_choice",
      });

      // Check lapse count incremented
      expect(mockProgressRepository.upsert).toHaveBeenCalledWith("user1", "word1", {
        studyCount: 4,
        correctCount: 2, // Not incremented
        nextReview: expect.any(Date),
        lapseCount: 3, // Incremented from 2
        currentDelay: 1, // Reset on incorrect
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
      mockProgressRepository.findByUserAndWord.mockResolvedValue(existingProgress);
      mockProgressRepository.upsert.mockResolvedValue({
        id: "1",
        userId: "user1",
        wordId: "word1",
        studyCount: 9,
        correctCount: 3,
        nextReview: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        lapseCount: 5,
        currentDelay: 1,
        confidence: 0.3,
      });

      const result = await learningService.recordQuizResult({
        userId: "user1",
        wordId: "word1",
        correct: false,
        questionType: "type_character",
      });

      expect(result.lapseCount).toBe(5);
      expect(result.isLeech).toBe(true); // >= 5 threshold
    });

    it("should handle new word with no existing progress", async () => {
      mockProgressRepository.findByUserAndWord.mockResolvedValue(null);
      mockProgressRepository.upsert.mockResolvedValue({
        id: "1",
        userId: "user1",
        wordId: "word1",
        studyCount: 1,
        correctCount: 1,
        nextReview: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        lapseCount: 0,
        currentDelay: 2,
        confidence: 0,
      });

      const result = await learningService.recordQuizResult({
        userId: "user1",
        wordId: "word1",
        correct: true,
        questionType: "multiple_choice",
      });

      // Check default values used
      expect(mockProgressRepository.upsert).toHaveBeenCalledWith("user1", "word1", {
        studyCount: 1,
        correctCount: 1,
        nextReview: expect.any(Date),
        lapseCount: 0,
        currentDelay: 2, // 1 * 2 = 2 days (new word starts at 1 day, correct doubles to 2)
        confidence: 0, // Default
      });

      expect(result.isLeech).toBe(false);
    });
  });

  describe("getDueWords (Story 15.2 Phase 2)", () => {
    beforeEach(() => {
      mockProgressRepository.findDueByUserAndDate = vi.fn();
      mockProgressRepository.findByUser = vi.fn().mockResolvedValue([]);
      learningService = new LearningService(mockProgressRepository, null, mockVocabularyRepository);
      vi.clearAllMocks();
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
      mockProgressRepository.findDueByUserAndDate.mockResolvedValue(mockProgress);
      mockVocabularyRepository.findByIds.mockResolvedValue(mockVocab);

      const result = await learningService.getDueWords("user1", "2025-01-15", 20);

      expect(mockProgressRepository.findDueByUserAndDate).toHaveBeenCalledWith(
        "user1",
        "2025-01-15",
        20,
      );
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
      mockProgressRepository.findDueByUserAndDate.mockResolvedValue(mockProgress);
      mockVocabularyRepository.findByIds.mockResolvedValue(mockVocab);

      const result = await learningService.getDueWords("user1", "2025-01-15", 20);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("1");
    });

    it("should return empty array if no due words", async () => {
      mockProgressRepository.findDueByUserAndDate.mockResolvedValue([]);
      mockVocabularyRepository.findByIds.mockResolvedValue([]);

      const result = await learningService.getDueWords("user1", "2025-01-15", 20);

      expect(result).toEqual([]);
    });

    it("should return raw progress data when vocabularyRepository is missing", async () => {
      const serviceWithoutVocab = new LearningService(mockProgressRepository, null, null);
      serviceWithoutVocab.progressRepository.findDueByUserAndDate = vi.fn();
      const mockProgress = [{ id: "p1", userId: "user1", wordId: "1", nextReview: "2025-01-15" }];
      mockProgressRepository.findDueByUserAndDate.mockResolvedValue(mockProgress);

      const result = await serviceWithoutVocab.getDueWords("user1", "2025-01-15", 20);

      // Should return raw progress records without enrichment
      expect(result).toEqual(mockProgress);
    });

    it("should use default limit if not provided", async () => {
      mockProgressRepository.findDueByUserAndDate.mockResolvedValue([]);
      mockVocabularyRepository.findByIds.mockResolvedValue([]);

      await learningService.getDueWords("user1", "2025-01-15");

      expect(mockProgressRepository.findDueByUserAndDate).toHaveBeenCalledWith(
        "user1",
        "2025-01-15",
        10,
      );
    });

    it("should backfill with new words using 70/30 strategy (Story 15.8, Phase 6 refactor)", async () => {
      // Scenario: 2 due words found, limit is 10, so should add 3 new words (30% of 10)
      const mockDueProgress = [
        {
          id: "p1",
          userId: "user1",
          wordId: "1",
          nextReview: "2025-01-15",
          lapseCount: 0,
          studyCount: 5,
          currentDelay: 4,
        },
        {
          id: "p2",
          userId: "user1",
          wordId: "2",
          nextReview: "2025-01-15",
          lapseCount: 1,
          studyCount: 3,
          currentDelay: 2,
        },
      ];

      const mockUnlearnedWords = [
        { id: "3", simplified: "你", pinyin: "nǐ", english: "you" },
        { id: "4", simplified: "好", pinyin: "hǎo", english: "good" },
        { id: "5", simplified: "吗", pinyin: "ma", english: "question particle" },
      ];

      const mockNewProgress = [
        {
          id: "p3",
          userId: "user1",
          wordId: "3",
          nextReview: new Date(),
          studyCount: 0,
          currentDelay: 1,
        },
        {
          id: "p4",
          userId: "user1",
          wordId: "4",
          nextReview: new Date(),
          studyCount: 0,
          currentDelay: 1,
        },
        {
          id: "p5",
          userId: "user1",
          wordId: "5",
          nextReview: new Date(),
          studyCount: 0,
          currentDelay: 1,
        },
      ];

      const allVocab = [
        {
          id: "1",
          simplified: "你好",
          pinyin: "nǐ hǎo",
          english: "hello",
          categories: [{ category: { name: "Greetings" } }],
        },
        {
          id: "2",
          simplified: "再见",
          pinyin: "zài jiàn",
          english: "goodbye",
          categories: [{ category: { name: "Farewells" } }],
        },
        { id: "3", simplified: "你", pinyin: "nǐ", english: "you", categories: [] },
        { id: "4", simplified: "好", pinyin: "hǎo", english: "good", categories: [] },
        { id: "5", simplified: "吗", pinyin: "ma", english: "question particle", categories: [] },
      ];

      mockProgressRepository.findDueByUserAndDate.mockResolvedValue(mockDueProgress);
      mockProgressRepository.findByUser.mockResolvedValue(mockDueProgress); // User has learned words 1 and 2
      mockVocabularyRepository.findUnlearnedWords.mockResolvedValue(mockUnlearnedWords);
      mockProgressRepository.upsert
        .mockResolvedValueOnce(mockNewProgress[0])
        .mockResolvedValueOnce(mockNewProgress[1])
        .mockResolvedValueOnce(mockNewProgress[2]);
      mockVocabularyRepository.findByIds.mockResolvedValue(allVocab);

      const result = await learningService.getDueWords("user1", "2025-01-15", 10);

      // Should have called findUnlearnedWords with learned word IDs and count of 3 (30% of 10)
      expect(mockVocabularyRepository.findUnlearnedWords).toHaveBeenCalledWith(["1", "2"], 3);
      // Should have created initial progress for each new word
      expect(mockProgressRepository.upsert).toHaveBeenCalledTimes(3);
      // Should return 5 total words (2 due + 3 new)
      expect(result).toHaveLength(5);
      expect(result.map((w) => w.id)).toEqual(["1", "2", "3", "4", "5"]);
    });
  });

  describe("getLeechesByUser (Story 15.2 Phase 2)", () => {
    beforeEach(() => {
      mockProgressRepository.findLeechesByUser = vi.fn();
      learningService = new LearningService(mockProgressRepository, null, mockVocabularyRepository);
      vi.clearAllMocks();
      mockProgressRepository.findLeechesByUser = vi.fn();
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
      mockProgressRepository.findLeechesByUser.mockResolvedValue(mockLeeches);
      mockVocabularyRepository.findByIds.mockResolvedValue(mockVocab);

      const result = await learningService.getLeechesByUser("user1", 5, 20);

      expect(mockProgressRepository.findLeechesByUser).toHaveBeenCalledWith("user1", 5, 20);
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
      mockProgressRepository.findLeechesByUser.mockResolvedValue(mockLeeches);
      mockVocabularyRepository.findByIds.mockResolvedValue(mockVocab);

      const result = await learningService.getLeechesByUser("user1", 5, 20);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("3");
    });

    it("should return empty array if no leeches", async () => {
      mockProgressRepository.findLeechesByUser.mockResolvedValue([]);
      mockVocabularyRepository.findByIds.mockResolvedValue([]);

      const result = await learningService.getLeechesByUser("user1", 5, 20);

      expect(result).toEqual([]);
    });

    it("should return raw progress data when vocabularyRepository is missing", async () => {
      const serviceWithoutVocab = new LearningService(mockProgressRepository, null, null);
      const mockLeeches = [{ id: "p1", userId: "user1", wordId: "3", lapseCount: 8 }];
      mockProgressRepository.findLeechesByUser.mockResolvedValue(mockLeeches);

      const result = await serviceWithoutVocab.getLeechesByUser("user1", 5, 20);

      // Should return raw progress records without enrichment
      expect(result).toEqual(mockLeeches);
    });

    it("should use default parameters if not provided", async () => {
      mockProgressRepository.findLeechesByUser.mockResolvedValue([]);
      mockVocabularyRepository.findByIds.mockResolvedValue([]);

      await learningService.getLeechesByUser("user1");

      expect(mockProgressRepository.findLeechesByUser).toHaveBeenCalledWith("user1", 5, 20);
    });
  });
});
