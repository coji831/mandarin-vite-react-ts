/**
 * @file apps/backend/tests/unit/QuizSessionService.test.js
 * @description Unit tests for QuizSessionService
 * Story 15.11 Phase 8: Backend-centric quiz session architecture
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { QuizSessionService } from "../../src/core/services/QuizSessionService.js";

describe("QuizSessionService", () => {
  let quizSessionService;
  let mockSessionRepository;
  let mockLearningService;
  let mockGamificationService;
  let mockVocabularyRepository;
  let mockAIFeedbackService;
  let mockStreakService;
  let mockSummaryRepository;

  beforeEach(() => {
    // Create mock repositories and services
    mockSessionRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByIdAndUserId: vi.fn(), // Added for composite lookup
      findActiveByUser: vi.fn(),
      findMostRecentCompleted: vi.fn(),
      update: vi.fn(),
      expireOldSessions: vi.fn(),
      deleteOldSessions: vi.fn(),
    };

    mockLearningService = {
      getDueWords: vi.fn(),
      recordQuizResult: vi.fn(),
    };

    mockGamificationService = {
      calculateXP: vi.fn(),
      checkAndAwardBadges: vi.fn(),
      checkMysteryBoxDrop: vi.fn(),
    };

    mockVocabularyRepository = {
      findByIds: vi.fn(),
    };

    mockAIFeedbackService = {
      generateFeedback: vi.fn(),
    };

    mockStreakService = {
      getStreak: vi.fn(),
      updateStreak: vi.fn(),
      checkAndAwardFreeze: vi.fn(),
    };

    mockSummaryRepository = {
      create: vi.fn(),
      findBySessionId: vi.fn(),
      findBySessionIdAndUserId: vi.fn(),
      deleteExpired: vi.fn(),
    };

    quizSessionService = new QuizSessionService(
      mockSessionRepository,
      mockLearningService,
      mockGamificationService,
      mockVocabularyRepository,
      mockAIFeedbackService, // 5th parameter - AI feedback service
      mockStreakService, // 6th parameter - streak service
      mockSummaryRepository, // 7th parameter - summary persistence (Flow 5)
    );

    vi.clearAllMocks();
  });

  // ============================================================================
  // createSession Tests
  // ============================================================================

  describe("createSession", () => {
    it("should create a new quiz session with due words", async () => {
      const mockDueWords = [
        {
          id: "word1",
          simplified: "你好",
          traditional: "你好",
          pinyin: "nǐ hǎo",
          english: "hello",
        },
        {
          id: "word2",
          simplified: "谢谢",
          traditional: "謝謝",
          pinyin: "xiè xiè",
          english: "thank you",
        },
      ];

      mockSessionRepository.findMostRecentCompleted.mockResolvedValue(null);
      mockSessionRepository.findActiveByUser.mockResolvedValue(null);
      mockLearningService.getDueWords.mockResolvedValue(mockDueWords);
      mockSessionRepository.create.mockResolvedValue({
        id: "session1",
        userId: "user1",
        questions: [],
        answers: [],
        currentIndex: 0,
        status: "ACTIVE",
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
      });

      const result = await quizSessionService.createSession("user1");

      expect(mockSessionRepository.findMostRecentCompleted).toHaveBeenCalledWith("user1");
      expect(mockSessionRepository.findActiveByUser).toHaveBeenCalledWith("user1");
      expect(mockLearningService.getDueWords).toHaveBeenCalledWith("user1", expect.any(Date), 10);
      expect(mockSessionRepository.create).toHaveBeenCalled();
      expect(result).toHaveProperty("sessionId");
      expect(result).toHaveProperty("questions");
      expect(result).toHaveProperty("expiresAt");
      expect(result.isResume).toBe(false);
    });

    it("should return existing completed session if not expired (daily quiz limit)", async () => {
      const mockCompletedSession = {
        id: "completed-session-1",
        userId: "user1",
        status: "COMPLETE",
        completedAt: new Date("2026-03-08T10:00:00Z"),
        expiresAt: new Date(Date.now() + 10 * 60 * 60 * 1000), // 10 hours from now (not expired)
        questions: [
          {
            id: "word1_multiple_choice",
            wordId: "word1",
            questionType: "multiple_choice",
            word: { id: "word1", simplified: "你好", pinyin: "nǐ hǎo", english: "hello" },
            correctAnswer: "hello",
          },
        ],
        answers: [
          {
            questionId: "word1_multiple_choice",
            wordId: "word1",
            correct: true,
            userAnswer: "hello",
            correctAnswer: "hello",
          },
        ],
      };

      mockSessionRepository.findMostRecentCompleted.mockResolvedValue(mockCompletedSession);
      mockSessionRepository.findByIdAndUserId.mockResolvedValue(mockCompletedSession); // For getSessionSummary call
      mockStreakService.getStreak.mockResolvedValue({ currentStreak: 0, freezeCount: 0 }); // For getSessionSummary

      const result = await quizSessionService.createSession("user1");

      expect(mockSessionRepository.findMostRecentCompleted).toHaveBeenCalledWith("user1");
      expect(result.alreadyCompleted).toBe(true);
      expect(result.sessionId).toBe("completed-session-1");
      expect(result.summary).toBeDefined();
      expect(result.expiresAt).toBe(mockCompletedSession.expiresAt);
      expect(result.questions).toEqual([]);
      // Should not check for active session or fetch due words
      expect(mockSessionRepository.findActiveByUser).not.toHaveBeenCalled();
      expect(mockLearningService.getDueWords).not.toHaveBeenCalled();
    });

    it("should return existing active session if found", async () => {
      const mockExistingSession = {
        id: "session1",
        userId: "user1",
        questions: [
          {
            id: "word1_multiple_choice",
            wordId: "word1",
            questionType: "multiple_choice",
            word: { id: "word1", simplified: "你好", pinyin: "nǐ hǎo", english: "hello" },
            correctAnswer: "hello",
          },
          {
            id: "word2_type_pinyin",
            wordId: "word2",
            questionType: "type_pinyin",
            word: { id: "word2", simplified: "谢谢", traditional: "謝謝", english: "thank you" },
            correctAnswer: "xie4 xie4",
          },
        ],
        answers: [
          {
            wordId: "word1",
            questionType: "multiple_choice",
            userAnswer: "hello",
            correct: true,
            timestamp: new Date("2026-03-08T10:00:00Z"),
            nextReviewDate: "2026-03-10T10:00:00Z",
            lapseCount: 0,
            isLeech: false,
          },
        ],
        currentIndex: 1,
        status: "ACTIVE",
        expiresAt: new Date(Date.now() + 3600000),
      };

      mockSessionRepository.findMostRecentCompleted.mockResolvedValue(null);
      mockSessionRepository.findActiveByUser.mockResolvedValue(mockExistingSession);

      const result = await quizSessionService.createSession("user1");

      expect(mockSessionRepository.findActiveByUser).toHaveBeenCalledWith("user1");
      expect(mockLearningService.getDueWords).not.toHaveBeenCalled();
      expect(result.sessionId).toBe("session1");
      expect(result.isResume).toBe(true);
      expect(result.currentIndex).toBe(1);
      expect(result.answers).toHaveLength(1);
      expect(result.answers[0]).toEqual({
        wordId: "word1",
        questionType: "multiple_choice",
        userAnswer: "hello",
        correct: true,
        timestamp: new Date("2026-03-08T10:00:00Z"),
        nextReview: "2026-03-10T10:00:00Z",
        lapseCount: 0,
        isLeech: false,
      });
    });

    it("should return noDueWords response if no words due for review", async () => {
      mockSessionRepository.findMostRecentCompleted.mockResolvedValue(null);
      mockSessionRepository.findActiveByUser.mockResolvedValue(null);
      mockLearningService.getDueWords.mockResolvedValue([]);

      const result = await quizSessionService.createSession("user1");

      expect(result.noDueWords).toBe(true);
      expect(result.questions).toEqual([]);
      expect(result.message).toBeDefined();
    });

    it("should generate interleaved questions (3 types per word)", async () => {
      const mockDueWords = [
        {
          id: "word1",
          simplified: "你好",
          traditional: "你好",
          pinyin: "nǐ hǎo",
          english: "hello",
        },
      ];

      mockSessionRepository.findMostRecentCompleted.mockResolvedValue(null);
      mockSessionRepository.findActiveByUser.mockResolvedValue(null);
      mockLearningService.getDueWords.mockResolvedValue(mockDueWords);

      let capturedQuestions;
      mockSessionRepository.create.mockImplementation(async (data) => {
        capturedQuestions = data.questions;
        return {
          id: "session1",
          userId: "user1",
          questions: data.questions,
          answers: [],
          currentIndex: 0,
          status: "ACTIVE",
          startedAt: new Date(),
          expiresAt: data.expiresAt,
        };
      });

      await quizSessionService.createSession("user1");

      // Should have 3 questions (one per type)
      expect(capturedQuestions).toHaveLength(3);
      const questionTypes = capturedQuestions.map((q) => q.questionType);
      expect(questionTypes).toContain("multiple_choice");
      expect(questionTypes).toContain("type_pinyin");
      expect(questionTypes).toContain("type_character");
    });

    it("should not include correct answers in client response", async () => {
      const mockDueWords = [
        {
          id: "word1",
          simplified: "你好",
          traditional: "你好",
          pinyin: "nǐ hǎo",
          english: "hello",
        },
      ];

      mockSessionRepository.findMostRecentCompleted.mockResolvedValue(null);
      mockSessionRepository.findActiveByUser.mockResolvedValue(null);
      mockLearningService.getDueWords.mockResolvedValue(mockDueWords);
      mockSessionRepository.create.mockResolvedValue({
        id: "session1",
        userId: "user1",
        questions: [
          {
            id: "word1_multiple_choice",
            wordId: "word1",
            questionType: "multiple_choice",
            word: { id: "word1", simplified: "你好", pinyin: "nǐ hǎo", english: "hello" },
            correctAnswer: "hello",
          },
        ],
        answers: [],
        currentIndex: 0,
        status: "ACTIVE",
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
      });

      const result = await quizSessionService.createSession("user1");

      // Questions should not include correctAnswer
      result.questions.forEach((q) => {
        expect(q).not.toHaveProperty("correctAnswer");
      });
    });
  });

  // ============================================================================
  // submitAnswer Tests
  // ============================================================================

  describe("submitAnswer", () => {
    const mockSession = {
      id: "session1",
      userId: "user1",
      questions: [
        {
          id: "word1_type_pinyin",
          wordId: "word1",
          questionType: "type_pinyin",
          word: {
            id: "word1",
            simplified: "你好",
            traditional: "你好",
            pinyin: "nǐ hǎo",
            english: "hello",
          },
          correctAnswer: "nǐ hǎo",
        },
        {
          id: "word1_multiple_choice",
          wordId: "word1",
          questionType: "multiple_choice",
          word: {
            id: "word1",
            simplified: "你好",
            traditional: "你好",
            pinyin: "nǐ hǎo",
            english: "hello",
          },
          correctAnswer: "hello",
        },
      ],
      answers: [],
      currentIndex: 0,
      status: "ACTIVE",
      expiresAt: new Date(Date.now() + 3600000),
    };

    it("should validate correct answer and update progress", async () => {
      mockSessionRepository.findByIdAndUserId.mockResolvedValue(mockSession);
      mockSessionRepository.update.mockResolvedValue({
        ...mockSession,
        answers: [
          {
            questionId: "word1_type_pinyin",
            wordId: "word1",
            userAnswer: "nǐ hǎo",
            correct: true,
            timeSpentMs: 5000,
            answeredAt: new Date().toISOString(),
          },
        ],
        currentIndex: 1,
      });
      mockLearningService.recordQuizResult.mockResolvedValue({
        nextReviewDate: new Date().toISOString(),
        lapseCount: 0,
        isLeech: false,
      });

      const result = await quizSessionService.submitAnswer(
        "session1",
        "user1",
        "word1_type_pinyin",
        "nǐ hǎo",
        5000,
      );

      // Verify flat response structure (aligned with type audit)
      expect(result.correct).toBe(true);
      expect(result.correctAnswer).toBe("nǐ hǎo");
      expect(result.nextReviewDate).toBeDefined();
      expect(result.lapseCount).toBe(0);
      expect(result.isLeech).toBe(false);
      expect(result.sessionComplete).toBe(false);
      expect(result.nextQuestion).toBeDefined();
      // Gamification should be null (not complete yet)
      expect(result.gamification).toBeNull();
      expect(mockLearningService.recordQuizResult).toHaveBeenCalledWith({
        userId: "user1",
        wordId: "word1",
        correct: true,
        questionType: "type_pinyin",
        timeSpentMs: 5000,
      });
      // Gamification NOT processed per-answer (only on completion)
      expect(mockGamificationService.calculateXP).not.toHaveBeenCalled();
    });

    it("should validate incorrect answer and not award gamification", async () => {
      mockSessionRepository.findByIdAndUserId.mockResolvedValue(mockSession);
      mockSessionRepository.update.mockResolvedValue({
        ...mockSession,
        answers: [
          {
            questionId: "word1_type_pinyin",
            wordId: "word1",
            userAnswer: "wrong answer",
            correct: false,
            timeSpentMs: 3000,
            answeredAt: new Date().toISOString(),
          },
        ],
        currentIndex: 1,
      });
      mockLearningService.recordQuizResult.mockResolvedValue({
        nextReviewDate: new Date().toISOString(),
        lapseCount: 1,
        isLeech: false,
      });

      const result = await quizSessionService.submitAnswer(
        "session1",
        "user1",
        "word1_type_pinyin",
        "wrong answer",
        3000,
      );

      // Verify flat response structure
      expect(result.correct).toBe(false);
      expect(result.correctAnswer).toBe("nǐ hǎo");
      expect(result.nextReviewDate).toBeDefined();
      expect(result.lapseCount).toBe(1);
      expect(result.isLeech).toBe(false);
      expect(result.gamification).toBeNull();
      // Gamification NOT called (session not complete)
      expect(mockGamificationService.calculateXP).not.toHaveBeenCalled();
    });

    it("should mark session as complete on last question and process gamification", async () => {
      const sessionWithOneQuestionLeft = {
        ...mockSession,
        currentIndex: 1,
        answers: [
          {
            questionId: "word1_type_pinyin",
            wordId: "word1",
            userAnswer: "nǐ hǎo",
            correct: true,
            timeSpentMs: 5000,
            answeredAt: new Date().toISOString(),
          },
        ],
      };

      mockSessionRepository.findByIdAndUserId.mockResolvedValue(sessionWithOneQuestionLeft);
      mockSessionRepository.update.mockResolvedValue({
        ...sessionWithOneQuestionLeft,
        answers: [
          ...sessionWithOneQuestionLeft.answers,
          {
            questionId: "word1_multiple_choice",
            wordId: "word1",
            userAnswer: "hello",
            correct: true,
            timeSpentMs: 2000,
            answeredAt: new Date().toISOString(),
          },
        ],
        currentIndex: 2,
        status: "COMPLETE",
        completedAt: new Date(),
      });
      mockLearningService.recordQuizResult.mockResolvedValue({
        nextReviewDate: new Date().toISOString(),
        lapseCount: 0,
        isLeech: false,
      });
      // Mock gamification services for session completion
      mockStreakService.getStreak.mockResolvedValue({
        currentStreak: 7,
        longestStreak: 10,
        lastActivityDate: new Date(),
        freezeCount: 2,
      });
      mockGamificationService.calculateXP.mockReturnValue(15); // 10 base + 5 streak bonus
      mockGamificationService.checkAndAwardBadges.mockResolvedValue([]);
      mockGamificationService.checkMysteryBoxDrop.mockReturnValue(null);
      mockStreakService.updateStreak.mockResolvedValue({ currentStreak: 8, freezeAwarded: false });
      mockStreakService.checkAndAwardFreeze.mockResolvedValue(true); // 100% accuracy awards freeze

      const result = await quizSessionService.submitAnswer(
        "session1",
        "user1",
        "word1_multiple_choice",
        "hello",
        2000,
      );

      expect(result.sessionComplete).toBe(true);
      expect(result.nextQuestion).toBeNull();
      // Gamification should be present with currentStreak
      expect(result.gamification).toBeDefined();
      expect(result.gamification.xpEarned).toBe(15);
      expect(result.gamification.currentStreak).toBe(7);
      expect(result.gamification.newBadges).toEqual([]);
      expect(result.gamification.mysteryBox).toBeNull();
      expect(result.gamification.freezeAwarded).toBe(true); // 100% accuracy (2/2 correct)
      // Verify gamification services were called
      expect(mockStreakService.getStreak).toHaveBeenCalledWith("user1");
      expect(mockGamificationService.calculateXP).toHaveBeenCalled();
      expect(mockGamificationService.checkAndAwardBadges).toHaveBeenCalled();
      expect(mockSessionRepository.update).toHaveBeenCalledWith(
        "session1",
        expect.objectContaining({
          status: "COMPLETE",
          completedAt: expect.any(Date),
        }),
      );
    });

    it("should throw error if session not found", async () => {
      mockSessionRepository.findById.mockResolvedValue(null);

      await expect(
        quizSessionService.submitAnswer("invalid_session", "user1", "q1", "answer", 1000),
      ).rejects.toThrow("Session not found");
    });

    it("should throw error if session expired", async () => {
      const expiredSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      };
      mockSessionRepository.findByIdAndUserId.mockResolvedValue(expiredSession);

      await expect(
        quizSessionService.submitAnswer("session1", "user1", "q1", "answer", 1000),
      ).rejects.toThrow("Session expired");
    });

    it("should throw error if question already answered", async () => {
      const sessionWithAnswer = {
        ...mockSession,
        answers: [
          {
            questionId: "word1_type_pinyin",
            wordId: "word1",
            userAnswer: "nǐ hǎo",
            correct: true,
            timeSpentMs: 5000,
            answeredAt: new Date().toISOString(),
          },
        ],
      };
      mockSessionRepository.findByIdAndUserId.mockResolvedValue(sessionWithAnswer);

      await expect(
        quizSessionService.submitAnswer("session1", "user1", "word1_type_pinyin", "answer", 1000),
      ).rejects.toThrow("Question already answered");
    });

    it("should throw error if question not found in session", async () => {
      mockSessionRepository.findByIdAndUserId.mockResolvedValue(mockSession);

      await expect(
        quizSessionService.submitAnswer("session1", "user1", "invalid_question_id", "answer", 1000),
      ).rejects.toThrow("Question not found in session");
    });

    it("should throw 404 error if user does not own session (no info leak)", async () => {
      mockSessionRepository.findByIdAndUserId.mockResolvedValue(null);

      const error = await quizSessionService
        .submitAnswer("session1", "different_user", "word1_type_pinyin", "answer", 1000)
        .catch((err) => err);

      expect(error.message).toBe("Session not found");
      expect(error.statusCode).toBe(404);
      expect(mockSessionRepository.findByIdAndUserId).toHaveBeenCalledWith(
        "session1",
        "different_user",
      );
    });

    // ============================================================================
    // AI Feedback Generation Tests (Story 15.11 Phase 9)
    // ============================================================================

    it("should generate AI feedback automatically for incorrect answers", async () => {
      mockSessionRepository.findByIdAndUserId.mockResolvedValue(mockSession);
      mockSessionRepository.update.mockResolvedValue({
        ...mockSession,
        answers: [
          {
            questionId: "word1_type_pinyin",
            wordId: "word1",
            userAnswer: "wrong answer",
            correct: false,
            timeSpentMs: 3000,
            answeredAt: new Date().toISOString(),
          },
        ],
        currentIndex: 1,
      });
      mockLearningService.recordQuizResult.mockResolvedValue({
        nextReviewDate: new Date(),
        lapseCount: 1,
        isLeech: false,
      });
      mockAIFeedbackService.generateFeedback.mockResolvedValue({
        explanation:
          "You confused tone 4 with tone 2. The correct answer requires tone 3 on both syllables.",
        errorType: "tone",
      });

      const result = await quizSessionService.submitAnswer(
        "session1",
        "user1",
        "word1_type_pinyin",
        "wrong answer",
        3000,
      );

      expect(result.correct).toBe(false);
      expect(result.aiFeedback).toEqual({
        explanation:
          "You confused tone 4 with tone 2. The correct answer requires tone 3 on both syllables.",
        errorType: "tone",
      });
      expect(mockAIFeedbackService.generateFeedback).toHaveBeenCalledWith({
        wordId: "word1",
        userAnswer: "wrong answer",
        correctAnswer: "nǐ hǎo",
        questionType: "type_pinyin",
      });
    });

    it("should not generate AI feedback for correct answers", async () => {
      mockSessionRepository.findByIdAndUserId.mockResolvedValue(mockSession);
      mockSessionRepository.update.mockResolvedValue({
        ...mockSession,
        answers: [
          {
            questionId: "word1_type_pinyin",
            wordId: "word1",
            userAnswer: "nǐ hǎo",
            correct: true,
            timeSpentMs: 5000,
            answeredAt: new Date().toISOString(),
          },
        ],
        currentIndex: 1,
      });
      mockLearningService.recordQuizResult.mockResolvedValue({
        nextReviewDate: new Date().toISOString(),
        lapseCount: 0,
        isLeech: false,
      });

      const result = await quizSessionService.submitAnswer(
        "session1",
        "user1",
        "word1_type_pinyin",
        "nǐ hǎo",
        5000,
      );

      expect(result.correct).toBe(true);
      expect(result.aiFeedback).toBeNull();
      expect(mockAIFeedbackService.generateFeedback).not.toHaveBeenCalled();
    });

    it("should timeout AI feedback after 3 seconds and return null feedback", async () => {
      mockSessionRepository.findByIdAndUserId.mockResolvedValue(mockSession);
      mockSessionRepository.update.mockResolvedValue({
        ...mockSession,
        answers: [
          {
            questionId: "word1_type_pinyin",
            wordId: "word1",
            userAnswer: "wrong answer",
            correct: false,
            timeSpentMs: 3000,
            answeredAt: new Date().toISOString(),
          },
        ],
        currentIndex: 1,
      });
      mockLearningService.recordQuizResult.mockResolvedValue({
        nextReviewDate: new Date(),
        lapseCount: 1,
        isLeech: false,
      });
      // Simulate slow AI feedback (>3 seconds)
      mockAIFeedbackService.generateFeedback.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ explanation: "Late feedback" }), 5000),
          ),
      );

      const result = await quizSessionService.submitAnswer(
        "session1",
        "user1",
        "word1_type_pinyin",
        "wrong answer",
        3000,
      );

      expect(result.correct).toBe(false);
      expect(result.aiFeedback).toBeNull(); // Timed out after 3 seconds
    });

    it("should continue without AI feedback if service fails", async () => {
      mockSessionRepository.findByIdAndUserId.mockResolvedValue(mockSession);
      mockSessionRepository.update.mockResolvedValue({
        ...mockSession,
        answers: [
          {
            questionId: "word1_type_pinyin",
            wordId: "word1",
            userAnswer: "wrong answer",
            correct: false,
            timeSpentMs: 3000,
            answeredAt: new Date().toISOString(),
          },
        ],
        currentIndex: 1,
      });
      mockLearningService.recordQuizResult.mockResolvedValue({
        nextReviewDate: new Date(),
        lapseCount: 1,
        isLeech: false,
      });
      mockAIFeedbackService.generateFeedback.mockRejectedValue(new Error("AI service unavailable"));

      const result = await quizSessionService.submitAnswer(
        "session1",
        "user1",
        "word1_type_pinyin",
        "wrong answer",
        3000,
      );

      // Should not throw error, just return null feedback
      expect(result.correct).toBe(false);
      expect(result.aiFeedback).toBeNull();
    });

    it("should handle missing AI feedback service gracefully", async () => {
      // Create service without AI feedback service
      const serviceWithoutAI = new QuizSessionService(
        mockSessionRepository,
        mockLearningService,
        mockGamificationService,
        mockVocabularyRepository,
        null, // No AI feedback service
      );

      mockSessionRepository.findByIdAndUserId.mockResolvedValue(mockSession);
      mockSessionRepository.update.mockResolvedValue({
        ...mockSession,
        answers: [
          {
            questionId: "word1_type_pinyin",
            wordId: "word1",
            userAnswer: "wrong answer",
            correct: false,
            timeSpentMs: 3000,
            answeredAt: new Date().toISOString(),
          },
        ],
        currentIndex: 1,
      });
      mockLearningService.recordQuizResult.mockResolvedValue({
        nextReviewDate: new Date(),
        lapseCount: 1,
        isLeech: false,
      });

      const result = await serviceWithoutAI.submitAnswer(
        "session1",
        "user1",
        "word1_type_pinyin",
        "wrong answer",
        3000,
      );

      expect(result.correct).toBe(false);
      expect(result.aiFeedback).toBeNull(); // No AI service, so no feedback
    });
  });

  // ============================================================================
  // Answer Validation Tests
  // ============================================================================

  describe("_validateAnswer", () => {
    it("should validate exact match for pinyin", () => {
      const question = {
        id: "word1_type_pinyin",
        wordId: "word1",
        questionType: "type_pinyin",
        correctAnswer: "nǐ hǎo",
      };

      const result = quizSessionService._validateAnswer("nǐ hǎo", question);
      expect(result).toBe(true);
    });

    it("should normalize case for pinyin", () => {
      const question = {
        id: "word1_type_pinyin",
        wordId: "word1",
        questionType: "type_pinyin",
        correctAnswer: "nǐ hǎo",
      };

      const result = quizSessionService._validateAnswer("NǏ HǍO", question);
      expect(result).toBe(true);
    });

    it("should allow space variations in pinyin", () => {
      const question = {
        id: "word1_type_pinyin",
        wordId: "word1",
        questionType: "type_pinyin",
        correctAnswer: "nǐ hǎo",
      };

      const result = quizSessionService._validateAnswer("nǐhǎo", question);
      expect(result).toBe(true);
    });

    it("should validate multi-answer support with semicolon", () => {
      const question = {
        id: "word1_multiple_choice",
        wordId: "word1",
        questionType: "multiple_choice",
        correctAnswer: "to go; to walk; to travel",
      };

      expect(quizSessionService._validateAnswer("to go", question)).toBe(true);
      expect(quizSessionService._validateAnswer("to walk", question)).toBe(true);
      expect(quizSessionService._validateAnswer("to travel", question)).toBe(true);
    });

    it("should validate multi-answer support with comma", () => {
      const question = {
        id: "word1_multiple_choice",
        wordId: "word1",
        questionType: "multiple_choice",
        correctAnswer: "flower, to spend",
      };

      expect(quizSessionService._validateAnswer("flower", question)).toBe(true);
      expect(quizSessionService._validateAnswer("to spend", question)).toBe(true);
    });

    it("should reject incorrect answers", () => {
      const question = {
        id: "word1_type_pinyin",
        wordId: "word1",
        questionType: "type_pinyin",
        correctAnswer: "nǐ hǎo",
      };

      const result = quizSessionService._validateAnswer("wrong answer", question);
      expect(result).toBe(false);
    });

    it("should normalize character answers (no spaces)", () => {
      const question = {
        id: "word1_type_character",
        wordId: "word1",
        questionType: "type_character",
        correctAnswer: "你好",
      };

      const result = quizSessionService._validateAnswer("你 好", question);
      expect(result).toBe(true);
    });
  });

  // ============================================================================
  // getSession Tests
  // ============================================================================

  describe("getSession", () => {
    it("should return session details", async () => {
      const mockSession = {
        id: "session1",
        userId: "user1",
        questions: [
          {
            id: "q1",
            wordId: "word1",
            questionType: "multiple_choice",
            word: { id: "word1", simplified: "你好", pinyin: "nǐ hǎo", english: "hello" },
            correctAnswer: "hello",
          },
        ],
        answers: [],
        currentIndex: 0,
        status: "ACTIVE",
        expiresAt: new Date(Date.now() + 3600000),
        completedAt: null,
      };

      mockSessionRepository.findByIdAndUserId.mockResolvedValue(mockSession);

      const result = await quizSessionService.getSession("session1", "user1");

      expect(result.sessionId).toBe("session1");
      expect(result.status).toBe("ACTIVE");
      expect(result.totalQuestions).toBe(1);
      expect(result.questionsAnswered).toBe(0);
      expect(result.questions[0]).not.toHaveProperty("correctAnswer");
    });

    it("should throw error if session not found", async () => {
      mockSessionRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(quizSessionService.getSession("invalid_session", "user1")).rejects.toThrow(
        "Session not found",
      );
    });

    it("should throw 404 error if user does not own session (no info leak)", async () => {
      mockSessionRepository.findByIdAndUserId.mockResolvedValue(null);

      const error = await quizSessionService
        .getSession("session1", "different_user")
        .catch((err) => err);

      expect(error.message).toBe("Session not found");
      expect(error.statusCode).toBe(404);
      expect(mockSessionRepository.findByIdAndUserId).toHaveBeenCalledWith(
        "session1",
        "different_user",
      );
    });
  });

  // ============================================================================
  // abandonSession Tests
  // ============================================================================

  describe("abandonSession", () => {
    it("should abandon active session", async () => {
      const mockSession = {
        id: "session1",
        userId: "user1",
        status: "ACTIVE",
      };

      mockSessionRepository.findActiveByUser.mockResolvedValue(mockSession);
      mockSessionRepository.update.mockResolvedValue({
        ...mockSession,
        status: "EXPIRED",
      });

      const result = await quizSessionService.abandonSession("user1");

      expect(result).toBe(true);
      expect(mockSessionRepository.update).toHaveBeenCalledWith("session1", {
        status: "EXPIRED",
      });
    });

    it("should return false if no active session", async () => {
      mockSessionRepository.findActiveByUser.mockResolvedValue(null);

      const result = await quizSessionService.abandonSession("user1");

      expect(result).toBe(false);
      expect(mockSessionRepository.update).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // getSessionSummary Tests
  // ============================================================================

  describe("getSessionSummary", () => {
    it("should return session summary with gamification data", async () => {
      const mockSession = {
        id: "session1",
        userId: "user1",
        questions: [
          {
            id: "q1",
            wordId: "word1",
            questionType: "multiple_choice",
            word: {
              hanzi: "你好",
              pinyin: "nǐhǎo",
              english: "hello",
              lapseCount: 0,
            },
          },
        ],
        answers: [
          {
            questionId: "q1",
            correct: true,
            userAnswer: "hello",
            correctAnswer: "hello",
          },
        ],
        xpEarned: 20,
        newBadges: [{ id: "badge1", name: "Week Warrior" }],
        mysteryBox: { id: "box1", type: "xp_boost" },
        completedAt: new Date("2026-03-08T12:00:00Z").toISOString(),
        expiresAt: new Date("2026-03-09T00:00:00Z").toISOString(),
      };

      mockSessionRepository.findByIdAndUserId.mockResolvedValue(mockSession);
      mockStreakService.getStreak.mockResolvedValue({
        currentStreak: 7,
        freezeCount: 2,
      });

      const result = await quizSessionService.getSessionSummary("session1", "user1");

      expect(result.sessionId).toBe("session1");
      expect(result.correctCount).toBe(1);
      expect(result.totalQuestions).toBe(1);
      expect(result.accuracyRate).toBe(100);
      expect(result.xpEarned).toBe(20);
      expect(result.newBadges).toHaveLength(1);
      expect(result.mysteryBox).toEqual({ id: "box1", type: "xp_boost" });
      expect(result.currentStreak).toBe(7);
      expect(result.availableFreezes).toBe(2);
      expect(result.expiresAt).toBeDefined();
    });

    it("should throw 404 error if user does not own session (no info leak)", async () => {
      // Repository returns null for unauthorized access (composite lookup)
      mockSessionRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(quizSessionService.getSessionSummary("session1", "user1")).rejects.toThrow(
        "Session not found",
      );
    });

    it("should throw error if session not found", async () => {
      mockSessionRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        quizSessionService.getSessionSummary("invalid_session", "user1"),
      ).rejects.toThrow("Session not found");
    });

    it("should handle missing streak service gracefully", async () => {
      const mockSession = {
        id: "session1",
        userId: "user1",
        questions: [],
        answers: [],
        completedAt: new Date().toISOString(),
        expiresAt: new Date().toISOString(),
      };

      mockSessionRepository.findByIdAndUserId.mockResolvedValue(mockSession);

      // Create service without streak service
      const serviceWithoutStreak = new QuizSessionService(
        mockSessionRepository,
        mockLearningService,
        mockGamificationService,
        mockVocabularyRepository,
        mockAIFeedbackService,
        null, // No streak service
      );

      const result = await serviceWithoutStreak.getSessionSummary("session1", "user1");

      expect(result.currentStreak).toBe(0);
      expect(result.availableFreezes).toBe(0);
    });
  });

  // ============================================================================
  // Flow 5: Quiz Results Persistence Tests
  // ============================================================================

  describe("Quiz Results Persistence (Flow 5)", () => {
    it("should persist quiz results with correct lapseCount from progressUpdate", async () => {
      const mockSession = {
        id: "session1",
        userId: "user1",
        status: "ACTIVE",
        currentIndex: 9, // Last question (index 9 of 10 questions)
        questions: Array.from({ length: 10 }, (_, i) => ({
          id: `word${i}_type_pinyin`,
          wordId: `word${i}`,
          questionType: "type_pinyin",
          word: {
            id: `word${i}`,
            simplified: `汉字${i}`,
            traditional: `漢字${i}`,
            english: `meaning${i}`,
          },
        })),
        answers: Array.from({ length: 9 }, (_, i) => ({
          questionId: `word${i}_type_pinyin`,
          wordId: `word${i}`,
          userAnswer: "wrong",
          correct: false,
          timeSpentMs: 5000,
          answeredAt: new Date().toISOString(),
          lapseCount: i + 1, // Incrementing lapseCount (1-9)
          isLeech: i + 1 >= 5, // Words 4-8 are leeches (lapseCount >= 5)
        })),
      };

      // Mock finding the session
      mockSessionRepository.findByIdAndUserId.mockResolvedValue(mockSession);

      // Mock progressUpdate returning lapseCount 10 (this is the 10th consecutive failure)
      mockLearningService.recordQuizResult.mockResolvedValue({
        nextReviewDate: new Date(Date.now() + 86400000).toISOString(),
        lapseCount: 10,
        isLeech: true,
      });

      // Mock gamification
      mockGamificationService.calculateXP.mockResolvedValue(100);
      mockGamificationService.checkAndAwardBadges.mockResolvedValue([]);
      mockGamificationService.checkMysteryBoxDrop.mockResolvedValue(null);

      // Mock streak
      mockStreakService.getStreak.mockResolvedValue({ currentStreak: 5 });
      mockStreakService.updateStreak.mockResolvedValue({
        currentStreak: 6,
        freezeAwarded: false,
      });

      // Mock session update
      mockSessionRepository.update.mockResolvedValue(undefined);

      // Mock summary persistence
      mockSummaryRepository.create.mockResolvedValue(undefined);

      // Submit final answer
      const result = await quizSessionService.submitAnswer(
        "session1",
        "user1",
        "word9_type_pinyin",
        "wrong",
        5000,
      );

      // Verify session complete
      expect(result.sessionComplete).toBe(true);

      // Verify summaryRepository.create was called
      expect(mockSummaryRepository.create).toHaveBeenCalledTimes(1);

      // Extract the persisted data
      const persistedData = mockSummaryRepository.create.mock.calls[0][0];

      // Verify incorrectWords array has correct lapseCount values
      expect(persistedData.incorrectWords).toHaveLength(10);

      // Check first incorrect word (from previous answers)
      expect(persistedData.incorrectWords[0]).toMatchObject({
        wordId: "word0",
        lapseCount: 1,
        isLeech: false,
      });

      // Check word with lapseCount >= 5 (leech)
      expect(persistedData.incorrectWords[4]).toMatchObject({
        wordId: "word4",
        lapseCount: 5,
        isLeech: true,
      });

      // Check last incorrect word (current answer with lapseCount 10)
      expect(persistedData.incorrectWords[9]).toMatchObject({
        wordId: "word9",
        lapseCount: 10,
        isLeech: true,
      });

      // Verify leechWordIds contains correct words (lapseCount >= 5)
      expect(persistedData.leechWordIds).toHaveLength(6); // Words 4-9 (lapseCount 5-10)
      expect(persistedData.leechWordIds).toContain("word4");
      expect(persistedData.leechWordIds).toContain("word5");
      expect(persistedData.leechWordIds).toContain("word6");
      expect(persistedData.leechWordIds).toContain("word7");
      expect(persistedData.leechWordIds).toContain("word8");
      expect(persistedData.leechWordIds).toContain("word9");
    });

    it("should not persist results when session not complete", async () => {
      const mockSession = {
        id: "session1",
        userId: "user1",
        status: "ACTIVE",
        currentIndex: 0, // First question
        questions: Array.from({ length: 10 }, (_, i) => ({
          id: `word${i}_type_pinyin`,
          wordId: `word${i}`,
          questionType: "type_pinyin",
          word: {
            id: `word${i}`,
            simplified: `汉字${i}`,
            traditional: `漢字${i}`,
            english: `meaning${i}`,
          },
        })),
        answers: [],
      };

      mockSessionRepository.findByIdAndUserId.mockResolvedValue(mockSession);

      mockLearningService.recordQuizResult.mockResolvedValue({
        nextReviewDate: new Date(Date.now() + 86400000).toISOString(),
        lapseCount: 1,
        isLeech: false,
      });

      mockSessionRepository.update.mockResolvedValue(undefined);

      // Submit first answer
      await quizSessionService.submitAnswer(
        "session1",
        "user1",
        "word0_type_pinyin",
        "answer",
        5000,
      );

      // Verify summaryRepository.create was NOT called (session not complete)
      expect(mockSummaryRepository.create).not.toHaveBeenCalled();
    });
  });
});
