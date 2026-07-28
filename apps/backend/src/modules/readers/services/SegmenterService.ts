/**
 * @file apps/backend/src/modules/readers/services/SegmenterService.ts
 * @description Chinese word segmenter using longest-match against DB word index.
 *
 * Clean Architecture: Service layer — pure business logic with cache integration.
 * Loads the word index from the database at first use (lazy init) and performs
 * longest-match segmentation in memory. Results are cached keyed by SHA-256 hash.
 */

import { createHash } from "node:crypto";
// INTENTIONAL: SegmenterService loads the entire word index into memory at startup
// as a process-lifetime cache. This cross-cutting concern doesn't fit the standard
// CRUD repository pattern. The direct Prisma queries are an accepted trade-off for
// bulk data loading performance.
import { prisma } from "../../../shared/infrastructure/database/client.js";
import { createLogger } from "../../../shared/utils/logger.js";
import { pinyinStringToToneMarks } from "../../../shared/utils/pinyinFormatUtils.js";
import { SegmenterError } from "../types/readers-errors.js";
import type { WordSegment, HskProfile, EnrichedSentence, EnrichedWord } from "../types/readers.js";
import type { CacheService } from "../../../shared/infrastructure/cache/CacheService.js";

const logger = createLogger("SegmenterService");

const NON_CHINESE_REGEX =
  /[^\u4e00-\u9fff\u3400-\u4dbf\u2e80-\u2eff\u2f00-\u2fdf\u3000-\u303f\uff00-\uffef\u20000-\u2a6df\u2a700-\u2b73f\u2b740-\u2b81f]+/;

const SEGMENT_CACHE_TTL = 3600;

export class SegmenterService {
  private simplifiedToId: Map<string, string> = new Map();
  private hskLevels: Map<string, number> = new Map();
  private pinyinMap: Map<string, string> = new Map();
  /** Map of character glyph → tone-marked pinyin from Character.readings first reading */
  private characterPinyinMap: Map<string, string> = new Map();
  private cacheService: CacheService | null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  constructor(cacheService?: CacheService) {
    this.cacheService = cacheService ?? null;
  }

  /**
   * Lazy-load word index from database on first use.
   * Uses a promise guard to prevent concurrent initialization.
   */
  private async init(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.loadWordIndex();
    return this.initPromise;
  }

  /**
   * Load the full word index from the database into memory.
   * Word data is static reference data that doesn't change at runtime,
   * so it's safe to cache in memory for the process lifetime.
   */
  private async loadWordIndex(): Promise<void> {
    try {
      logger.info("Loading word index from database...");
      const words = await prisma.word.findMany({
        where: { simplified: { not: null } },
        select: { id: true, simplified: true, hskLevel: true, pinyin: true },
      });

      for (const word of words) {
        if (word.simplified) {
          this.simplifiedToId.set(word.simplified, word.id);
        }
        if (word.hskLevel !== null && word.hskLevel !== undefined) {
          this.hskLevels.set(word.id, word.hskLevel);
        }
        if (word.pinyin) {
          this.pinyinMap.set(word.id, word.pinyin);
        }
      }

      // Load character-level pinyin fallback map from Character.readings
      const characters = await prisma.character.findMany({
        select: { glyph: true, readings: true },
      });

      for (const char of characters) {
        const readings = char.readings as Array<{ pinyin?: string }> | null;
        if (readings && readings.length > 0 && readings[0].pinyin) {
          this.characterPinyinMap.set(char.glyph, readings[0].pinyin);
        }
      }

      logger.info(
        `Loaded ${this.simplifiedToId.size} word entries, ${this.hskLevels.size} HSK levels, ${this.pinyinMap.size} word pinyin, ${this.characterPinyinMap.size} character pinyin from database`,
      );
      this.initialized = true;
    } catch (error) {
      logger.error("Failed to load word index from database", error);
      this.initPromise = null; // Allow retry on next call
      throw new SegmenterError("Failed to load word index from database");
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
   * Triggers lazy DB load on first call.
   */
  async getHskProfile(text: string): Promise<HskProfile> {
    await this.init();

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

    const segments = this.segment(text);

    const levelCounts: Record<number, number> = {};
    let unknownCount = 0;

    for (const seg of segments) {
      if (seg.wordId === null) {
        unknownCount++;
        continue;
      }

      const hskLevel = this.hskLevels.get(seg.wordId);
      if (hskLevel !== undefined) {
        levelCounts[hskLevel] = (levelCounts[hskLevel] ?? 0) + 1;
      } else {
        unknownCount++;
      }
    }

    const totalWords = segments.length;
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

    if (this.cacheService) {
      try {
        await this.cacheService.set(cacheKey, JSON.stringify(profile), SEGMENT_CACHE_TTL);
      } catch {
        logger.warn("HSK profile cache write failed");
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

  /**
   * Get the HSK level for a word by its ID.
   * Returns null if the word is unknown or has no HSK level.
   */
  getWordHskLevel(wordId: string): number | null {
    return this.hskLevels.get(wordId) ?? null;
  }

  /**
   * Enrich raw passage sentences with word-level data from segments.
   * Maps segment positions to sentences and looks up pinyin/HSK levels.
   * When knownWordIds is provided, sets isKnown=true for words in the set.
   */
  enrichSentences(
    sentences: Array<{ index: number; text: string }>,
    segments: WordSegment[],
    knownWordIds?: Set<string>,
  ): EnrichedSentence[] {
    let segmentIdx = 0;

    return sentences.map((sentence, idx) => {
      // Calculate character start position for this sentence in the full passage text
      const sentenceStart =
        idx > 0 ? sentences.slice(0, idx).reduce((sum, s) => sum + s.text.length, 0) : 0;
      const sentenceEnd = sentenceStart + sentence.text.length;

      // Collect segments that fall within this sentence's character range
      const sentenceWords: EnrichedWord[] = [];
      const sentencePinyinParts: string[] = [];

      while (segmentIdx < segments.length && segments[segmentIdx].start < sentenceEnd) {
        const seg = segments[segmentIdx];

        // Extract the glyph from the original sentence text
        const localStart = seg.start - sentenceStart;
        const localEnd = seg.end - sentenceStart;
        const glyph = sentence.text.slice(localStart, localEnd);

        // Look up pinyin and HSK level from the in-memory maps
        let wordPinyin = seg.wordId ? (this.pinyinMap.get(seg.wordId) ?? null) : null;
        const hskLevel = seg.wordId ? (this.hskLevels.get(seg.wordId) ?? null) : null;

        // Fix 1: Convert tone numbers to tone marks for display
        if (wordPinyin) {
          wordPinyin = pinyinStringToToneMarks(wordPinyin);
        }

        // Fix 2: Character-level pinyin fallback for words not in the index
        if (!wordPinyin && seg.wordId === null && /[\u4e00-\u9fff]/.test(seg.text)) {
          const charPinyins: string[] = [];
          for (const ch of seg.text) {
            const cp = this.characterPinyinMap.get(ch);
            if (cp) {
              charPinyins.push(cp);
            } else {
              charPinyins.push(ch); // fallback to raw glyph
            }
          }
          if (charPinyins.length > 0) {
            wordPinyin = charPinyins.join(" ");
          }
        }

        // Only add meaningful pinyin parts for Chinese words
        if (wordPinyin && (seg.wordId !== null || /[\u4e00-\u9fff]/.test(seg.text))) {
          sentencePinyinParts.push(wordPinyin);
        } else {
          // For non-Chinese tokens (punctuation, spaces), pass through the raw text
          sentencePinyinParts.push(seg.text);
        }

        const isKnown = knownWordIds ? knownWordIds.has(seg.wordId ?? "") : false;

        sentenceWords.push({
          glyph,
          wordId: seg.wordId,
          hskLevel,
          pinyin: wordPinyin,
          isKnown,
        });

        segmentIdx++;
      }

      return {
        index: sentence.index,
        text: sentence.text,
        pinyin: sentencePinyinParts.join(" "),
        words: sentenceWords,
      };
    });
  }
}
