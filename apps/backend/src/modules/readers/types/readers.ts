/**
 * @file apps/backend/src/modules/readers/types/readers.ts
 * @description Type definitions for the Readers (Graded Readers) module.
 *
 * Clean Architecture: Domain types (entities, value objects).
 */

/** A single word segment produced by the segmenter. */
export interface WordSegment {
  text: string;
  wordId: string | null;
  start: number;
  end: number;
}

/** HSK profile for a passage — computed after segmentation. */
export interface HskProfile {
  distribution: Record<number, number>;
  unknownRatio: number;
  knownWordRatio: number;
  totalWords: number;
}

/** Passage as stored in the database. */
export interface PassageRecord {
  id: string;
  hskLevel: number;
  passageIndex: number;
  title: string;
  content: PassageContent;
  wordCount: number;
  knownWordRatio: number;
  targetHskLevel: number;
  generatedById: string | null;
  generatedAt: Date;
  accessCount: number;
  lastAccessedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Passage content JSON structure. */
export interface PassageContent {
  sentences: PassageSentence[];
  metadata?: Record<string, unknown>;
}

/** A single sentence within a passage. */
export interface PassageSentence {
  index: number;
  text: string;
}

/** Input for creating a new passage. */
export interface CreatePassageInput {
  hskLevel: number;
  passageIndex: number;
  title: string;
  content: PassageContent;
  wordCount: number;
  knownWordRatio: number;
  targetHskLevel: number;
  generatedById: string;
}
