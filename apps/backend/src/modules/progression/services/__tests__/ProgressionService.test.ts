/**
 * @file modules/progression/services/__tests__/ProgressionService.test.js
 * @description Unit tests for ProgressionService — radical progress + phase gate calibration
 * Stories: 19.3 (RadicalProgress), 21.9 (Phase Gate Calibration)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Create the mock existsSync function using vi.hoisted so it's available during mock factory hoisting
const mockExistsSync = vi.hoisted(() => vi.fn());

// Mock Prisma before importing the service
const mockPrisma = vi.hoisted(() => ({
  characterProgress: {
    count: vi.fn(),
  },
  character: {
    findMany: vi.fn(),
  },
  passage: {
    findUnique: vi.fn(),
  },
}));

vi.mock("../../../../shared/infrastructure/database/client", () => ({
  prisma: mockPrisma,
}));

// Mock fs.existsSync at module level — intercepts ESM import in ProgressionService
vi.mock("fs", () => {
  const fsMock: Record<string, any> = {
    existsSync: mockExistsSync,
    readdirSync: vi.fn(() => []),
    readFileSync: vi.fn(() => "{}"),
    default: undefined as any,
  };
  fsMock.default = fsMock;
  return fsMock;
});

import { ProgressionService } from "../ProgressionService.js";

describe("ProgressionService", () => {
  let progressionService: ProgressionService;
  let mockProgressionRepository: any;
  let mockReadersService: any;
  let mockQuizService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset Prisma mock implementations so each test starts fresh
    mockPrisma.characterProgress.count.mockReset();
    mockPrisma.character.findMany.mockReset();
    mockPrisma.passage.findUnique.mockReset();

    // Default: radical content file exists
    mockExistsSync.mockReturnValue(true);

    // Mock ProgressionRepository
    mockProgressionRepository = {
      findRadicalProgressByUser: vi.fn(),
      findRadicalProgressByUserAndRadicalId: vi.fn(),
      upsertRadicalProgress: vi.fn(),
      findPhaseGateByUser: vi.fn(),
      createPhaseGate: vi.fn(),
      updatePhaseGate: vi.fn(),
      findFoundationProgressByUser: vi.fn(),
      createFoundationProgress: vi.fn(),
      upsertFoundationProgress: vi.fn(),
    };

    // Mock ReadersService
    mockReadersService = {
      getUserKnownLevel: vi.fn(),
      selectPassageForGate: vi.fn(),
    };

    // Mock QuizService
    mockQuizService = {
      getComprehensionQuizResult: vi.fn(),
    };

    progressionService = new ProgressionService(
      mockProgressionRepository,
      mockReadersService,
      mockQuizService,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getRadicalProgress", () => {
    it("should return all radical progress records for a user", async () => {
      const userId = "user123";
      const mockRecords = [
        { userId, radicalId: "rad_0001", memorized: true, recognitionLevel: 3 },
        { userId, radicalId: "rad_0002", memorized: false, recognitionLevel: 1 },
      ];
      mockProgressionRepository.findRadicalProgressByUser.mockResolvedValue(mockRecords);

      const result = await progressionService.getRadicalProgress(userId);

      expect(result).toEqual(mockRecords);
      expect(mockProgressionRepository.findRadicalProgressByUser).toHaveBeenCalledWith(userId);
      expect(mockProgressionRepository.findRadicalProgressByUser).toHaveBeenCalledOnce();
    });

    it("should return empty array when user has no radical progress", async () => {
      const userId = "user456";
      mockProgressionRepository.findRadicalProgressByUser.mockResolvedValue([]);

      const result = await progressionService.getRadicalProgress(userId);

      expect(result).toEqual([]);
      expect(mockProgressionRepository.findRadicalProgressByUser).toHaveBeenCalledWith(userId);
    });
  });

  describe("getRadicalProgressById", () => {
    it("should return a radical progress record when found", async () => {
      const userId = "user123";
      const radicalId = "rad_0001";
      const mockRecord = { userId, radicalId, memorized: true, recognitionLevel: 3 };
      mockProgressionRepository.findRadicalProgressByUserAndRadicalId.mockResolvedValue(mockRecord);

      const result = await progressionService.getRadicalProgressById(userId, radicalId);

      expect(result).toEqual(mockRecord);
      expect(mockProgressionRepository.findRadicalProgressByUserAndRadicalId).toHaveBeenCalledWith(
        userId,
        radicalId,
      );
    });

    it("should return null when radical progress not found", async () => {
      const userId = "user123";
      const radicalId = "rad_9999";
      mockProgressionRepository.findRadicalProgressByUserAndRadicalId.mockResolvedValue(null);

      const result = await progressionService.getRadicalProgressById(userId, radicalId);

      expect(result).toBeNull();
      expect(mockProgressionRepository.findRadicalProgressByUserAndRadicalId).toHaveBeenCalledWith(
        userId,
        radicalId,
      );
    });
  });

  describe("upsertRadicalProgress", () => {
    it("should upsert and return the radical progress record (happy path)", async () => {
      const userId = "user123";
      const radicalId = "rad_0001";
      const data = { memorized: true, recognitionLevel: 3 };
      const mockRecord = { userId, radicalId, memorized: true, recognitionLevel: 3 };
      mockProgressionRepository.upsertRadicalProgress.mockResolvedValue(mockRecord);

      const result = await progressionService.upsertRadicalProgress(userId, radicalId, data);

      expect(result).toEqual(mockRecord);
      expect(mockProgressionRepository.upsertRadicalProgress).toHaveBeenCalledWith({
        userId,
        radicalId,
        memorized: true,
        recognitionLevel: 3,
      });
    });

    it("should use default values when memorized and recognitionLevel are not provided", async () => {
      const userId = "user123";
      const radicalId = "rad_0001";
      const mockRecord = {
        userId,
        radicalId,
        memorized: false,
        recognitionLevel: 0,
      };
      mockProgressionRepository.upsertRadicalProgress.mockResolvedValue(mockRecord);

      const result = await progressionService.upsertRadicalProgress(userId, radicalId, {});

      expect(result).toEqual(mockRecord);
      expect(mockProgressionRepository.upsertRadicalProgress).toHaveBeenCalledWith({
        userId,
        radicalId,
        memorized: false,
        recognitionLevel: 0,
      });
    });

    it("should throw validation error when radicalId does not exist in content data", async () => {
      const userId = "user123";
      const radicalId = "rad_9999";
      mockExistsSync.mockReturnValue(false);

      await expect(
        progressionService.upsertRadicalProgress(userId, radicalId, { memorized: true }),
      ).rejects.toThrow(`Invalid radicalId: ${radicalId}`);

      expect(mockProgressionRepository.upsertRadicalProgress).not.toHaveBeenCalled();
    });
  });

  // ── Phase Gate Calibration (Story 21.9) ─────────────────────────────────

  describe("checkPhase2Gate (IME threshold 80%)", () => {
    const userId = "user123";

    it("should pass when user is already grandfathered (phase2Passed)", async () => {
      mockProgressionRepository.findPhaseGateByUser.mockResolvedValue({
        phase2Passed: true,
        currentPhase: 3,
      });

      const attempt = { totalScore: 10, maxScore: 25 };
      const result = await progressionService.checkPhase2Gate(userId, attempt as any);

      expect(result.passed).toBe(true);
      expect(result.reason).toBe("GRANDFATHERED");
    });

    it("should pass when score >= 20 (80% threshold)", async () => {
      mockProgressionRepository.findPhaseGateByUser.mockResolvedValue({
        phase2Passed: false,
        currentPhase: 2,
      });

      const attempt = { totalScore: 20, maxScore: 25, quizType: "ime-simulator" };
      const result = await progressionService.checkPhase2Gate(userId, attempt as any);

      expect(result.passed).toBe(true);
    });

    it("should fail when score < 20 (below 80% threshold)", async () => {
      mockProgressionRepository.findPhaseGateByUser.mockResolvedValue({
        phase2Passed: false,
        currentPhase: 2,
      });

      const attempt = { totalScore: 19, maxScore: 25, quizType: "ime-simulator" };
      const result = await progressionService.checkPhase2Gate(userId, attempt as any);

      expect(result.passed).toBe(false);
      expect(result.reason).toBe("IME_SCORE_TOO_LOW");
    });

    it("should create phase gate if none exists", async () => {
      mockProgressionRepository.findPhaseGateByUser.mockResolvedValue(null);
      mockProgressionRepository.createPhaseGate.mockResolvedValue({
        phase2Passed: false,
        currentPhase: 2,
      });

      const attempt = { totalScore: 20, maxScore: 25, quizType: "ime-simulator" };
      const result = await progressionService.checkPhase2Gate(userId, attempt as any);

      expect(result.passed).toBe(true);
      expect(mockProgressionRepository.createPhaseGate).toHaveBeenCalled();
    });

    it("should fail with INVALID_QUIZ_TYPE when quizType is not ime-simulator", async () => {
      mockProgressionRepository.findPhaseGateByUser.mockResolvedValue({
        phase2Passed: false,
        currentPhase: 2,
      });

      const attempt = { totalScore: 25, maxScore: 25, quizType: "audio-to-type" };
      const result = await progressionService.checkPhase2Gate(userId, attempt as any);

      expect(result.passed).toBe(false);
      expect(result.reason).toBe("INVALID_QUIZ_TYPE");
      expect(result.details).toContain("audio-to-type");
    });
  });

  describe("checkCharacterCountGate (≥500 characters)", () => {
    const userId = "user123";

    it("should pass when user has ≥500 characters with confidence > 0", async () => {
      mockPrisma.characterProgress.count.mockResolvedValue(500);

      const result = await progressionService.checkCharacterCountGate(userId);

      expect(result.passed).toBe(true);
      expect(mockPrisma.characterProgress.count).toHaveBeenCalledWith({
        where: { userId, confidence: { gt: 0 } },
      });
    });

    it("should fail when user has <500 characters with confidence > 0", async () => {
      mockPrisma.characterProgress.count.mockResolvedValue(300);

      const result = await progressionService.checkCharacterCountGate(userId);

      expect(result.passed).toBe(false);
      expect(result.reason).toBe("INSUFFICIENT_CHARACTER_COVERAGE");
      expect(result.details).toContain("300");
    });

    it("should fail when user has 0 characters", async () => {
      mockPrisma.characterProgress.count.mockResolvedValue(0);

      const result = await progressionService.checkCharacterCountGate(userId);

      expect(result.passed).toBe(false);
      expect(result.reason).toBe("INSUFFICIENT_CHARACTER_COVERAGE");
    });
  });

  describe("checkPhase3To4Gate (comprehension gate)", () => {
    const userId = "user123";

    it("should pass when both known word ratio and quiz score meet thresholds", async () => {
      mockReadersService.getUserKnownLevel.mockResolvedValue(3);
      mockReadersService.selectPassageForGate.mockResolvedValue({
        id: "passage-1",
        hskLevel: 3,
      });

      // Mock passage content for known word ratio computation
      mockPrisma.passage.findUnique.mockResolvedValue({
        content: {
          sentences: [
            { index: 0, text: "今天天气很好。" },
            { index: 1, text: "我们去公园散步。" },
          ],
        },
      });

      // Mock character lookup for known word ratio
      mockPrisma.character.findMany.mockResolvedValue([
        { glyph: "今" },
        { glyph: "天" },
        { glyph: "气" },
        { glyph: "很" },
        { glyph: "好" },
        { glyph: "我" },
        { glyph: "们" },
        { glyph: "去" },
        { glyph: "公" },
        { glyph: "园" },
        { glyph: "散" },
        { glyph: "步" },
      ]);

      // Quiz score meets threshold (60%)
      mockQuizService.getComprehensionQuizResult.mockResolvedValue({ score: 0.8 });

      const result = await progressionService.checkPhase3To4Gate(userId);

      expect(result.passed).toBe(true);
    });

    it("should fail when no passage is available (fallback to qualification quiz)", async () => {
      mockReadersService.getUserKnownLevel.mockResolvedValue(3);
      mockReadersService.selectPassageForGate.mockResolvedValue(null);

      const result = await progressionService.checkPhase3To4Gate(userId);

      expect(result.passed).toBe(false);
      expect(result.reason).toBe("NO_PASSAGE_AVAILABLE");
      expect(result.fallback).toBe("QUALIFICATION_QUIZ");
    });

    it("should fail when known word ratio is below 90%", async () => {
      mockReadersService.getUserKnownLevel.mockResolvedValue(3);
      mockReadersService.selectPassageForGate.mockResolvedValue({
        id: "passage-1",
        hskLevel: 3,
      });

      mockPrisma.passage.findUnique.mockResolvedValue({
        content: {
          sentences: [{ index: 0, text: "今天天气很好。" }],
        },
      });

      // Only return a few characters (less than 90% of the unique chars)
      mockPrisma.character.findMany.mockResolvedValue([{ glyph: "今" }]);

      const result = await progressionService.checkPhase3To4Gate(userId);

      expect(result.passed).toBe(false);
      expect(result.reason).toBe("KNOWN_WORD_RATIO_TOO_LOW");
    });

    it("should fail when comprehension quiz score is below 60%", async () => {
      mockReadersService.getUserKnownLevel.mockResolvedValue(3);
      mockReadersService.selectPassageForGate.mockResolvedValue({
        id: "passage-1",
        hskLevel: 3,
      });

      mockPrisma.passage.findUnique.mockResolvedValue({
        content: {
          sentences: [{ index: 0, text: "今天天气很好。" }],
        },
      });

      // All characters known
      mockPrisma.character.findMany.mockResolvedValue([
        { glyph: "今" },
        { glyph: "天" },
        { glyph: "气" },
        { glyph: "很" },
        { glyph: "好" },
      ]);

      // Quiz score below 60%
      mockQuizService.getComprehensionQuizResult.mockResolvedValue({ score: 0.4 });

      const result = await progressionService.checkPhase3To4Gate(userId);

      expect(result.passed).toBe(false);
      expect(result.reason).toBe("COMPREHENSION_SCORE_TOO_LOW");
    });

    it("should fail when no comprehension quiz exists", async () => {
      mockReadersService.getUserKnownLevel.mockResolvedValue(3);
      mockReadersService.selectPassageForGate.mockResolvedValue({
        id: "passage-1",
        hskLevel: 3,
      });

      mockPrisma.passage.findUnique.mockResolvedValue({
        content: {
          sentences: [{ index: 0, text: "今天天气很好。" }],
        },
      });

      mockPrisma.character.findMany.mockResolvedValue([
        { glyph: "今" },
        { glyph: "天" },
        { glyph: "气" },
        { glyph: "很" },
        { glyph: "好" },
      ]);

      // No quiz attempt exists
      mockQuizService.getComprehensionQuizResult.mockResolvedValue(null);

      const result = await progressionService.checkPhase3To4Gate(userId);

      expect(result.passed).toBe(false);
      expect(result.reason).toBe("COMPREHENSION_SCORE_TOO_LOW");
    });

    it("should return dependency error when readersService or quizService not configured", async () => {
      const bareService = new ProgressionService(mockProgressionRepository);

      const result = await bareService.checkPhase3To4Gate(userId);

      expect(result.passed).toBe(false);
      expect(result.reason).toBe("DEPENDENCY_MISSING");
    });

    // ── Edge cases: computeKnownWordRatio (exercised via checkPhase3To4Gate) ──

    it("should fail when passage has empty sentences (known word ratio = 0)", async () => {
      mockReadersService.getUserKnownLevel.mockResolvedValue(3);
      mockReadersService.selectPassageForGate.mockResolvedValue({
        id: "passage-1",
        hskLevel: 3,
      });

      // Passage content with no sentences
      mockPrisma.passage.findUnique.mockResolvedValue({
        content: {
          sentences: [],
        },
      });

      const result = await progressionService.checkPhase3To4Gate(userId);

      expect(result.passed).toBe(false);
      expect(result.reason).toBe("KNOWN_WORD_RATIO_TOO_LOW");
    });

    it("should fail when passage has no CJK characters (punctuation only — known word ratio = 0)", async () => {
      mockReadersService.getUserKnownLevel.mockResolvedValue(3);
      mockReadersService.selectPassageForGate.mockResolvedValue({
        id: "passage-1",
        hskLevel: 3,
      });

      // Passage content with only non-CJK characters (punctuation, spaces, numbers)
      mockPrisma.passage.findUnique.mockResolvedValue({
        content: {
          sentences: [{ index: 0, text: "?! 123 ,,." }],
        },
      });

      const result = await progressionService.checkPhase3To4Gate(userId);

      expect(result.passed).toBe(false);
      expect(result.reason).toBe("KNOWN_WORD_RATIO_TOO_LOW");
    });
  });
});
