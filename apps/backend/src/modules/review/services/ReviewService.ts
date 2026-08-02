/**
 * @file apps/backend/src/modules/review/services/ReviewService.ts
 * Review business logic — fetches items from multiple sources,
 * records SRS ratings, and computes next review dates.
 *
 * Data sources (all-in-DB):
 *   - Tones: Tone table
 *   - Radicals: Radical table
 *   - Pinyin combos: PinyinSyllable (Prisma junction table)
 */
import type { Tone } from "@prisma/client";
import { prisma } from "../../../shared/infrastructure/database/client.js";
import { stripToneMarks, shuffleArray } from "../../../shared/utils/contentUtils.js";
import type {
  ContentItem,
  IReviewRepository,
  RatingInput,
  RatingResult,
  ReviewItemOutput,
  ReviewOptions,
  SrsRecord,
} from "../types/review.js";

// Interval progression: simple doubling capped at 60 days
const MAX_INTERVAL = 60;

// ── Extracted item-builders ───────────────────────────────────────────

/**
 * Build a review item from a tone row (Tone table) + SRS state.
 * Returns null if the item is filtered out by the source filter.
 * @param tone - Tone data from the Tone table (camelCase fields)
 * @param srs - SRS record from ReviewItem (or null)
 * @param now - Current timestamp
 * @param sevenDaysAgo - 7 days ago for "recent" filter
 * @param source - "due", "recent", or "all"
 */
function buildToneItem(
  tone: Tone,
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
    back: `${tone.exampleSyllable} (${tone.pitchDescription}) — e.g., ${tone.exampleCharacter || ""}`,
    category: "tones",
    character: tone.exampleCharacter || null,
    meaning: tone.pitchDescription || null,
    pinyinPlain: stripToneMarks(tone.exampleSyllable || ""),
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
  combo: {
    id: string;
    initialId: string;
    finalId: string;
    tone: number;
    syllable: string;
    character: string | null;
    meaning: string | null;
  },
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
 * Get all available pinyin syllables with character mappings (replaces deprecated PinyinCombination).
 */
async function fetchPinyinCombos() {
  return prisma.pinyinSyllable.findMany({
    where: { isStandard: true },
    include: {
      characterMappings: {
        include: { character: { select: { glyph: true } } },
        take: 1,
      },
    },
  });
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

  // Prefer camelCase namePinyin (radicals.json) over snake_case name_pinyin (tones.json)
  const radicalName = String(radical["namePinyin"] ?? radical.name_pinyin ?? "");

  return {
    id: srs?.id || `radical-${radical.id}`,
    itemType: "radical",
    itemId: radical.id!,
    front: radicalName,
    back: `${radical.glyph} (${radicalName}) — ${radical.meaning}`,
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
      const tones = await prisma.tone.findMany({ orderBy: { number: "asc" } });
      for (const tone of tones) {
        const key = `tone-syllable:${String(tone.number)}`;
        const srs = srsByKey.get(key) ?? null;
        const item = buildToneItem(tone, srs, now, sevenDaysAgo, source);
        if (item) items.push(item);
      }
    }

    if (includeRadicals) {
      const radicals = await prisma.radical.findMany();
      for (const radical of radicals) {
        const key = `radical:${radical.id}`;
        const srs = srsByKey.get(key) ?? null;
        const item = buildRadicalItem(radical, srs, now, sevenDaysAgo, source, radicals);
        if (item) items.push(item);
      }
    }

    if (includeCharacterRadical) {
      const dbRecords = await prisma.characterRadical.findMany({
        include: {
          character: { select: { glyph: true, definition: true } },
        },
      });

      // Group records by radicalId
      const radicalCharMap = new Map<
        string,
        Array<{
          characterGlyph: string;
          character?: { glyph: string; definition: string | null } | null;
        }>
      >();
      for (const record of dbRecords) {
        if (!radicalCharMap.has(record.radicalId)) {
          radicalCharMap.set(record.radicalId, []);
        }
        radicalCharMap.get(record.radicalId)!.push(record);
      }

      const radicals = await prisma.radical.findMany();
      const radicalById = new Map(radicals.map((r) => [r.id, r]));

      for (const [radicalId, records] of radicalCharMap) {
        const radical = radicalById.get(radicalId);
        if (!radical) continue;
        for (const record of records) {
          const charGlyph = record.characterGlyph;
          const key = `character-radical:${charGlyph}`;
          const srs = srsByKey.get(key) ?? null;
          const charData = { glyph: charGlyph, meaning: record.character?.definition ?? undefined };
          const item = buildCharacterRadicalItem(radical, charData, srs, now, sevenDaysAgo, source);
          if (item) items.push(item);
        }
      }
    }

    if (includePinyin) {
      const combos = await fetchPinyinCombos();
      const seenComboKeys = new Set<string>();

      for (const combo of combos) {
        const initial = combo.initial || "";
        const final = combo.final || "";
        const comboKey = `${initial}-${final}`;

        if (seenComboKeys.has(comboKey)) continue;
        seenComboKeys.add(comboKey);

        // Extract character and meaning from first character mapping, if available
        const firstMapping = combo.characterMappings?.[0];
        const characterGlyph = firstMapping?.character?.glyph ?? null;
        const meaning = null; // PinyinSyllable doesn't carry meaning directly

        const adapter = {
          id: combo.id,
          initialId: initial,
          finalId: final,
          tone: combo.tone,
          syllable: combo.syllable,
          character: characterGlyph,
          meaning,
        };

        const key = `pinyin-syllable:${comboKey}`;
        const srs = srsByKey.get(key) ?? null;
        const item = buildPinyinItem(adapter, srs, now, sevenDaysAgo, source, comboKey);
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
