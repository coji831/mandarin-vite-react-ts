/**
 * @file apps/backend/src/modules/progression/types/progression.ts
 * @description Type definitions for the Progression module
 */

import type { FoundationProgress, RadicalProgress, PhaseGate } from "@prisma/client";

/**
 * Repository interface consumed by ProgressionService.
 */
export interface IProgressionRepository {
  findFoundationProgressByUser(userId: string): Promise<FoundationProgress[]>;
  createFoundationProgress(data: {
    userId: string;
    sectionId: string;
    completed: boolean;
  }): Promise<FoundationProgress>;
  findPhaseGateByUser(userId: string): Promise<PhaseGate | null>;
  createPhaseGate(data: {
    userId: string;
    currentPhase: number;
    phase1Passed: boolean;
    phase2Passed: boolean;
    phase3Passed: boolean;
    phase4Unlocked: boolean;
    gateCriteria: string | null;
  }): Promise<PhaseGate>;
  updatePhaseGate(userId: string, data: Record<string, unknown>): Promise<PhaseGate>;
  upsertFoundationProgress(data: {
    userId: string;
    sectionId: string;
    completed: boolean;
  }): Promise<FoundationProgress>;
  findRadicalProgressByUser(userId: string): Promise<RadicalProgress[]>;
  findRadicalProgressByUserAndRadicalId(
    userId: string,
    radicalId: string,
  ): Promise<RadicalProgress | null>;
  upsertRadicalProgress(data: {
    userId: string;
    radicalId: string;
    memorized: boolean;
    recognitionLevel: number;
  }): Promise<RadicalProgress>;
}
