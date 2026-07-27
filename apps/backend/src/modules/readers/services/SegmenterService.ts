/**
 * @file apps/backend/src/modules/readers/services/SegmenterService.ts
 * @description Chinese word segmenter using longest-match against the word index.
 *
 * Clean Architecture: Service layer — pure business logic with cache integration.
 * Loads the word index at construction time and performs longest-match segmentation.
 * Results are cached keyed by SHA-256 hash of the input text.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createLogger } from "../../../shared/utils/logger.js";
import { SegmenterError } from "../types/readers-errors.js";
import type { WordSegment, HskProfile } from "../types/readers.js";
import type { CacheService } from "../../../shared/infrastructure/cache/CacheService.js";

const logger = createLogger("SegmenterService");

/** Regex matching non-Chinese characters (spaces, punctuation, digits, etc.). */
const NON_CHINESE_REGEX =
  /[^\u4e00-\u9fff\u3400-\u4dbf\u2e80-\u2eff\u2f00-\u2fdf\u3000-\u303f\uff00-\uffef\u20000-\u2a6df\u2a700-\u2b73f\u2b740-\u2b81f]+/;

/** Cache TTL for segmented results (1 hour). */
const SEGMENT_CACHE_TTL = 3600;

/**
 * Service for Chinese word segmentation using longest-match against a word index.
 */
export class SegmenterService {
  private simplifiedToId: Map<string, string>;
  private wordsJson: Record<string, { hskLevel?: number }> | null = null;
  private cacheService: CacheService | null;

  constructor(cacheService?: CacheService) {
    this.cacheService = cacheService ?? null;

    // Load word index at construction time
    try {
      const indexPath = new URL("../../../../../content/words/index.json", import.meta.url);
      const raw = readFileSync(indexPath, "utf-8");
      const data = JSON.parse(raw) as { simplified_to_id: Record<string, string> };
      this.simplifiedToId = new Map(Object.entries(data.simplified_to_id));
      logger.info(`Loaded ${this.simplifiedToId.size} word entries from index`);
    } catch (error) {
      logger.error("Failed to load word index", error);
      throw new SegmenterError("Failed to load word index at startup");
    }
  }

  /**
   * Lazily load full word data (words.json) for HSK profiling.
   */
  private async ensureWordsJson(): Promise<void> {
    if (this.wordsJson) return;

    try {
      const wordsPath = new URL("../../../../../content/words/words.json", import.meta.url);
      const raw = readFileSync(wordsPath, "utf-8");
      this.wordsJson = JSON.parse(raw) as Record<string, { hskLevel?: number }>;
      logger.info(`Loaded ${Object.keys(this.wordsJson).length} word entries for profiling`);
    } catch (error) {
      logger.error("Failed to load words.json", error);
      this.wordsJson = {};
    }
  }

  /**
   * Segment a Chinese text string into word tokens using longest-match.
   *
   * Algorithm:
   *   1. Scan through the text character by character.
   *   2. For each position, try the longest possible substring that exists in the word index.
   *   3. If found, emit that as a word segment and advance past it.
   *   4. If not found, treat single characters as unknown tokens.
   *   5. Non-Chinese characters (spaces, punctuation) are treated as separators and passed through as unknown tokens.
   *
   * @param text - The text to segment (Chinese characters + optional non-Chinese).
   * @returns Array of word segments with wordId, start, and end positions.
   */
  segment(text: string): WordSegment[] {
    const segments: WordSegment[] = [];
    let pos = 0;

    while (pos < text.length) {
      const remaining = text.slice(pos);

      // Check if current character is non-Chinese
      const nonChineseMatch = remaining.match(NON_CHINESE_REGEX);
      if (nonChineseMatch !== null && nonChineseMatch.index === 0) {
        // Non-Chinese run — take the whole run as a single unknown token
        const run = nonChineseMatch[0];
        segments.push({
          text: run,
          wordId: null,
          start: pos,
          end: pos + run.length,
        });
        pos += run.length;
        continue;
      }

      // Chinese character(s) — attempt longest match
      let longestMatch: string | null = null;
      let longestMatchId: string | null = null;

      // Try matching from longest possible (max 10 chars, keeps perf reasonable)
      const maxLookahead = Math.min(remaining.length, 10);
      for (let len = maxLookahead; len >= 1; len--) {
        const candidate = remaining.slice(0, len);
        const wordId = this.simplifiedToId.get(candidate);
        if (wordId !== undefined) {
          longestMatch = candidate;
          longestMatchId = wordId;
          break;
        }
      }

      if (longestMatch !== null) {
        segments.push({
          text: longestMatch,
          wordId: longestMatchId,
          start: pos,
          end: pos + longestMatch.length,
        });
        pos += longestMatch.length;
      } else {
        // Single unknown Chinese character
        segments.push({
          text: remaining[0],
          wordId: null,
          start: pos,
          end: pos + 1,
        });
        pos += 1;
      }
    }

    return segments;
  }

  /**
   * Segment text and compute its HSK profile.
   *
   * Caches the result keyed by SHA-256 hash of the input text (TTL: 1 hour).
   *
   * @param text - The text to analyze.
   * @returns HskProfile with level distribution and ratios.
   */
  async getHskProfile(text: string): Promise<HskProfile> {
    // Check cache first
    const cacheKey = this.hashText(text);
    if (this.cacheService) {
      try {
        const cached = await this.cacheService.get(cacheKey);
        if (cached !== null) {
          logger.info(`Cache hit for HSK profile: ${cacheKey.slice(0, 12)}`);
          return JSON.parse(cached) as HskProfile;
        }
      } catch {
        logger.warn("HSK profile cache read failed, proceeding without");
      }
    }

    // Ensure full word data is loaded
    await this.ensureWordsJson();

    // Segment the text
    const segments = this.segment(text);

    // Compute HSK level counts
    const levelCounts: Record<number, number> = {};
    let unknownCount = 0;

    for (const seg of segments) {
      if (seg.wordId === null || !this.wordsJson) {
        unknownCount++;
        continue;
      }

      const wordData = this.wordsJson[seg.wordId];
      const hskLevel = wordData?.hskLevel;
      if (hskLevel !== undefined && hskLevel !== null) {
        levelCounts[hskLevel] = (levelCounts[hskLevel] ?? 0) + 1;
      } else {
        unknownCount++;
      }
    }

    const totalWords = segments.length;

    // Compute distribution (percentage of known words at each HSK level)
    const knownWords = totalWords - unknownCount;
    const distribution: Record<number, number> = {};
    for (const [level, count] of Object.entries(levelCounts)) {
      distribution[Number(level)] = knownWords > 0 ? count / knownWords : 0;
    }

    const profile: HskProfile = {
      distribution,
      unknownRatio: totalWords > 0 ? unknownCount / totalWords : 0,
      knownWordRatio: totalWords > 0 ? knownWords / totalWords : 0,
      totalWords,
    };

    // Cache the result
    if (this.cacheService) {
      try {
        await this.cacheService.set(cacheKey, profile, SEGMENT_CACHE_TTL);
      } catch {
        logger.warn("HSK profile cache write failed, continuing without");
      }
    }

    return profile;
  }

  /**
   * Compute SHA-256 hash of text for cache keying.
   */
  private hashText(text: string): string {
    return `segment:hsk:${createHash("sha256").update(text, "utf-8").digest("hex")}`;
  }
}
