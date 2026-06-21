/**
 * @file apps/backend/src/modules/review/services/ReviewService.js
 * Review business logic — fetches items from multiple sources,
 * records SRS ratings, and computes next review dates.
 */
import { createLogger } from "../../../shared/utils/logger.js";
import { readStaticReference } from "../../../shared/infrastructure/data/readStaticReference.js";

const logger = createLogger("ReviewService");

// Interval progression: simple doubling capped at 60 days
const MAX_INTERVAL = 60;

// Phase 1 item types and their display metadata
const ITEM_TYPE_MAP = {
  "pinyin-initial": { label: "Pinyin Initials", icon: "🔤" },
  "pinyin-final": { label: "Pinyin Finals", icon: "🔤" },
  "pinyin-combination": { label: "Pinyin Combinations", icon: "🔤" },
  "tone-identification": { label: "Tone Identification", icon: "🎵" },
  "tone-pair": { label: "Tone Pairs", icon: "🎵" },
  "tone-rule": { label: "Tone Change Rules", icon: "🎵" },
  "stroke-reference": { label: "Stroke Reference", icon: "✏️" },
};

export class ReviewService {
  constructor(reviewRepository) {
    this.reviewRepository = reviewRepository;
  }

  /**
   * Get review items from the specified source.
   */
  async getReviewItems(userId, { source = "due", type = "", limit = 20 }) {
    const typePrefix = type || ""; // empty = all types

    switch (source) {
      case "due":
        return this.reviewRepository.findDueItems(userId, typePrefix, limit);
      case "recent":
        return this.reviewRepository.findRecentItems(userId, typePrefix, limit);
      case "all":
        return this.getAllPhase1Items(userId, typePrefix, limit);
      default:
        return this.reviewRepository.findDueItems(userId, typePrefix, limit);
    }
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
   * Get review items generated from the pinyin-tones pool.
   * Returns items that the user hasn't fully mastered yet.
   * @param {string} userId
   * @param {number} limit - max items to return (default 20)
   * @returns {Promise<Array>} review items with SRS data
   */
  async getPoolReviewItems(userId, limit = 20) {
    const pool = await readStaticReference("foundations/pinyin-tones-pool.json");

    // Get user's existing review items for pinyin/tones
    const existingItems = await this.reviewRepository.findByUserAndTypes(userId, [
      "pinyin-syllable",
      "tone-syllable",
    ]);
    const existingKeys = new Set(existingItems.map((r) => `${r.itemType}:${r.itemId}`));

    // Generate new candidates from the pool
    const candidates = [];

    // Add initials as review items
    for (const initial of pool.initials) {
      if (!existingKeys.has(`pinyin-syllable:${initial.id}`)) {
        candidates.push({
          itemType: "pinyin-syllable",
          itemId: initial.id,
          front: initial.pinyin,
          back: `${initial.pinyin} — ${initial.description}`,
          category: "pinyin",
        });
      }
    }

    // Add finals as review items
    for (const final of pool.finals) {
      if (!existingKeys.has(`pinyin-syllable:${final.id}`)) {
        candidates.push({
          itemType: "pinyin-syllable",
          itemId: final.id,
          front: final.pinyin,
          back: `${final.pinyin} — ${final.description}`,
          category: "pinyin",
        });
      }
    }

    // Add tone examples as review items
    for (const tone of pool.toneInfo) {
      if (!existingKeys.has(`tone-syllable:${tone.number}`)) {
        candidates.push({
          itemType: "tone-syllable",
          itemId: String(tone.number),
          front: `${tone.mark}${tone.name}`,
          back: `${tone.pinyinExample} (${tone.description}) — e.g., ${tone.chineseExample}`,
          category: "tones",
        });
      }
    }

    // Save new candidates to Prisma
    const newItems = [];
    for (const candidate of candidates) {
      const saved = await this.reviewRepository.create({
        userId,
        itemType: candidate.itemType,
        itemId: candidate.itemId,
        front: candidate.front,
        back: candidate.back,
        category: candidate.category,
        studyCount: 0,
        correctCount: 0,
        intervalDays: 1,
        nextReview: new Date(),
      });
      newItems.push(saved);
    }

    // Return due items (mix of existing + new)
    const allItems = [...existingItems, ...newItems];
    const now = new Date();
    const dueItems = allItems
      .filter((item) => new Date(item.nextReview) <= now)
      .sort((a, b) => new Date(a.nextReview) - new Date(b.nextReview))
      .slice(0, limit);

    return dueItems;
  }

  /**
   * Update review item after a study session (SRS algorithm).
   * Simple interval doubling: again=reset, good=double, easy=triple.
   * Cap at 60 days.
   */
  async rateReviewItem(itemId, rating) {
    const item = await this.reviewRepository.findById(itemId);
    if (!item) throw new Error(`Review item not found: ${itemId}`);

    let newInterval;
    switch (rating) {
      case "again":
        newInterval = 1;
        break;
      case "good":
        newInterval = Math.min(item.intervalDays * 2, MAX_INTERVAL);
        break;
      case "easy":
        newInterval = Math.min(item.intervalDays * 3, MAX_INTERVAL);
        break;
      default:
        newInterval = item.intervalDays;
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newInterval);

    return this.reviewRepository.update(itemId, {
      studyCount: item.studyCount + 1,
      correctCount: rating === "again" ? item.correctCount : item.correctCount + 1,
      intervalDays: newInterval,
      nextReview,
      lastReviewed: new Date(),
    });
  }

  /**
   * Get all Phase 1 items generated from the shared pinyin-tones pool.
   * Creates review items in the database if they don't already exist.
   * @param {string} userId
   * @param {string} typePrefix - "pinyin", "tone", or empty for all
   * @param {number} limit - max items to return
   * @returns {Promise<Array>} review items
   */
  async getAllPhase1Items(userId, typePrefix = "", limit = 20) {
    const pool = await readStaticReference("foundations/pinyin-tones-pool.json");

    // Get user's existing review items for pinyin/tones
    const existingItems = await this.reviewRepository.findByUserAndTypes(userId, [
      "pinyin-syllable",
      "tone-syllable",
    ]);
    const existingKeys = new Set(existingItems.map((r) => `${r.itemType}:${r.itemId}`));

    // Determine which categories to include based on typePrefix
    const includePinyin = !typePrefix || typePrefix === "pinyin";
    const includeTones = !typePrefix || typePrefix === "tone";

    // Generate new candidates from the pool
    const candidates = [];

    if (includePinyin) {
      for (const initial of pool.initials) {
        if (!existingKeys.has(`pinyin-syllable:${initial.id}`)) {
          candidates.push({
            userId,
            itemType: "pinyin-syllable",
            itemId: initial.id,
            front: initial.pinyin,
            back: `${initial.pinyin} — ${initial.description}`,
            category: "pinyin",
            studyCount: 0,
            correctCount: 0,
            intervalDays: 1,
            nextReview: new Date(),
          });
        }
      }
      for (const fin of pool.finals) {
        if (!existingKeys.has(`pinyin-syllable:${fin.id}`)) {
          candidates.push({
            userId,
            itemType: "pinyin-syllable",
            itemId: fin.id,
            front: fin.pinyin,
            back: `${fin.pinyin} — ${fin.description}`,
            category: "pinyin",
            studyCount: 0,
            correctCount: 0,
            intervalDays: 1,
            nextReview: new Date(),
          });
        }
      }
    }

    if (includeTones) {
      for (const tone of pool.toneInfo) {
        if (!existingKeys.has(`tone-syllable:${tone.number}`)) {
          candidates.push({
            userId,
            itemType: "tone-syllable",
            itemId: String(tone.number),
            front: `${tone.mark} ${tone.name}`,
            back: `${tone.pinyinExample} (${tone.description}) — e.g., ${tone.chineseExample}`,
            category: "tones",
            studyCount: 0,
            correctCount: 0,
            intervalDays: 1,
            nextReview: new Date(),
          });
        }
      }
    }

    // Save new candidates to Prisma
    const newItems = [];
    for (const candidate of candidates) {
      const saved = await this.reviewRepository.create(candidate);
      newItems.push(saved);
    }

    // Combine and shuffle
    const allItems = [...existingItems, ...newItems];
    for (let i = allItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allItems[i], allItems[j]] = [allItems[j], allItems[i]];
    }

    return allItems.slice(0, limit);
  }

  /**
   * Get count of due items.
   */
  async getDueCount(userId, type = "") {
    return this.reviewRepository.countDue(userId, type || "");
  }
}
