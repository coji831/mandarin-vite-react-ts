/**
 * @file apps/backend/src/modules/review/types/review.ts
 * @description Type definitions for the Review module
 */

import type { SrsCardState } from "@prisma/client";
import type { ContentFile } from "../../../shared/utils/contentUtils.js";

/** A review item as returned by the service (after merging content + SRS state). */
export interface ReviewItemOutput {
  id: string;
  itemType: string;
  itemId: string;
  front: string;
  back: string;
  category: string;
  character: string | null;
  meaning: string | null;
  pinyinPlain: string;
  correctTone: number | null;
  studyCount: number;
  correctCount: number;
  nextReview: string;
  intervalDays: number;
  options?: Array<{ glyph: string; meaning: string; id: string }>;
  radicalId?: string;
  radicalGlyph?: string;
}

/**
 * Repository interface consumed by ReviewService.
 *
 * P0-1 stopgap (Story 24-1): `findByUserAndTypes`/`countDue` accept
 * `userId: string | undefined` and MUST reject `undefined` before any Prisma
 * call (Prisma drops `undefined` where-keys, which would leak every user's
 * rows). The implementation returns empty / 0 for `undefined`.
 */
export interface IReviewRepository {
  findByUserAndTypes(userId: string | undefined, types: string[]): Promise<SrsRecord[]>;
  findByUserAndItem(userId: string, itemType: string, itemId: string): Promise<SrsRecord | null>;
  upsert(
    userId: string,
    itemType: string,
    itemId: string,
    data: {
      studyCount: number;
      correctCount: number;
      lastReviewed: Date;
      nextReview: Date;
      intervalDays: number;
      source: string;
    },
  ): Promise<SrsCardState>;
  countDue(userId: string | undefined, type: string): Promise<number>;
}

/** SRS record shape from the ReviewItem table. */
export interface SrsRecord {
  id: string;
  itemType: string;
  itemId: string;
  studyCount: number;
  correctCount: number;
  lastReviewed: Date | null;
  nextReview: Date;
  intervalDays: number;
}

/** Rating input for recordRating. */
export interface RatingInput {
  itemType: string;
  itemId: string;
  rating: string;
  source?: string;
}

/** Result returned after recording a rating. */
export interface RatingResult {
  nextReview: Date;
  intervalDays: number;
  studyCount: number;
}

/** Options for getReviewItems. */
export interface ReviewOptions {
  source?: string;
  type?: string;
  limit?: number;
}

/** Content item shape (from content JSON files). Re-exported from ContentFile for backward compatibility. */
export type ContentItem = ContentFile;

/** PinyinCombination row shape. */
export interface PinyinCombo {
  id: string;
  initialId: string;
  finalId: string;
  tone: number;
  syllable: string;
  character: string | null;
  meaning: string | null;
}
