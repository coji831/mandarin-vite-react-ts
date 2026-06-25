/**
 * @file apps/backend/src/modules/review/services/ReviewService.js
 * Review business logic — fetches items from multiple sources,
 * records SRS ratings, and computes next review dates.
 *
 * Data sources (Content Registry):
 *   - Tones: content/tones/tn_*.json
 *   - Pinyin combos: PinyinCombination (Prisma junction table)
 */
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

// ── Extracted item-builders ───────────────────────────────────────────

/**
 * Build a review item from a tone content object + SRS state.
 * Returns null if the item is filtered out by the source filter.
 * @param {Object} tone - Tone data from content/tones/
 * @param {Object|null} srs - SRS record from ReviewItem (or null)
 * @param {Date} now - Current timestamp
 * @param {Date} sevenDaysAgo - 7 days ago for "recent" filter
 * @param {string} source - "due", "recent", or "all"
 * @returns {Object|null}
 */
function buildToneItem(tone, srs, now, sevenDaysAgo, source) {
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
    correctTone: tone.number,
    studyCount: srs?.studyCount || 0,
    correctCount: srs?.correctCount || 0,
    nextReview: nextReview.toISOString(),
    intervalDays: srs?.intervalDays || 1,
  };
}

/**
 * Build a review item from a pinyin combo + SRS state.
 * Returns null if filtered out by the source filter.
 * @param {Object} combo - Pinyin combo from PinyinCombination or fallback
 * @param {Object|null} srs - SRS record from ReviewItem (or null)
 * @param {Date} now - Current timestamp
 * @param {Date} sevenDaysAgo - 7 days ago for "recent" filter
 * @param {string} source - "due", "recent", or "all"
 * @param {string} comboKey - e.g. "b-a" for the combo pair
 * @returns {Object|null}
 */
function buildPinyinItem(combo, srs, now, sevenDaysAgo, source, comboKey) {
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
 * @returns {Promise<Array>}
 */
async function fetchPinyinCombos() {
  return prisma.pinyinCombination.findMany({
    where: { character: { not: null } },
  });
}

export class ReviewService {
  constructor(reviewRepository) {
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
   * @param {string} userId
   * @param {{ source?: string, type?: string, limit?: number }} options
   * @returns {Promise<Array>} shuffled review items with SRS state
   */
  async getReviewItems(userId, { source = "due", type = "", limit = 10 }) {
    const normalizedType = type ? type.replace(/s$/, "") : type;
    const typePrefix = normalizedType || "";

    // Get user's SRS state for all review items
    const srsItems = await this.reviewRepository.findByUserAndTypes(userId, [
      "pinyin-syllable",
      "tone-syllable",
    ]);
    const srsByKey = new Map(srsItems.map((r) => [`${r.itemType}:${r.itemId}`, r]));

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

    // Load content files
    const includePinyin = !typePrefix || typePrefix === "pinyin";
    const includeTones = !typePrefix || typePrefix === "tone";
    const items = [];

    if (includeTones) {
      const tones = await readContentDir("tones");
      for (const tone of tones) {
        const key = `tone-syllable:${String(tone.number)}`;
        const srs = srsByKey.get(key);
        const item = buildToneItem(tone, srs, now, sevenDaysAgo, source);
        if (item) items.push(item);
      }
    }

    if (includePinyin) {
      const combos = await fetchPinyinCombos();
      const seenComboKeys = new Set();

      for (const combo of combos) {
        const initialId = combo.initialId?.replace("init_", "") || combo.initialId;
        const finalId = combo.finalId?.replace("fin_", "") || combo.finalId;
        const comboKey = `${initialId}-${finalId}`;

        if (seenComboKeys.has(comboKey)) continue;
        seenComboKeys.add(comboKey);

        const key = `pinyin-syllable:${comboKey}`;
        const srs = srsByKey.get(key);
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
  async recordRating(userId, { itemType, itemId, rating }) {
    if (!itemType || !itemId || !rating) {
      throw new Error("itemType, itemId, and rating are required");
    }
    if (!["again", "good", "easy"].includes(rating)) {
      throw new Error("rating must be 'again', 'good', or 'easy'");
    }

    const current = await this.reviewRepository.findByUserAndItem(userId, itemType, itemId);

    let intervalDays;
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
    });

    return { nextReview, intervalDays, studyCount: (current?.studyCount || 0) + 1 };
  }

  /**
   * Get all review items from the pinyin-tones pool.
   * Delegates to getReviewItems with source "all".
   * @param {string} userId
   * @param {number} limit - max items to return (default 20)
   * @returns {Promise<Array>} review items with SRS data
   */
  async getPoolReviewItems(userId, limit = 20) {
    return this.getReviewItems(userId, { source: "all", type: "", limit });
  }

  /**
   * Get all Phase 1 review items generated from content files.
   * Delegates to getReviewItems with source "all".
   * @param {string} userId
   * @param {string} typePrefix - "pinyin", "tone", or empty for all
   * @param {number} limit - max items to return
   * @returns {Promise<Array>} review items
   */
  async getAllPhase1Items(userId, typePrefix = "", limit = 10) {
    return this.getReviewItems(userId, { source: "all", type: typePrefix, limit });
  }

  /**
   * Get count of due items.
   */
  async getDueCount(userId, type = "") {
    const normalizedType = type ? type.replace(/s$/, "") : type;
    return this.reviewRepository.countDue(userId, normalizedType || "");
  }
}
