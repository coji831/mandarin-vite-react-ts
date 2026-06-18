/**
 * @file types/index.ts
 * @description Type definitions for the Foundations feature
 * Story 18.1: Foundations Page Structure
 * Story 18.2: Pinyin System Guide
 *
 * FoundationProgress and PhaseGate are defined in @mandarin/shared-types
 * for cross-package consumption (frontend + backend).
 */

export type { FoundationProgress, PhaseGate } from "@mandarin/shared-types";

/**
 * PinyinInitial: A single pinyin initial (声母)
 */
export interface PinyinInitial {
  id: string;
  pinyin: string;
  ipa: string;
  description: string;
}

/**
 * PinyinFinal: A single pinyin final (韵母)
 */
export interface PinyinFinal {
  id: string;
  pinyin: string;
  type: "simple" | "compound" | "nasal";
  description: string;
}

/**
 * PinyinCombination: A valid initial+final combination with all tone forms
 */
export interface PinyinCombination {
  initial: string;
  final: string;
  tones: string[];
}

/**
 * PinyinData: The top-level shape of the pinyin.json data file
 */
export interface PinyinData {
  initials: PinyinInitial[];
  finals: PinyinFinal[];
  combinations: PinyinCombination[];
}
