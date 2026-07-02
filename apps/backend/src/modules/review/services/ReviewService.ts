/**
 * @file apps/backend/src/modules/review/services/ReviewService.ts
 * Review business logic — fetches items from multiple sources,
 * records SRS ratings, and computes next review dates.
 *
 * Data sources (Content Registry):
 *   - Tones: content/tones/tn_*.json
 *   - Pinyin combos: PinyinCombination (Prisma junction table)
 */
import type { ReviewItem } from "@prisma/client";
import { createLogger } from "../../../shared/utils/logger.js";
import { prisma } from "../../../shared/infrastructure/database/client.js";
import {
  readContentDir,
  stripToneMarks,
  shuffleArray,
} from "../../../shared/utils/contentUtils.js";

const logger = createLogger("ReviewService");

// Interval progression: simple doubling capped at 60 days
const MAX_INTERVAL = 60;

// ── Types ────────────────────────────────────────────────────────────

/**
 * Review item data with SRS scheduling fields.
 */
interface ReviewItemData {
  itemType: string;
  itemId: string;
  interval: number;
  ease: number;
  dueDate: Date;
  lastReviewed: Date | null;
  studyCount: number;
  correctCount: number;
}

/** A review item as returned by the service (after merging content + SRS state). */
interface ReviewItemOutput {
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

/** SRS record shape from the ReviewItem table. */
interface SrsRecord {
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
interface RatingInput {
  itemType: string;
  itemId: string;
  rating: string;
  source?: string;
}

/** Result returned after recording a rating. */
interface RatingResult {
  nextReview: Date;
  intervalDays: number;
  studyCount: number;
}

/** Options for getReviewItems. */
interface ReviewOptions {
  source?: string;
  type?: string;
  limit?: number;
}

/** Content item shape (from content JSON files). */
interface ContentItem {
  id?: string;
  number?: number;
  mark?: string;
  name?: string;
  name_pinyin?: string;
  example_syllable?: string;
  example_character?: string;
  pitch_description?: string;
  glyph?: string;
  meaning?: string;
  syllable?: string;
  character?: string | null;
  tone?: number;
  metadata?: {
    hsk_characters?: Array<{ glyph: string; meaning?: string }>;
    pronunciation_guide?: string;
  };
  [key: string]: unknown;
}

/** PinyinCombination row shape. */
interface PinyinCombo {
  id: string;
  initialId: string;
  finalId: string;
  tone: number;
  syllable: string;
  character: string | null;
  meaning: string | null;
}

/** Repository interface consumed by ReviewService. */
interface IReviewRepository {
  findByUserAndTypes(userId: string, types: string[]): Promise<SrsRecord[]>;
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
  ): Promise<ReviewItem>;
  countDue(userId: string, type: string): Promise<number>;
}

// ── Extracted item-builders ───────────────────────────────────────────

/**
 * Build a review item from a tone content object + SRS state.
 * Returns null if the item is filtered out by the source filter.
 * @param tone - Tone data from content/tones/
 * @param srs - SRS record from ReviewItem (or null)
 * @param now - Current timestamp
 * @param sevenDaysAgo - 7 days ago for "recent" filter
 * @param source - "due", "recent", or "all"
 */
function buildToneItem(
  tone: ContentItem,
  srs: SrsRecord | null,
  now: Date,
  sevenDaysAgo: Date,
  source: string,
): ReviewItemOutput | null {
  const toneNumber = String(tone.number);
  const nextReview = srs?.nextReview ? new Date(srs.nextReview) : now;
  const lastReviewed = srs?.lastReviewed ? new Date(srs.lastReviewed) : null;

  if (source === "due" && nextReview > now) return null;
  if (source === "recent" && (!lastReviewed || lastReviewed < sevenDaysAgo)) return null;

  return {
    id: srs?.id || `tone-${toneNumber}`,
    itemType: "tone-syllable",
    itemId: toneNumber,
    front: `${tone.mark} ${tone.name}`,
    back: `${tone.example_syllable} (${tone.pitch_description}) — e.g., ${tone.example_character || ""}`,
    category: "tones",
    character: tone.example_character || null,
    meaning: tone.pitch_description || null,
    pinyinPlain: stripToneMarks(tone.example_syllable || ""),
    correctTone: tone.number ?? null,
    studyCount: srs?.studyCount || 0,
    correctCount: srs?.correctCount || 0,
    nextReview: nextReview.toISOString(),
    intervalDays: srs?.intervalDays || 1,
  };
}

/**
 * Build a review item from a pinyin combo + SRS state.
 * Returns null if filtered out by the source filter.
 * @param combo - Pinyin combo from PinyinCombination or fallback
 * @param srs - SRS record from ReviewItem (or null)
 * @param now - Current timestamp
 * @param sevenDaysAgo - 7 days ago for "recent" filter
 * @param source - "due", "recent", or "all"
 * @param comboKey - e.g. "b-a" for the combo pair
 */
function buildPinyinItem(
  combo: PinyinCombo,
  srs: SrsRecord | null,
  now: Date,
  sevenDaysAgo: Date,
  source: string,
  comboKey: string,
): ReviewItemOutput | null {
  const nextReview = srs?.nextReview ? new Date(srs.nextReview) : now;
  const lastReviewed = srs?.lastReviewed ? new Date(srs.lastReviewed) : null;

  if (source === "due" && nextReview > now) return null;
  if (source === "recent" && (!lastReviewed || lastReviewed < sevenDaysAgo)) return null;

  return {
    id: srs?.id || `pinyin-${comboKey}`,
    itemType: "pinyin-syllable",
    itemId: comboKey,
    front: combo.syllable,
    back: `${combo.character || combo.syllable} (${combo.syllable}) — ${combo.meaning || "no definition"}`,
    category: "pinyin",
    character: combo.character || null,
    pinyinPlain: stripToneMarks(combo.syllable),
    correctTone: combo.tone,
    meaning: combo.meaning || null,
    studyCount: srs?.studyCount || 0,
    correctCount: srs?.correctCount || 0,
    nextReview: nextReview.toISOString(),
    intervalDays: srs?.intervalDays || 1,
  };
}

/**
 * Get all available pinyin combos from the PinyinCombination junction table.
 */
async function fetchPinyinCombos(): Promise<PinyinCombo[]> {
  return prisma.pinyinCombination.findMany({
    where: { character: { not: null } },
  }) as Promise<PinyinCombo[]>;
}

/**
 * Build a review item from a radical content object + SRS state.
 * Returns null if filtered out by the source filter.
 * Includes multiple-choice options (correct meaning + distractors).
 * @param radical - Radical data from content/radicals/
 * @param srs - SRS record from ReviewItem (or null)
 * @param now - Current timestamp
 * @param sevenDaysAgo - 7 days ago for "recent" filter
 * @param source - "due", "recent", or "all"
 * @param allRadicals - Full radical pool for distractor selection
 */
function buildRadicalItem(
  radical: ContentItem,
  srs: SrsRecord | null,
  now: Date,
  sevenDaysAgo: Date,
  source: string,
  allRadicals?: ContentItem[],
): ReviewItemOutput | null {
  const nextReview = srs?.nextReview ? new Date(srs.nextReview) : now;
  const lastReviewed = srs?.lastReviewed ? new Date(srs.lastReviewed) : null;

  if (source === "due" && nextReview > now) return null;
  if (source === "recent" && (!lastReviewed || lastReviewed < sevenDaysAgo)) return null;

  // Build multiple-choice options: 1 correct + 2 distractors
  const distractors = Array.isArray(allRadicals)
    ? shuffleArray(allRadicals.filter((r) => r.id !== radical.id))
        .slice(0, 2)
        .map((r) => ({ glyph: r.glyph!, meaning: r.meaning!, id: r.id! }))
    : [];

  const correctOption = { glyph: radical.glyph!, meaning: radical.meaning!, id: radical.id! };
  const options = shuffleArray([correctOption, ...distractors]);

  return {
    id: srs?.id || `radical-${radical.id}`,
    itemType: "radical",
    itemId: radical.id!,
    front: radical.name_pinyin!,
    back: `${radical.glyph} (${radical.name_pinyin}) — ${radical.meaning}`,
    category: "radicals",
    character: radical.glyph!,
    pinyinPlain: radical.id!,
    correctTone: null,
    meaning: radical.meaning || null,
    options,
    studyCount: srs?.studyCount || 0,
    correctCount: srs?.correctCount || 0,
    nextReview: nextReview.toISOString(),
    intervalDays: srs?.intervalDays || 1,
  };
}

/**
 * Build a review item from a radical's hsk_characters entry + SRS state.
 * For each character in the radical's hsk_characters array, generates an item
 * asking "which radical gives this character its meaning".
 * Returns null if filtered out by the source filter.
 * @param radical - Radical data from content/radicals/
 * @param charData - Character data from radical.metadata.hsk_characters[]
 * @param srs - SRS record from ReviewItem (or null)
 * @param now - Current timestamp
 * @param sevenDaysAgo - 7 days ago for "recent" filter
 * @param source - "due", "recent", or "all"
 */
function buildCharacterRadicalItem(
  radical: ContentItem,
  charData: { glyph: string; meaning?: string },
  srs: SrsRecord | null,
  now: Date,
  sevenDaysAgo: Date,
  source: string,
): ReviewItemOutput | null {
  const charGlyph = charData.glyph;
  const itemId = charGlyph;
  const nextReview = srs?.nextReview ? new Date(srs.nextReview) : now;
  const lastReviewed = srs?.lastReviewed ? new Date(srs.lastReviewed) : null;

  if (source === "due" && nextReview > now) return null;
  if (source === "recent" && (!lastReviewed || lastReviewed < sevenDaysAgo)) return null;

  return {
    id: srs?.id || `character-radical-${itemId}`,
    itemType: "character-radical",
    itemId,
    front: charGlyph,
    back: `${radical.glyph} (${radical.meaning})`,
    category: "radicals",
    character: charGlyph,
    pinyinPlain: radical.id || "",
    correctTone: null,
    meaning: charData.meaning || null,
    radicalId: radical.id,
    radicalGlyph: radical.glyph,
    studyCount: srs?.studyCount || 0,
    correctCount: srs?.correctCount || 0,
    nextReview: nextReview.toISOString(),
    intervalDays: srs?.intervalDays || 1,
  };
}

export class ReviewService {
  private reviewRepository: IReviewRepository;

  constructor(reviewRepository: IReviewRepository) {
    this.reviewRepository = reviewRepository;
  }

  /**
   * Get review items from the specified source.
   *
   * Reads ALL available items from content/ files + PinyinCombination (the canonical source),
   * then LEFT JOINs with ReviewItem table for SRS state. No pre-seeding is performed —
   * ReviewItem records are created only on recordRating() via upsert.
   *
   * Source filters:
   *   - "due": No ReviewItem record exists (new) OR nextReview <= now
   *   - "recent": lastReviewed within 7 days
   *   - "all": Skip filter — return everything
   *
   * @param userId
   * @param options
   * @returns shuffled review items with SRS state
   */
  async getReviewItems(
    userId: string,
    { source = "due", type = "", limit = 10 }: ReviewOptions = {},
  ): Promise<ReviewItemOutput[]> {
    const normalizedType = type ? type.replace(/s$/, "") : type;
    const typePrefix = normalizedType || "";

    // Get user's SRS state for all review items
    const srsItems = await this.reviewRepository.findByUserAndTypes(userId, [
      "pinyin-syllable",
      "tone-syllable",
      "radical",
      "character-radical",
    ]);
    const srsByKey = new Map(srsItems.map((r: SrsRecord) => [`${r.itemType}:${r.itemId}`, r]));

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

    // Load content files
    const includePinyin = !typePrefix || typePrefix === "pinyin";
    const includeTones = !typePrefix || typePrefix === "tone";
    const includeRadicals = !typePrefix || typePrefix === "radical";
    const includeCharacterRadical = !typePrefix || typePrefix === "char";
    const items: ReviewItemOutput[] = [];

    if (includeTones) {
      const tones = await readContentDir("tones");
      for (const tone of tones) {
        const key = `tone-syllable:${String(tone.number)}`;
        const srs = (srsByKey.get(key) as SrsRecord | undefined) ?? null;
        const item = buildToneItem(tone as unknown as ContentItem, srs, now, sevenDaysAgo, source);
        if (item) items.push(item);
      }
    }

    if (includeRadicals) {
      const radicals = await readContentDir("radicals");
      for (const radical of radicals) {
        const key = `radical:${radical.id}`;
        const srs = (srsByKey.get(key) as SrsRecord | undefined) ?? null;
        const item = buildRadicalItem(
          radical as unknown as ContentItem,
          srs,
          now,
          sevenDaysAgo,
          source,
          radicals as unknown as ContentItem[],
        );
        if (item) items.push(item);
      }
    }

    if (includeCharacterRadical) {
      const radicals = await readContentDir("radicals");
      for (const radical of radicals) {
        const metadata = (radical as Record<string, unknown>).metadata as
          Record<string, unknown> | undefined;
        const hskCharacters =
          (metadata?.hsk_characters as Array<{ glyph: string; meaning?: string }> | undefined) ||
          [];
        if (hskCharacters.length === 0) continue;
        for (const charData of hskCharacters) {
          const key = `character-radical:${charData.glyph}`;
          const srs = (srsByKey.get(key) as SrsRecord | undefined) ?? null;
          const item = buildCharacterRadicalItem(
            radical as unknown as ContentItem,
            charData,
            srs,
            now,
            sevenDaysAgo,
            source,
          );
          if (item) items.push(item);
        }
      }
    }

    if (includePinyin) {
      const combos = await fetchPinyinCombos();
      const seenComboKeys = new Set<string>();

      for (const combo of combos) {
        const initialId = combo.initialId?.replace("init_", "") || combo.initialId;
        const finalId = combo.finalId?.replace("fin_", "") || combo.finalId;
        const comboKey = `${initialId}-${finalId}`;

        if (seenComboKeys.has(comboKey)) continue;
        seenComboKeys.add(comboKey);

        const key = `pinyin-syllable:${comboKey}`;
        const srs = (srsByKey.get(key) as SrsRecord | undefined) ?? null;
        const item = buildPinyinItem(combo, srs, now, sevenDaysAgo, source, comboKey);
        if (item) items.push(item);
      }
    }

    return shuffleArray(items).slice(0, limit);
  }

  /**
   * Record a rating for a review item and compute next review date.
   * Simple SRS: again=reset to 1d, good=double, easy=triple, capped at MAX_INTERVAL.
   */
  async recordRating(
    userId: string,
    { itemType, itemId, rating, source }: RatingInput,
  ): Promise<RatingResult> {
    if (!itemType || !itemId || !rating) {
      throw new Error("itemType, itemId, and rating are required");
    }
    if (!["again", "good", "easy"].includes(rating)) {
      throw new Error("rating must be 'again', 'good', or 'easy'");
    }
    if (source && !["due", "recent", "all", "viewed"].includes(source)) {
      const validSources = ["due", "recent", "all", "viewed"];
      throw new Error(
        `Failed to record rating: source must be one of '${validSources.join("', '")}'`,
      );
    }

    const current = await this.reviewRepository.findByUserAndItem(userId, itemType, itemId);

    let intervalDays: number = 1;
    switch (rating) {
      case "again":
        intervalDays = 1;
        break;
      case "good":
        intervalDays = Math.min((current?.intervalDays || 1) * 2, MAX_INTERVAL);
        break;
      case "easy":
        intervalDays = Math.min((current?.intervalDays || 1) * 3, MAX_INTERVAL);
        break;
    }

    const nextReview = new Date(Date.now() + intervalDays * 86400000);

    // If "again", it's marked as incorrect (doesn't increment correctCount)
    const correctCount = (current?.correctCount || 0) + (rating !== "again" ? 1 : 0);

    await this.reviewRepository.upsert(userId, itemType, itemId, {
      studyCount: (current?.studyCount || 0) + 1,
      correctCount,
      lastReviewed: new Date(),
      nextReview,
      intervalDays,
      source: source || "viewed",
    });

    return { nextReview, intervalDays, studyCount: (current?.studyCount || 0) + 1 };
  }

  /**
   * Get all Phase 1 review items generated from content files.
   * Delegates to getReviewItems with source "all".
   * @param userId
   * @param typePrefix - "pinyin", "tone", or empty for all
   * @param limit - max items to return
   */
  async getAllPhase1Items(
    userId: string,
    typePrefix: string = "",
    limit: number = 10,
  ): Promise<ReviewItemOutput[]> {
    return this.getReviewItems(userId, { source: "all", type: typePrefix, limit });
  }

  /**
   * Get count of due items.
   */
  async getDueCount(userId: string, type: string = ""): Promise<number> {
    const normalizedType = type ? type.replace(/s$/, "") : type;
    return this.reviewRepository.countDue(userId, normalizedType || "");
  }
}
