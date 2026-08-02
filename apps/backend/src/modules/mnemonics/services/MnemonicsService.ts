/**
 * @file apps/backend/src/modules/mnemonics/services/MnemonicsService.ts
 * @description Mnemonic generation and management business logic.
 *
 * Clean Architecture: Application Service / Use Case.
 *
 * 4-step lookup chain:
 *   1. DB(user-edited) — User's own edited story
 *   2. Cache(AI)       — Cached AI-generated story
 *   3. DB(AI)          — Any user's AI-generated story (shared)
 *   4. Generate        — Generate new story via AI
 *
 * Cache stampede prevention via Redis SETNX with 20s TTL.
 */

import { createLogger } from "../../../shared/utils/logger.js";
import { MnemonicsRepository } from "../repositories/MnemonicsRepository.js";
import { MnemonicNotFoundError } from "../types/mnemonics.js";
import { GeminiService } from "../../../shared/services/GeminiService.js";
import type { MnemonicStoryResponse } from "../types/mnemonics.js";
import type { CacheService } from "../../../shared/infrastructure/cache/CacheService.js";

const logger = createLogger("MnemonicsService");

const MNEMONIC_CACHE_TTL = 30 * 24 * 60 * 60; // 30 days

/**
 * Mnemonic Service — generates and manages mnemonic stories.
 */
export class MnemonicsService {
  private readonly repository: MnemonicsRepository;
  private readonly geminiService: GeminiService;
  private readonly cacheService: CacheService;

  constructor(
    repository: MnemonicsRepository,
    geminiService: GeminiService,
    cacheService: CacheService,
  ) {
    this.repository = repository;
    this.geminiService = geminiService;
    this.cacheService = cacheService;
    logger.info("Initialized Mnemonics Service");
  }

  /**
   * 4-step lookup chain to retrieve a mnemonic story.
   *   Step 1: DB(user-edited) — fastest path
   *   Step 2: Cache(AI)       — cached generated story
   *   Step 3: DB(AI)          — any user's shared AI story
   *   Step 4: Generate        — AI generation (with stampede prevention)
   */
  async getMnemonic(characterGlyph: string, userId?: string): Promise<MnemonicStoryResponse> {
    // Step 1: Check for user's own edited story in DB
    if (userId) {
      const userEdited = await this.repository.findByCharacterAndUser(characterGlyph, userId, true);
      if (userEdited) {
        logger.info(`Found user-edited mnemonic for ${characterGlyph}`);
        const charData = await this.repository.getCharacterByGlyph(characterGlyph);
        return this.toResponse(userEdited, charData?.classification);
      }
    }

    // Step 2: Check cache for AI-generated story
    const cacheKey = `mnemonic:${characterGlyph}`;

    try {
      const cached = await this.cacheService.get(cacheKey);
      if (cached !== null) {
        logger.info(`Cache hit for mnemonic: ${characterGlyph}`);
        return JSON.parse(cached) as MnemonicStoryResponse;
      }
    } catch (_err) {
      logger.warn(`Cache read failed for ${characterGlyph}, continuing without`);
    }

    // Step 3: Check DB for any non-edited (AI-generated) story
    const anyAi = await this.repository.findAnyByCharacter(characterGlyph, false);
    if (anyAi) {
      logger.info(`Found DB AI mnemonic for ${characterGlyph}`);
      const charDataStep3 = await this.repository.getCharacterByGlyph(characterGlyph);
      const response = this.toResponse(anyAi, charDataStep3?.classification);

      // Populate cache asynchronously (best-effort)
      this.cacheMnemonic(cacheKey, response);
      return response;
    }

    // Step 4: Check if character is a pictograph — return static note instead of 404
    const charData = await this.repository.getCharacterByGlyph(characterGlyph);
    if (charData?.classification === "pictograph") {
      const etymology = charData.etymology ?? "the object it depicts";
      logger.info(`Pictograph ${characterGlyph} — returning static note in getMnemonic`);
      return {
        id: "",
        characterGlyph,
        story: `This is a pictograph — its meaning comes from its visual form. Try to visualize ${etymology} when you see this character.`,
        radicalIds: [],
        isEdited: false,
        isPictograph: true,
        classification: charData?.classification ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Still nothing — throw
    throw new MnemonicNotFoundError(characterGlyph);
  }

  /**
   * Generate a new mnemonic story for a character.
   * Called after the 4-step chain finds nothing.
   */
  async generateMnemonic(characterGlyph: string, userId: string): Promise<MnemonicStoryResponse> {
    // Pictograph check — early return for visual-origin characters
    const charData = await this.repository.getCharacterByGlyph(characterGlyph);
    if (charData?.classification === "pictograph") {
      const etymology = charData.etymology ?? "the object it depicts";
      const response: MnemonicStoryResponse = {
        id: "",
        characterGlyph,
        story: `This is a pictograph — its meaning comes from its visual form. Try to visualize ${etymology} when you see this character.`,
        radicalIds: [],
        isEdited: false,
        isPictograph: true,
        classification: charData?.classification ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      logger.info(`Pictograph ${characterGlyph} — returning static note`);
      return response;
    }

    // Cache stampede prevention: simple locking via the cache service.
    // Since CacheService.set() uses setex (no NX), we use a two-phase approach:
    // 1. Check if a lock exists for this glyph
    // 2. If not, set the lock and proceed; if so, wait and retry DB lookup
    const lockKey = `mnemonic:lock:${characterGlyph}`;

    try {
      const existingLock = await this.cacheService.get(lockKey);
      if (existingLock !== null) {
        // Another request is generating — wait briefly and retry db lookup
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const existing = await this.repository.findAnyByCharacter(characterGlyph);
        if (existing) {
          const charDataLock = await this.repository.getCharacterByGlyph(characterGlyph);
          return this.toResponse(existing, charDataLock?.classification);
        }

        // If still nothing, proceed despite lock
        logger.warn(`Lock held but no mnemonic found for ${characterGlyph}, generating anyway`);
      } else {
        // Acquire lock with short TTL
        await this.cacheService.set(lockKey, "generating", 20);
      }
    } catch (_err) {
      logger.warn(`Lock check failed for ${characterGlyph}, proceeding without lock`);
    }

    // Fetch radical decomposition for prompt building
    const radicals = await this.repository.getCharacterRadicals(characterGlyph);

    // Generate story via AI (GeminiService handles timeout internally)
    try {
      const story = await this.generateAIStory(
        characterGlyph,
        radicals.map((r) => r.radicalId),
      );

      const response: MnemonicStoryResponse = {
        id: "",
        characterGlyph,
        story,
        radicalIds: radicals.map((r) => r.radicalId),
        isEdited: false,
        isPictograph: false,
        classification: charData?.classification ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Persist to DB
      await this.repository.upsert(
        characterGlyph,
        null, // Store as shared AI version (userId = null)
        story,
        radicals.map((r) => r.radicalId),
        false, // isPictograph
        false, // isEdited — AI-generated
      );

      // Also persist user-specific copy
      await this.repository.upsert(
        characterGlyph,
        userId,
        story,
        radicals.map((r) => r.radicalId),
        false, // isPictograph
        false, // isEdited — AI-generated
      );

      // Cache the result
      const cacheKey = `mnemonic:${characterGlyph}`;
      await this.cacheMnemonic(cacheKey, response);

      // Release lock
      try {
        await this.cacheService.delete(lockKey);
      } catch {
        // Best-effort lock release
      }

      logger.info(`Generated mnemonic for ${characterGlyph}`);
      return response;
    } catch (error: unknown) {
      // Release lock on error
      try {
        await this.cacheService.delete(lockKey);
      } catch {
        // Best-effort
      }

      if (error instanceof Error && error.message === "Request timeout") {
        logger.warn(`Gemini API timeout for character ${characterGlyph}`);
      } else if (error instanceof Error) {
        logger.error(`Gemini API error for character ${characterGlyph}: ${error.message}`, null);
      }

      // Return fallback mnemonic
      return this.getFallbackMnemonic(characterGlyph);
    }
  }

  /**
   * Update a user's mnemonic story (user-edited version).
   */
  async updateMnemonic(
    characterGlyph: string,
    userId: string,
    story: string,
    radicalIds?: string[],
  ): Promise<MnemonicStoryResponse> {
    const existingRadicals = await this.repository.getCharacterRadicals(characterGlyph);
    const ids = radicalIds ?? existingRadicals.map((r) => r.radicalId);

    const record = await this.repository.upsert(
      characterGlyph,
      userId,
      story,
      ids,
      false, // isPictograph — user is editing
      true, // isEdited — user-edited
    );

    logger.info(`User ${userId} edited mnemonic for ${characterGlyph}`);
    const charData = await this.repository.getCharacterByGlyph(characterGlyph);
    return this.toResponse(record, charData?.classification);
  }

  /**
   * Reset a user's mnemonic story to the AI-generated version.
   */
  async resetMnemonic(characterGlyph: string, userId: string): Promise<void> {
    await this.repository.deleteByCharacterAndUser(characterGlyph, userId);
    logger.info(`Reset mnemonic for ${characterGlyph} (user ${userId})`);
  }

  /**
   * Generate AI story via Gemini API.
   * @private
   */
  private async generateAIStory(character: string, radicalIds: string[]): Promise<string> {
    // Fetch character classification and phonetic component data
    const charData = await this.repository.getCharacterByGlyph(character);
    let phoneticComponent: { glyph: string; pinyin: string; meaning: string } | undefined;

    if (charData?.phoneticComponentId) {
      const comp = await this.repository.getPhoneticComponent(charData.phoneticComponentId);
      if (comp) phoneticComponent = comp;
    }

    // Extract pinyin from readings
    const readings = (charData?.readings as Array<{ pinyin: string; tone: number }> | null) ?? null;
    const pinyin = readings?.[0]?.pinyin ? `${readings[0].pinyin}${readings[0].tone}` : undefined;
    const meaning = charData?.definition ?? undefined;

    const prompt = buildMnemonicPrompt({
      character,
      radicalIds,
      classification: charData?.classification ?? undefined,
      phoneticComponent,
      etymology: charData?.etymology ?? undefined,
      pinyin,
      meaning,
    });

    logger.info(`Calling Gemini API for character: ${character}`);
    logger.info(`Prompt length: ${prompt.length} characters`);

    const response = await this.geminiService.generateText(prompt, {
      temperature: 0.8,
      maxTokens: 300,
    });

    logger.info(`Gemini response received for ${character}: ${response.substring(0, 100)}...`);
    return response.trim().substring(0, 500);
  }

  /**
   * Get fallback mnemonic when AI is unavailable.
   */
  private getFallbackMnemonic(characterGlyph: string): MnemonicStoryResponse {
    return {
      id: "",
      characterGlyph,
      story: getFallbackStory(characterGlyph),
      radicalIds: [],
      isEdited: false,
      isPictograph: false,
      classification: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Best-effort cache write for mnemonic stories.
   */
  private async cacheMnemonic(cacheKey: string, response: MnemonicStoryResponse): Promise<void> {
    try {
      await this.cacheService.set(cacheKey, response, MNEMONIC_CACHE_TTL);
    } catch (_err) {
      logger.warn(`Cache write failed for ${cacheKey}, result returned anyway`);
    }
  }

  /**
   * Map database record to API response.
   */
  private toResponse(
    record: {
      id: string;
      characterGlyph: string;
      story: string;
      radicalIds: string[];
      isEdited: boolean;
      isPictograph: boolean;
      createdAt: Date;
      updatedAt: Date;
    },
    classification?: string | null,
  ): MnemonicStoryResponse {
    return {
      id: record.id,
      characterGlyph: record.characterGlyph,
      story: record.story,
      radicalIds: record.radicalIds,
      isEdited: record.isEdited,
      isPictograph: record.isPictograph,
      classification: classification ?? null,
      createdAt:
        record.createdAt instanceof Date
          ? record.createdAt.toISOString()
          : String(record.createdAt),
      updatedAt:
        record.updatedAt instanceof Date
          ? record.updatedAt.toISOString()
          : String(record.updatedAt),
    };
  }
}

// ── Module-level helpers ───────────────────────────────────────────────────

/**
 * Context data for building a mnemonic prompt.
 */
interface PromptContext {
  character: string;
  radicalIds: string[];
  classification?: string;
  phoneticComponent?: {
    glyph: string;
    pinyin: string;
    meaning: string;
  };
  etymology?: string;
  pinyin?: string;
  meaning?: string;
}

/**
 * Build a prompt for mnemonic story generation via Gemini.
 */
function buildMnemonicPrompt(context: PromptContext): string {
  const { character, radicalIds, classification, phoneticComponent, pinyin, meaning } = context;
  const radicalList =
    radicalIds.length > 0
      ? radicalIds.map((id) => `  - ${id}`).join("\n")
      : "  (no radical decomposition data available)";

  let classificationSection = "";
  if (classification === "phono_semantic" && phoneticComponent) {
    classificationSection =
      `\nCharacter classification: phono-semantic\n` +
      `The phonetic component is ${phoneticComponent.glyph} (${phoneticComponent.pinyin}, meaning: ${phoneticComponent.meaning}).\n` +
      `The story should connect both the meaning clue and the sound clue.`;
  } else if (classification === "compound_ideograph") {
    classificationSection =
      `\nCharacter classification: compound ideograph\n` +
      `The story should explain how the components combine to create the meaning.`;
  } else if (classification === "ideograph") {
    classificationSection =
      `\nCharacter classification: simple ideograph\n` +
      `The story should focus on the abstract meaning directly.`;
  }

  return `You are a Mandarin Chinese teacher creating memorable mnemonic stories to help students remember how Chinese characters are formed.

Character: ${character}${pinyin ? ` (${pinyin})` : ""}${meaning ? ` — ${meaning}` : ""}
Radical decomposition:
${radicalList}${classificationSection}

Create a short, memorable mnemonic story (2-4 sentences) connecting these radicals or components to help a beginner student remember "${character}".

The story should be:
- Engaging and easy to visualize
- 2-4 sentences long
- Written in English
- Focused on how the parts combine to form the meaning of "${character}"

Example: For "休" (rest) — a person (亻) leans against a tree (木) to rest. So "rest" looks like a person resting by a tree.`;
}

/**
 * Fallback story when AI is unavailable.
 */
function getFallbackStory(character: string): string {
  return `"${character}" is composed of radicals that combine to form its meaning. Try breaking it down into its visual components to see how they relate to the character's definition.`;
}
