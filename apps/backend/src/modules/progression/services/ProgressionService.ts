/**
 * @file apps/backend/src/modules/progression/services/ProgressionService.ts
 * @description Business logic for foundation progress and phase gate management
 * Stories: 18.1 (Foundations Page Structure), 21.9 (Phase Gate Calibration)
 */

import type { FoundationProgress, RadicalProgress, PhaseGate, QuizAttempt } from "@prisma/client";
import { FOUNDATION_SECTIONS } from "@mandarin/shared-constants";
import { GATE_THRESHOLDS } from "../../../config/gate-thresholds.js";
import type { IProgressionRepository, GateResult } from "../types/progression.js";
import { prisma } from "../../../shared/infrastructure/database/client.js";
import type { ReadersService } from "../../readers/services/ReadersService.js";
import type { QuizService } from "../../quiz/services/QuizService.js";

/**
 * Update phase gate parameters.
 */
interface PhaseGateUpdateParams {
  phase: number;
  passed: boolean;
  gateCriteria?: string;
}

/**
 * Radical progress upsert data.
 */
interface RadicalProgressData {
  memorized?: boolean;
  recognitionLevel?: number;
}

/**
 * ProgressionService
 * Manages foundation section progress, phase gate access control, radical progress,
 * and phase gate calibration checks (IME threshold, character count, comprehension).
 *
 * SOLID: Single Responsibility - progression business logic only.
 */
export class ProgressionService {
  private progressionRepository: IProgressionRepository;
  private readersService?: ReadersService;
  private quizService?: QuizService;

  constructor(
    progressionRepository: IProgressionRepository,
    readersService?: ReadersService,
    quizService?: QuizService,
  ) {
    if (!progressionRepository) {
      throw new Error("ProgressionService requires progressionRepository");
    }
    this.progressionRepository = progressionRepository;
    this.readersService = readersService;
    this.quizService = quizService;
  }

  /**
   * Set the quiz service after construction (breaks circular dependency).
   * Used by the DI container when quizModule depends on progressionModule.
   */
  setQuizService(quizService: QuizService): void {
    this.quizService = quizService;
  }

  // ── Phase Gate Calibration Methods (Story 21.9) ──────────────────────────

  /**
   * Check Phase 2 gate: IME Simulator threshold (80%).
   * Retroactive: users who already passed Phase 2 are grandfathered.
   *
   * @param userId - User ID
   * @param attempt - The completed IME Simulator quiz attempt
   * @returns GateResult with pass/fail and details
   */
  async checkPhase2Gate(userId: string, attempt: QuizAttempt): Promise<GateResult> {
    // Retroactive grandfathering: users who already passed are not regressed
    const gate = await this.getOrCreatePhaseGate(userId);
    if (gate.phase2Passed) {
      return {
        passed: true,
        reason: "GRANDFATHERED",
        details: "Already passed Phase 2 under previous thresholds",
      };
    }

    // Verify this is an IME Simulator attempt
    if (attempt.quizType !== "ime-simulator") {
      return {
        passed: false,
        reason: "INVALID_QUIZ_TYPE",
        details: `Expected ime-simulator, got ${attempt.quizType}`,
      };
    }

    const passed = attempt.totalScore >= GATE_THRESHOLDS.IME_SIMULATOR_MIN_SCORE;
    if (!passed) {
      return {
        passed: false,
        reason: "IME_SCORE_TOO_LOW",
        details: `Score: ${attempt.totalScore}/${attempt.maxScore} (needs ≥${GATE_THRESHOLDS.IME_SIMULATOR_MIN_SCORE})`,
      };
    }

    return { passed: true };
  }

  /**
   * Check character count gate: user must have ≥500 distinct characters learned
   * (CharacterProgress with confidence > 0) before unlocking Phase 3.
   *
   * @param userId - User ID
   * @returns GateResult with pass/fail and details
   */
  async checkCharacterCountGate(userId: string): Promise<GateResult> {
    const learnedCharCount = await prisma.characterProgress.count({
      where: { userId, confidence: { gt: 0 } },
    });

    if (learnedCharCount < GATE_THRESHOLDS.CHARACTER_COUNT_MINIMUM) {
      return {
        passed: false,
        reason: "INSUFFICIENT_CHARACTER_COVERAGE",
        details: `Characters learned: ${learnedCharCount} (needs ≥${GATE_THRESHOLDS.CHARACTER_COUNT_MINIMUM})`,
      };
    }

    return { passed: true };
  }

  /**
   * Computed gate status for every phase gate — surfaced via
   * `GET /api/v1/progression/gates`. Unlike the persisted `PhaseGate` row
   * (which only reflects quiz-pass updates), this re-evaluates the gates
   * against the current data (e.g. the ≥500 character-count gate), so callers
   * can see a gate that was passed outside the quiz flow.
   *
   * @param userId - User ID
   * @returns Computed status for the Phase 2 (IME), character-count, and
   *          Phase 3→4 (comprehension) gates.
   */
  async getGateStatus(userId: string): Promise<{
    phase2Gate: GateResult;
    characterCountGate: GateResult;
    phase3To4Gate: GateResult;
  }> {
    const [phase2Gate, characterCountGate, phase3To4Gate] = await Promise.all([
      this.getPhase2GateStatus(userId),
      this.checkCharacterCountGate(userId),
      this.checkPhase3To4Gate(userId),
    ]);
    return { phase2Gate, characterCountGate, phase3To4Gate };
  }

  /**
   * Compute the Phase 2 gate status from the latest IME Simulator attempt
   * (grandfathered users who already passed are not regressed).
   */
  private async getPhase2GateStatus(userId: string): Promise<GateResult> {
    const gate = await this.getOrCreatePhaseGate(userId);
    if (gate.phase2Passed) {
      return {
        passed: true,
        reason: "GRANDFATHERED",
        details: "Already passed Phase 2 under previous thresholds",
      };
    }

    const attempt = await prisma.quizAttempt.findFirst({
      where: { userId, quizType: "ime-simulator" },
      orderBy: { createdAt: "desc" },
    });

    if (!attempt) {
      return {
        passed: false,
        reason: "NO_IME_ATTEMPT",
        details: `No IME Simulator attempt found (needs ≥${GATE_THRESHOLDS.IME_SIMULATOR_MIN_SCORE} correct)`,
      };
    }

    return this.checkPhase2Gate(userId, attempt);
  }

  /**
   * Check Phase 3→4 comprehension gate.
   * Two-part gate:
   *   (a) ≥60% correct on 5 passage comprehension questions, AND
   *   (b) ≥90% known words in the passage.
   *
   * If no passage exists at the user's HSK level, returns a fallback result
   * indicating the qualification quiz should be used.
   *
   * @param userId - User ID
   * @returns GateResult with pass/fail and details
   */
  async checkPhase3To4Gate(userId: string): Promise<GateResult> {
    if (!this.readersService || !this.quizService) {
      return {
        passed: false,
        reason: "DEPENDENCY_MISSING",
        details: "Gate dependencies (ReadersService, QuizService) not configured",
      };
    }

    // 1. Determine user's HSK level
    const hskLevel = await this.readersService.getUserKnownLevel(userId);

    // 2. Select passage at learner's HSK level
    const passage = await this.readersService.selectPassageForGate(hskLevel);

    if (!passage) {
      return {
        passed: false,
        reason: "NO_PASSAGE_AVAILABLE",
        fallback: "QUALIFICATION_QUIZ",
        details: "No cached passage at your level. Take a 5-question qualification quiz instead.",
      };
    }

    // 3. Check known word ratio (≥90%)
    const knownWordRatio = await this.computeKnownWordRatio(userId, passage.id);
    if (knownWordRatio < GATE_THRESHOLDS.COMPREHENSION_KNOWN_WORD_RATIO) {
      return {
        passed: false,
        reason: "KNOWN_WORD_RATIO_TOO_LOW",
        details: `Known word ratio: ${(knownWordRatio * 100).toFixed(1)}% (needs ≥${GATE_THRESHOLDS.COMPREHENSION_KNOWN_WORD_RATIO * 100}%)`,
      };
    }

    // 4. Check comprehension quiz score (≥60%)
    const quizResult = await this.quizService.getComprehensionQuizResult(userId, passage.id);

    if (!quizResult || quizResult.score < GATE_THRESHOLDS.COMPREHENSION_QUIZ_MIN_SCORE) {
      return {
        passed: false,
        reason: "COMPREHENSION_SCORE_TOO_LOW",
        details: quizResult
          ? `Score: ${(quizResult.score * 100).toFixed(0)}% (needs ≥${GATE_THRESHOLDS.COMPREHENSION_QUIZ_MIN_SCORE * 100}%)`
          : "No comprehension quiz found. Read the passage and take the comprehension quiz.",
      };
    }

    return { passed: true };
  }

  /**
   * Compute the ratio of known words in a passage for a user.
   * A word is considered known if its constituent characters have
   * CharacterProgress with confidence > 0.
   *
   * @param userId - User ID
   * @param passageId - Passage ID
   * @returns Ratio of known characters (0.0 - 1.0)
   */
  private async computeKnownWordRatio(userId: string, passageId: string): Promise<number> {
    const passage = await prisma.passage.findUnique({
      where: { id: passageId },
      select: { content: true },
    });

    if (!passage) return 0;

    const content = passage.content as { sentences?: Array<{ text: string }> };
    if (!content.sentences || content.sentences.length === 0) return 0;

    // Extract unique CJK characters from passage text (exclude punctuation, spaces)
    const passageChars = new Set<string>();
    for (const sentence of content.sentences) {
      for (const char of sentence.text) {
        // CJK Unified Ideographs range: U+4E00–U+9FFF
        const codePoint = char.codePointAt(0);
        if (codePoint && codePoint >= 0x4e00 && codePoint <= 0x9fff) {
          passageChars.add(char);
        }
      }
    }

    const passageCharIds = Array.from(passageChars);

    if (passageCharIds.length === 0) return 0;

    // Find characters that have CharacterProgress entries
    const charactersWithProgress = await prisma.character.findMany({
      where: {
        glyph: { in: passageCharIds },
        characterProgress: {
          some: {
            userId,
            confidence: { gt: 0 },
          },
        },
      },
      select: { glyph: true },
    });

    const knownCount = charactersWithProgress.length;
    return knownCount / passageCharIds.length;
  }

  /**
   * Get or create foundation progress records for a user.
   * Auto-initializes 4 records (one per FOUNDATION_SECTIONS, completed=false) if none exist.
   *
   * @param userId - User ID
   * @returns Array of foundation progress records
   */
  async getOrCreateFoundationProgress(userId: string): Promise<FoundationProgress[]> {
    const progress = await this.progressionRepository.findFoundationProgressByUser(userId);

    if (!progress || progress.length === 0) {
      // Auto-initialize records for each foundation section
      const created: FoundationProgress[] = [];
      for (const sectionId of FOUNDATION_SECTIONS) {
        const record = await this.progressionRepository.createFoundationProgress({
          userId,
          sectionId,
          completed: false,
        });
        created.push(record);
      }
      return created;
    }

    return progress;
  }

  /**
   * Get or create phase gate for a user.
   * Auto-creates with defaults if none exists.
   *
   * @param userId - User ID
   * @returns Phase gate record
   */
  async getOrCreatePhaseGate(userId: string): Promise<PhaseGate> {
    let phaseGate = await this.progressionRepository.findPhaseGateByUser(userId);

    if (!phaseGate) {
      phaseGate = await this.progressionRepository.createPhaseGate({
        userId,
        currentPhase: 1,
        phase1Passed: false,
        phase2Passed: false,
        phase3Passed: false,
        phase4Unlocked: false,
        gateCriteria: null,
      });
    }

    return phaseGate;
  }

  /**
   * Update phase gate progression based on quiz outcome.
   * Advances currentPhase when a phase is passed.
   * @param userId
   * @param params.phase - Phase being evaluated
   * @param params.passed - Whether the phase quiz was passed
   * @param params.gateCriteria - Criteria type ("quiz" | "retention" | "both")
   * @returns Updated phase gate
   */
  async updatePhaseGate(
    userId: string,
    { phase, passed, gateCriteria }: PhaseGateUpdateParams,
  ): Promise<PhaseGate> {
    const updateData: Record<string, unknown> = { gateCriteria };
    if (phase === 1) {
      updateData.phase1Passed = passed;
      if (passed) updateData.currentPhase = 2;
    } else if (phase === 2) {
      updateData.phase2Passed = passed;
      if (passed) updateData.currentPhase = 3;
    } else if (phase === 3) {
      updateData.phase3Passed = passed;
      if (passed) updateData.currentPhase = 4;
    } else if (phase === 4) {
      updateData.phase4Unlocked = passed;
    }
    return this.progressionRepository.updatePhaseGate(userId, updateData);
  }

  /**
   * Mark a foundation section as completed.
   * Validates sectionId against FOUNDATION_SECTIONS.
   * @param userId
   * @param sectionId
   * @param completed
   */
  async upsertFoundationProgress(
    userId: string,
    sectionId: string,
    completed: boolean,
  ): Promise<FoundationProgress> {
    if (!FOUNDATION_SECTIONS.includes(sectionId as (typeof FOUNDATION_SECTIONS)[number]))
      throw new Error(`Invalid sectionId: ${sectionId}`);
    return this.progressionRepository.upsertFoundationProgress({ userId, sectionId, completed });
  }

  // ── Radical Progress ─────────────────────────────────────────────────────

  /**
   * Get all radical progress records for a user.
   * @param userId
   */
  async getRadicalProgress(userId: string): Promise<RadicalProgress[]> {
    return this.progressionRepository.findRadicalProgressByUser(userId);
  }

  /**
   * Get radical progress for a specific radical by ID.
   * @param userId
   * @param radicalId
   */
  async getRadicalProgressById(userId: string, radicalId: string): Promise<RadicalProgress | null> {
    return this.progressionRepository.findRadicalProgressByUserAndRadicalId(userId, radicalId);
  }

  /**
   * Upsert a radical progress record.
   * Validates radicalId against content data, then upserts.
   *
   * @param userId
   * @param radicalId - e.g. "rad_0001"
   * @param data
   */
  async upsertRadicalProgress(
    userId: string,
    radicalId: string,
    { memorized = false, recognitionLevel = 0 }: RadicalProgressData,
  ): Promise<RadicalProgress> {
    // Validate radicalId exists in the Radical reference table (all-in-DB).
    // Replaces the former fs.existsSync check on content/radicals/<id>.json —
    // those per-radical files never existed, so every upsert threw (latent bug).
    const radical = await prisma.radical.findUnique({ where: { id: radicalId } });
    if (!radical) {
      throw new Error(`Invalid radicalId: ${radicalId}`);
    }

    const record = await this.progressionRepository.upsertRadicalProgress({
      userId,
      radicalId,
      memorized,
      recognitionLevel,
    });

    return record;
  }
}
