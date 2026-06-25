/** Review item types for Phase 1 content */
export type ReviewItemType =
  | "pinyin-initial"
  | "pinyin-final"
  | "pinyin-combination"
  | "tone-identification"
  | "tone-pair"
  | "tone-rule"
  | "stroke-reference"
  | "pinyin-syllable"
  | "tone-syllable"
  | "vocabulary";

/** Rating options for SRS review */
export type Rating = "again" | "good" | "easy";

/** Source of review items */
export type ReviewSource = "due" | "recent" | "all";

/** Phase in the three-step active recall flow. */
export type ReviewStep = "pick" | "pinyin" | "tone" | "result" | "complete";

/** Accumulated session results shown on the completion screen. */
export interface ReviewSessionResult {
  totalItems: number;
  pinyinCorrect: number;
  pinyinTotal: number;
  toneCorrect: number;
  toneTotal: number;
  ratings: { easy: number; good: number; again: number };
}

/** A single review item (from API or generated) */
export interface ReviewItem {
  id: string;
  itemType: ReviewItemType;
  itemId: string;
  front: string;
  back: string;
  category?: string;
  nextReview?: string;
  intervalDays?: number;
  /** The hanzi character for display (falls back to `front`) */
  character?: string;
  /** Pinyin without tone marks (e.g., "hao") */
  pinyinPlain?: string;
  /** Correct tone number (0-4) */
  correctTone?: number;
  /** English meaning */
  meaning?: string;
}

/** Result of recording a rating */
export interface RatingResult {
  nextReview: string;
  intervalDays: number;
  studyCount: number;
}

/** A content type group shown in the picker */
export interface ContentTypeGroup {
  type: string;
  label: string;
  icon: string;
  description: string;
}
