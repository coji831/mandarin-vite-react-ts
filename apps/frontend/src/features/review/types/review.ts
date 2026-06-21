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
  | "tone-syllable";

/** Rating options for SRS review */
export type Rating = "again" | "good" | "easy";

/** Source of review items */
export type ReviewSource = "due" | "recent" | "all";

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
