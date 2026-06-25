/**
 * @file types/index.ts
 * @description Type definitions for the Foundations feature
 * Story 18.1: Foundations Page Structure
 * Story 18.2: Pinyin System Guide
 * Story 18.3: Tones Reference & Practice
 *
 * FoundationProgress and PhaseGate are defined in @mandarin/shared-types
 * for cross-package consumption (frontend + backend).
 */

export type { FoundationProgress, PhaseGate } from "@mandarin/shared-types";
export type {
  PinyinTonesPool,
  PinyinInitial,
  PinyinFinal,
  PinyinCombination,
  ToneDefinition,
  TonePairDrill,
  ToneRule,
  ToneRuleExample,
} from "./pool";

export type { PinyinData, BasicStroke, StrokeOrderRule, StrokeData, ToneData } from "./foundations";
