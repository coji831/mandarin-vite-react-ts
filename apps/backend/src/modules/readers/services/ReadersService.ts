/**
 * @file apps/backend/src/modules/readers/services/ReadersService.ts
 * @description Passage management and generation business logic.
 *
 * Clean Architecture: Application Service / Use Case.
 * Orchestrates Gemini API, segmentation, rate limiting, and persistence.
 */

import { createLogger } from "../../../shared/utils/logger.js";
import { ReadersRepository } from "../repositories/ReadersRepository.js";
import { SegmenterService } from "./SegmenterService.js";
import { PassageGenerationService } from "./PassageGenerationService.js";
import type { CacheService } from "../../../shared/infrastructure/cache/CacheService.js";
import {
  PassageNotFoundError,
  RateLimitExceededError,
  PassageGenerationError,
} from "../types/readers-errors.js";
import type { PassageRecord, PassageContent, WordSegment, HskProfile } from "../types/readers.js";

const logger = createLogger("ReadersService");

/** Maximum number of generated passages a user can store. */
const MAX_USER_PASSAGES = 5;

/** Maximum daily generation requests per user. */
const MAX_DAILY_GENERATIONS = 5;

/** Passage cache TTL: 1 hour for segmented results. */
const PASSAGE_CACHE_TTL = 3600;

/**
 * Readers Service — manages reading passages: listing, retrieval, and AI generation.
 */
export class ReadersService {
  private readonly repository: ReadersRepository;
  private readonly passageGenService: PassageGenerationService;
  private readonly segmenterService: SegmenterService;
  private readonly cacheService: CacheService;

  constructor(
    repository: ReadersRepository,
    passageGenService: PassageGenerationService,
    segmenterService: SegmenterService,
    cacheService: CacheService,
  ) {
    this.repository = repository;
    this.passageGenService = passageGenService;
    this.segmenterService = segmenterService;
    this.cacheService = cacheService;
    logger.info("Initialized Readers Service");
  }

  /**
   * List passages, optionally filtered by HSK level.
   * Excludes user's own generated passages.
   */
  async listPassages(hskLevel?: number, userId?: string): Promise<PassageRecord[]> {
    const passages = await this.repository.findPassages(hskLevel);

    // If user is authenticated, exclude their own generated passages from public list
    if (userId) {
      return passages.filter((p) => p.generatedById !== userId);
    }

    return passages;
  }

  /**
   * Get a full passage with segmented result and HSK profile.
   * Uses the SegmenterService on first read and caches the result.
   * Increments access count.
   */
  async getPassage(id: string): Promise<{
    passage: PassageRecord;
    segments: WordSegment[];
    hskProfile: HskProfile;
  }> {
    const passage = await this.repository.findPassageById(id);
    if (!passage) {
      throw new PassageNotFoundError(id);
    }

    // Increment access counter (fire-and-forget)
    this.repository.incrementAccessCount(id).catch((err) => {
      logger.warn(`Failed to increment access count for passage ${id}`, err);
    });

    // Try cache for segmented result
    const content = passage.content as PassageContent;
    const fullText = content.sentences.map((s) => s.text).join("");

    // Check cache for pre-computed segments
    const cacheKey = `passage:segments:${id}`;
    let segments: WordSegment[] | null = null;
    let hskProfile: HskProfile | null = null;

    try {
      const cached = await this.cacheService.get(cacheKey);
      if (cached !== null) {
        const parsed = JSON.parse(cached) as { segments: WordSegment[]; hskProfile: HskProfile };
        segments = parsed.segments;
        hskProfile = parsed.hskProfile;
      }
    } catch {
      logger.warn(`Cache read failed for passage ${id}, re-computing`);
    }

    // Compute segments if not cached
    if (!segments || !hskProfile) {
      segments = this.segmenterService.segment(fullText);
      hskProfile = await this.segmenterService.getHskProfile(fullText);

      // Cache the result
      try {
        await this.cacheService.set(cacheKey, { segments, hskProfile }, PASSAGE_CACHE_TTL);
      } catch {
        logger.warn(`Cache write failed for passage ${id}`);
      }
    }

    return { passage, segments, hskProfile };
  }

  /**
   * Generate a new passage on a given topic for the user.
   *
   * Flow:
   *   1. Check rate limits (daily + total storage)
   *   2. Derive user's known HSK level from CharacterProgress
   *   3. Build prompt with level-appropriate vocabulary
   *   4. Call PassageGenerationService.generatePassage()
   *   5. Parse, segment, compute HSK profile
   *   6. Save to database with generatedById = userId
   *   7. Return the passage with segmented data
   */
  async generatePassage(
    topic: string,
    userId: string,
  ): Promise<{
    passage: PassageRecord;
    segments: WordSegment[];
    hskProfile: HskProfile;
  }> {
    // Step 1: Check rate limits
    await this.checkRateLimits(userId);

    // Step 2: Derive user's known HSK level
    const knownHskLevel = await this.getUserKnownLevel(userId);
    const targetHskLevel = knownHskLevel;

    // Step 3: Build prompt
    const prompt = this.buildPrompt(topic, targetHskLevel);

    // Step 4: Generate passage via PassageGenerationService
    const passageResult = await this.passageGenService.generatePassage(prompt);

    // Validate response has at least one sentence
    if (!passageResult.sentences || passageResult.sentences.length === 0) {
      throw new PassageGenerationError("Generated passage has no sentences");
    }

    // Step 5: Segment and compute HSK profile
    const fullText = passageResult.sentences.map((s) => s.text).join("");
    const segments = this.segmenterService.segment(fullText);
    const hskProfile = await this.segmenterService.getHskProfile(fullText);

    // Build passage content
    const content: PassageContent = {
      sentences: passageResult.sentences,
      metadata: { topic, generatedFromLevel: knownHskLevel },
    };

    // Step 6: Save to database
    const nextIndex = (await this.repository.getMaxPassageIndex(targetHskLevel)) + 1;
    const passage = await this.repository.createPassage({
      hskLevel: targetHskLevel,
      passageIndex: nextIndex,
      title: topic,
      content,
      wordCount: segments.length,
      knownWordRatio: hskProfile.knownWordRatio,
      targetHskLevel,
      generatedById: userId,
    });

    logger.info(
      `Generated passage for user ${userId}: "${topic}" (HSK ${targetHskLevel}, ${segments.length} words)`,
    );

    return { passage, segments, hskProfile };
  }

  /**
   * Check both daily and total storage rate limits for the user.
   * Throws RateLimitExceededError if either limit is breached.
   */
  private async checkRateLimits(userId: string): Promise<void> {
    // Daily cap
    const todayCount = await this.repository.countUserGeneratedToday(userId);
    if (todayCount >= MAX_DAILY_GENERATIONS) {
      throw new RateLimitExceededError(
        `Daily generation limit reached (${MAX_DAILY_GENERATIONS}/day)`,
      );
    }

    // Total storage cap
    const totalCount = await this.repository.countUserGenerated(userId);
    if (totalCount >= MAX_USER_PASSAGES) {
      throw new RateLimitExceededError(
        `Storage limit reached (max ${MAX_USER_PASSAGES} generated passages). Delete some to generate more.`,
      );
    }
  }

  /**
   * Derive the user's known HSK level from CharacterProgress data.
   *
   * For each HSK level 1-6, calculate what percentage of characters the user has
   * studied at confidence >= 0.8. Return the highest level with >= 80% coverage.
   * If no level meets the threshold, return 1 (safe default for beginners).
   */
  private async getUserKnownLevel(userId: string): Promise<number> {
    try {
      const results = await this.repository.getUserCharacterCoverage(userId);

      // Find the highest level with coverage >= 0.8
      let knownLevel = 1; // Safe default
      for (const row of results) {
        if (row.coverageRatio >= 0.8) {
          knownLevel = row.hskLevel;
        }
      }

      logger.info(`User ${userId} known HSK level: ${knownLevel}`);
      return knownLevel;
    } catch (error) {
      logger.error("Failed to derive user HSK level, defaulting to 1", error);
      return 1;
    }
  }

  /**
   * Build a prompt for Gemini passage generation based on topic and HSK level.
   */
  private buildPrompt(topic: string, hskLevel: number): string {
    return `You are a Chinese language teacher creating a graded reading passage.

Topic: ${topic}
Target HSK Level: ${hskLevel}

Guidelines:
- Use vocabulary appropriate for HSK ${hskLevel} level (approximately ${this.getWordCountForLevel(hskLevel)} words)
- Write 5-8 sentences in simplified Chinese characters
- Keep sentences short and grammatically simple
- Include some higher-level vocabulary (HSK ${Math.min(hskLevel + 1, 6)}) for challenge

Respond ONLY with a valid JSON object in this exact format:
{
  "sentences": [
    { "index": 0, "text": "First sentence。" },
    { "index": 1, "text": "Second sentence。" }
  ]
}

Do not include any text before or after the JSON object.`;
  }

  /**
   * Estimate appropriate word count for each HSK level.
   */
  private getWordCountForLevel(hskLevel: number): number {
    const counts: Record<number, number> = {
      1: 30,
      2: 50,
      3: 80,
      4: 120,
      5: 150,
      6: 200,
    };
    return counts[hskLevel] ?? 50;
  }
}
