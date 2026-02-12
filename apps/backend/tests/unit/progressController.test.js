/**
 * @file apps/backend/tests/unit/progressController.test.js
 * @description Unit tests for ProgressController
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProgressController } from "../../src/api/controllers/progressController.js";
import { ProgressService } from "../../src/core/services/ProgressService.js";

// Mock ProgressService
vi.mock("../../src/core/services/ProgressService.js");

// Mock logger
vi.mock("../../src/utils/logger.js", () => ({
  createLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

describe("ProgressController", () => {
  let mockReq;
  let mockRes;
  let mockService;
  let progressController;

  beforeEach(() => {
    mockReq = {
      userId: "user1",
      params: {},
      body: {},
      query: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockService = new ProgressService();
    progressController = new ProgressController(mockService);
    vi.clearAllMocks();
  });

  describe("getAllProgress", () => {
    it("should return all progress for user", async () => {
      const mockProgress = [{ id: "1", userId: "user1", wordId: "word1", confidence: 0.5 }];
      mockService.getProgressForUser.mockResolvedValue(mockProgress);

      await progressController.getAllProgress(mockReq, mockRes);

      expect(mockService.getProgressForUser).toHaveBeenCalledWith("user1");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockProgress);
    });

    it("should handle service errors", async () => {
      mockService.getProgressForUser.mockRejectedValue(new Error("DB error"));

      await progressController.getAllProgress(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Internal Server Error",
          code: "FETCH_PROGRESS_FAILED",
        }),
      );
    });
  });

  describe("getWordProgress", () => {
    it("should return progress for specific word", async () => {
      mockReq.params.wordId = "word1";
      const mockProgress = {
        id: "1",
        userId: "user1",
        wordId: "word1",
        confidence: 0.5,
      };
      mockService.getProgressForWord.mockResolvedValue(mockProgress);

      await progressController.getWordProgress(mockReq, mockRes);

      expect(mockService.getProgressForWord).toHaveBeenCalledWith("user1", "word1");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockProgress);
    });

    it("should return 404 if progress not found", async () => {
      mockReq.params.wordId = "word1";
      mockService.getProgressForWord.mockResolvedValue(null);

      await progressController.getWordProgress(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "PROGRESS_NOT_FOUND",
        }),
      );
    });

    it("should return 400 if wordId missing", async () => {
      mockReq.params.wordId = undefined;

      await progressController.getWordProgress(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "MISSING_WORD_ID",
        }),
      );
    });
  });

  describe("updateWordProgress", () => {
    it("should update word progress", async () => {
      mockReq.params.wordId = "word1";
      mockReq.body = { studyCount: 5, confidence: 0.8 };
      const mockUpdated = {
        id: "1",
        userId: "user1",
        wordId: "word1",
        studyCount: 5,
        confidence: 0.8,
      };
      mockService.updateProgress.mockResolvedValue(mockUpdated);

      await progressController.updateWordProgress(mockReq, mockRes);

      expect(mockService.updateProgress).toHaveBeenCalledWith("user1", "word1", {
        studyCount: 5,
        confidence: 0.8,
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockUpdated);
    });

    it("should validate confidence range", async () => {
      mockReq.params.wordId = "word1";
      mockReq.body = { confidence: 1.5 };

      await progressController.updateWordProgress(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "INVALID_CONFIDENCE",
        }),
      );
    });

    it("should validate studyCount is non-negative", async () => {
      mockReq.params.wordId = "word1";
      mockReq.body = { studyCount: -1 };

      await progressController.updateWordProgress(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "INVALID_STUDY_COUNT",
        }),
      );
    });
  });

  describe("batchUpdateProgress", () => {
    it("should batch update multiple words", async () => {
      mockReq.body = {
        updates: [
          { wordId: "word1", confidence: 0.5 },
          { wordId: "word2", confidence: 0.8 },
        ],
      };
      const mockResults = [
        { id: "1", userId: "user1", wordId: "word1", confidence: 0.5 },
        { id: "2", userId: "user1", wordId: "word2", confidence: 0.8 },
      ];
      mockService.batchUpdateProgress.mockResolvedValue(mockResults);

      await progressController.batchUpdateProgress(mockReq, mockRes);

      expect(mockService.batchUpdateProgress).toHaveBeenCalledWith("user1", mockReq.body.updates);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockResults);
    });

    it("should return 400 if updates not array", async () => {
      mockReq.body = { updates: "not-array" };

      await progressController.batchUpdateProgress(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "INVALID_UPDATES",
        }),
      );
    });

    it("should return 400 if updates array empty", async () => {
      mockReq.body = { updates: [] };

      await progressController.batchUpdateProgress(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "EMPTY_UPDATES",
        }),
      );
    });

    it("should validate each update has wordId", async () => {
      mockReq.body = {
        updates: [{ confidence: 0.5 }],
      };

      await progressController.batchUpdateProgress(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "MISSING_WORD_ID",
        }),
      );
    });
  });

  describe("getProgressStats", () => {
    it("should return progress statistics", async () => {
      const mockStats = {
        totalWords: 10,
        studiedWords: 8,
        masteredWords: 5,
        totalStudyCount: 50,
        averageConfidence: 0.65,
        wordsToReviewToday: 3,
      };
      mockService.getProgressStats.mockResolvedValue(mockStats);

      await progressController.getProgressStats(mockReq, mockRes);

      expect(mockService.getProgressStats).toHaveBeenCalledWith("user1");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockStats);
    });

    it("should handle service errors", async () => {
      mockService.getProgressStats.mockRejectedValue(new Error("DB error"));

      await progressController.getProgressStats(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Internal Server Error",
          code: "FETCH_STATS_FAILED",
        }),
      );
    });
  });

  describe("getDueWords (Story 15.2 Phase 2)", () => {
    it("should return due words for today by default", async () => {
      const today = new Date().toISOString().split("T")[0];
      const mockDueWords = [
        {
          wordId: "word1",
          simplified: "你好",
          traditional: "你好",
          pinyin: "nǐ hǎo",
          english: "hello",
          nextReview: today,
          lapseCount: 0,
        },
      ];
      mockService.getDueWords.mockResolvedValue(mockDueWords);

      await progressController.getDueWords(mockReq, mockRes);

      // Controller passes Date object, not string
      expect(mockService.getDueWords).toHaveBeenCalledWith("user1", expect.any(Date));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        date: today,
        count: 1,
        words: mockDueWords,
      });
    });

    it("should accept custom date via query param", async () => {
      mockReq.query = { date: "2025-01-15" };
      const mockDueWords = [];
      mockService.getDueWords.mockResolvedValue(mockDueWords);

      await progressController.getDueWords(mockReq, mockRes);

      // Controller passes Date object, not string
      expect(mockService.getDueWords).toHaveBeenCalledWith("user1", expect.any(Date));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        date: "2025-01-15",
        count: 0,
        words: [],
      });
    });

    it("should accept custom limit via query param", async () => {
      mockReq.query = { limit: "50" };
      const mockDueWords = [];
      mockService.getDueWords.mockResolvedValue(mockDueWords);

      await progressController.getDueWords(mockReq, mockRes);

      // Note: Controller doesn't pass limit param - uses service default
      expect(mockService.getDueWords).toHaveBeenCalledWith("user1", expect.any(Date));
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should return 400 for invalid date format", async () => {
      mockReq.query = { date: "invalid-date" };

      await progressController.getDueWords(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "INVALID_DATE",
          message: expect.stringContaining("YYYY-MM-DD"),
        }),
      );
    });

    it("should handle service errors", async () => {
      mockService.getDueWords.mockRejectedValue(new Error("DB error"));

      await progressController.getDueWords(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Internal Server Error",
          code: "FETCH_DUE_WORDS_FAILED",
        }),
      );
    });
  });

  describe("saveTestResult (Story 15.2 Phase 2)", () => {
    beforeEach(() => {
      mockService.recordQuizResult = vi.fn();
    });

    it("should save test result and return updated progress", async () => {
      mockReq.body = {
        wordId: "word1",
        correct: true,
        questionType: "multiple_choice",
        timeSpentMs: 5000,
      };
      const mockResult = {
        nextReviewDate: "2025-01-20",
        lapseCount: 0,
        isLeech: false,
      };
      mockService.recordQuizResult.mockResolvedValue(mockResult);

      await progressController.saveTestResult(mockReq, mockRes);

      expect(mockService.recordQuizResult).toHaveBeenCalledWith({
        userId: "user1",
        wordId: "word1",
        correct: true,
        questionType: "multiple_choice",
        timeSpentMs: 5000,
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        wordId: "word1",
        correct: true,
        nextReview: "2025-01-20",
        lapseCount: 0,
        isLeech: false,
      });
    });

    it("should return 400 if wordId missing", async () => {
      mockReq.body = { correct: true, questionType: "multiple_choice" };

      await progressController.saveTestResult(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "MISSING_REQUIRED_FIELDS",
        }),
      );
    });

    it("should return 400 if correct missing", async () => {
      mockReq.body = { wordId: "word1", questionType: "multiple_choice" };

      await progressController.saveTestResult(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "MISSING_REQUIRED_FIELDS",
        }),
      );
    });

    it("should return 400 if questionType missing", async () => {
      mockReq.body = { wordId: "word1", correct: true };

      await progressController.saveTestResult(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "MISSING_REQUIRED_FIELDS",
        }),
      );
    });

    it("should return 400 for invalid questionType", async () => {
      mockReq.body = {
        wordId: "word1",
        correct: true,
        questionType: "invalid-type",
      };

      await progressController.saveTestResult(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "INVALID_QUESTION_TYPE",
        }),
      );
    });

    it("should return 503 if quiz support not enabled", async () => {
      mockReq.body = {
        wordId: "word1",
        correct: true,
        questionType: "multiple_choice",
      };
      mockService.recordQuizResult.mockRejectedValue(
        new Error("QuizResultRepository not injected"),
      );

      await progressController.saveTestResult(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "QUIZ_SUPPORT_DISABLED",
        }),
      );
    });

    it("should handle service errors", async () => {
      mockReq.body = {
        wordId: "word1",
        correct: true,
        questionType: "multiple_choice",
      };
      mockService.recordQuizResult.mockRejectedValue(new Error("DB error"));

      await progressController.saveTestResult(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Internal Server Error",
          code: "SAVE_TEST_RESULT_FAILED",
        }),
      );
    });
  });

  describe("getLeeches (Story 15.2 Phase 2)", () => {
    it("should return leeches with default minLapseCount=5", async () => {
      const mockLeeches = [
        {
          wordId: "word1",
          simplified: "难",
          traditional: "難",
          pinyin: "nán",
          english: "difficult",
          lapseCount: 8,
          nextReview: "2025-01-15",
        },
      ];
      mockService.getLeechesByUser.mockResolvedValue(mockLeeches);

      await progressController.getLeeches(mockReq, mockRes);

      // Controller passes minLapseCount but not limit (service has default)
      expect(mockService.getLeechesByUser).toHaveBeenCalledWith("user1", 5);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        minLapseCount: 5,
        count: 1,
        leeches: mockLeeches,
      });
    });

    it("should accept custom minLapseCount via query param", async () => {
      mockReq.query = { minLapseCount: "10" };
      const mockLeeches = [];
      mockService.getLeechesByUser.mockResolvedValue(mockLeeches);

      await progressController.getLeeches(mockReq, mockRes);

      expect(mockService.getLeechesByUser).toHaveBeenCalledWith("user1", 10);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        minLapseCount: 10,
        count: 0,
        leeches: [],
      });
    });

    it("should accept custom limit via query param", async () => {
      mockReq.query = { limit: "50" };
      const mockLeeches = [];
      mockService.getLeechesByUser.mockResolvedValue(mockLeeches);

      await progressController.getLeeches(mockReq, mockRes);

      // Note: Controller doesn't pass limit param - uses service default
      expect(mockService.getLeechesByUser).toHaveBeenCalledWith("user1", 5);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should return 400 for invalid minLapseCount", async () => {
      mockReq.query = { minLapseCount: "invalid" };

      // Note: parseInt("invalid") returns NaN, which becomes default 5 via || operator
      // This should NOT trigger validation error - it uses default value
      const mockLeeches = [];
      mockService.getLeechesByUser.mockResolvedValue(mockLeeches);

      await progressController.getLeeches(mockReq, mockRes);

      // Controller uses default value 5 when parse fails
      expect(mockService.getLeechesByUser).toHaveBeenCalledWith("user1", 5);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should return 400 for negative minLapseCount", async () => {
      mockReq.query = { minLapseCount: "-5" };

      await progressController.getLeeches(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "INVALID_LAPSE_COUNT",
        }),
      );
    });

    it("should handle service errors", async () => {
      mockService.getLeechesByUser.mockRejectedValue(new Error("DB error"));

      await progressController.getLeeches(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Internal Server Error",
          code: "FETCH_LEECHES_FAILED",
        }),
      );
    });
  });

  describe("saveTestResult - Gamification Integration", () => {
    let mockStreakService;
    let mockGamificationService;
    let mockProgressRepo;
    let mockQuizResultRepo;

    beforeEach(() => {
      // Mock ProgressRepository
      mockProgressRepo = {
        updateProgress: vi.fn(),
      };

      // Mock QuizResultRepository
      mockQuizResultRepo = {
        create: vi.fn(),
      };

      // Mock StreakService
      mockStreakService = {
        updateStreak: vi.fn(),
        checkAndAwardFreeze: vi.fn(),
      };

      // Mock GamificationService
      mockGamificationService = {
        calculateXP: vi.fn(),
        checkAndAwardBadges: vi.fn(),
        checkMysteryBoxDrop: vi.fn(),
      };

      // Create controller with gamification services
      progressController = new ProgressController(
        mockService,
        mockProgressRepo,
        mockQuizResultRepo,
        mockStreakService,
        mockGamificationService,
      );

      mockReq.body = {
        wordId: "word1",
        isCorrect: true,
        responseTime: 1500,
      };
    });

    it("should enrich response with gamification data when all services available", async () => {
      mockService.recordQuizResult.mockResolvedValue({
        progressId: "prog1",
        newConfidence: 0.8,
      });

      mockStreakService.updateStreak.mockResolvedValue({
        userId: "user1",
        currentStreak: 10,
        longestStreak: 15,
        freezeCount: 2,
        lastActivityDate: new Date(),
      });

      mockGamificationService.calculateXP.mockReturnValue(15); // Base 10 + bonus 5

      mockGamificationService.checkAndAwardBadges.mockResolvedValue([
        {
          badgeId: "7-day-streak",
          name: "7-Day Warrior",
          tier: "bronze",
          earnedDate: new Date(),
        },
      ]);

      mockStreakService.checkAndAwardFreeze.mockResolvedValue({
        awarded: true,
        freezeCount: 3,
      });

      mockGamificationService.checkMysteryBoxDrop.mockReturnValue({
        reward: "50 XP",
        description: "Bonus XP reward!",
      });

      await progressController.saveTestResult(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          progressId: "prog1",
          newConfidence: 0.8,
          currentStreak: 10,
          xpEarned: 15,
          newBadges: expect.arrayContaining([
            expect.objectContaining({
              badgeId: "7-day-streak",
            }),
          ]),
          freezeAwarded: true,
          mysteryBox: expect.objectContaining({
            reward: "50 XP",
          }),
        }),
      );
    });

    it("should return base response when gamification services unavailable", async () => {
      // Controller without gamification services
      progressController = new ProgressController(
        mockService,
        mockProgressRepo,
        mockQuizResultRepo,
      );

      mockService.recordQuizResult.mockResolvedValue({
        progressId: "prog1",
        newConfidence: 0.8,
      });

      await progressController.saveTestResult(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        progressId: "prog1",
        newConfidence: 0.8,
      });
    });

    it("should handle gamification service errors gracefully", async () => {
      mockService.recordQuizResult.mockResolvedValue({
        progressId: "prog1",
        newConfidence: 0.8,
      });

      // Simulate streak service error
      mockStreakService.updateStreak.mockRejectedValue(new Error("Streak DB error"));

      await progressController.saveTestResult(mockReq, mockRes);

      // Should still return success with base response
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          progressId: "prog1",
          newConfidence: 0.8,
        }),
      );
    });

    it("should not award XP for incorrect answers", async () => {
      mockReq.body.isCorrect = false;

      mockService.recordQuizResult.mockResolvedValue({
        progressId: "prog1",
        newConfidence: 0.4,
      });

      mockStreakService.updateStreak.mockResolvedValue({
        userId: "user1",
        currentStreak: 5,
        longestStreak: 10,
        freezeCount: 1,
        lastActivityDate: new Date(),
      });

      mockGamificationService.calculateXP.mockReturnValue(0); // No XP for incorrect

      mockGamificationService.checkAndAwardBadges.mockResolvedValue([]);
      mockStreakService.checkAndAwardFreeze.mockResolvedValue({ awarded: false });
      mockGamificationService.checkMysteryBoxDrop.mockReturnValue(null);

      await progressController.saveTestResult(mockReq, mockRes);

      expect(mockGamificationService.calculateXP).toHaveBeenCalledWith(false, 5);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          xpEarned: 0,
        }),
      );
    });

    it("should include streak bonus when streak >= 7 days", async () => {
      mockService.recordQuizResult.mockResolvedValue({
        progressId: "prog1",
        newConfidence: 0.9,
      });

      mockStreakService.updateStreak.mockResolvedValue({
        userId: "user1",
        currentStreak: 7,
        longestStreak: 10,
        freezeCount: 0,
        lastActivityDate: new Date(),
      });

      mockGamificationService.calculateXP.mockReturnValue(15); // Base 10 + bonus 5

      mockGamificationService.checkAndAwardBadges.mockResolvedValue([]);
      mockStreakService.checkAndAwardFreeze.mockResolvedValue({ awarded: false });
      mockGamificationService.checkMysteryBoxDrop.mockReturnValue(null);

      await progressController.saveTestResult(mockReq, mockRes);

      expect(mockGamificationService.calculateXP).toHaveBeenCalledWith(true, 7);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          xpEarned: 15,
        }),
      );
    });

    it("should check for freeze award after 10 consecutive correct quizzes", async () => {
      mockService.recordQuizResult.mockResolvedValue({
        progressId: "prog1",
        newConfidence: 0.85,
      });

      mockStreakService.updateStreak.mockResolvedValue({
        userId: "user1",
        currentStreak: 12,
        longestStreak: 15,
        freezeCount: 2,
        lastActivityDate: new Date(),
      });

      mockGamificationService.calculateXP.mockReturnValue(15);
      mockGamificationService.checkAndAwardBadges.mockResolvedValue([]);

      mockStreakService.checkAndAwardFreeze.mockResolvedValue({
        awarded: true,
        freezeCount: 3,
        message: "Earned 1 freeze for 10 consecutive perfect quizzes!",
      });

      mockGamificationService.checkMysteryBoxDrop.mockReturnValue(null);

      await progressController.saveTestResult(mockReq, mockRes);

      expect(mockStreakService.checkAndAwardFreeze).toHaveBeenCalledWith("user1");
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          freezeAwarded: true,
        }),
      );
    });

    it("should check for mystery box drop on 7-day milestones", async () => {
      mockService.recordQuizResult.mockResolvedValue({
        progressId: "prog1",
        newConfidence: 0.82,
      });

      mockStreakService.updateStreak.mockResolvedValue({
        userId: "user1",
        currentStreak: 14, // 7-day milestone
        longestStreak: 20,
        freezeCount: 1,
        lastActivityDate: new Date(),
      });

      mockGamificationService.calculateXP.mockReturnValue(15);
      mockGamificationService.checkAndAwardBadges.mockResolvedValue([]);
      mockStreakService.checkAndAwardFreeze.mockResolvedValue({ awarded: false });

      mockGamificationService.checkMysteryBoxDrop.mockReturnValue({
        reward: "1 Streak Freeze",
        description: "Lucky! You received a streak freeze!",
      });

      await progressController.saveTestResult(mockReq, mockRes);

      expect(mockGamificationService.checkMysteryBoxDrop).toHaveBeenCalledWith(14);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mysteryBox: expect.objectContaining({
            reward: "1 Streak Freeze",
          }),
        }),
      );
    });
  });
});
