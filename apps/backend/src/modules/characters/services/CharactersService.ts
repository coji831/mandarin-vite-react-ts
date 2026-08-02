/**
 * @file apps/backend/src/modules/characters/services/CharactersService.ts
 * @description Business logic for character data operations.
 *
 * Clean Architecture: Application Service / Use Case.
 * Maps Prisma data to typed API responses. Handles error cases
 * and radical resolution from the file-based radicals aggregate.
 */

import { createLogger } from "../../../shared/utils/logger.js";
import { CharactersRepository } from "../repositories/CharactersRepository.js";
import {
  CharacterNotFoundError,
  PhoneticComponentNotFoundError,
  CharacterValidationError,
} from "../types/characters-errors.js";
import type {
  CharacterDetailResponse,
  HomophoneReadingGroup,
  HomophoneResponse,
  DecompositionComponent,
  DecompositionResponse,
  SearchParams,
  SearchResultItem,
  FrequencyEntry,
  PaginatedResponse,
  PhoneticComponentResponse,
} from "../types/characters.js";

const logger = createLogger("CharactersService");

/**
 * Service for character-related business logic.
 */
export class CharactersService {
  private readonly repository: CharactersRepository;

  constructor(repository: CharactersRepository) {
    this.repository = repository;
    logger.info("Initialized Characters Service");
  }

  /**
   * Get full character detail for a glyph.
   * Includes: pinyin readings, meanings, stroke count, radical, classification,
   * phonetic component (glyph only), HSK levels, and frequency rank.
   *
   * @param glyph - The character glyph (e.g., "好")
   * @returns Mapped CharacterDetailResponse
   * @throws CharacterNotFoundError if glyph not found
   */
  async getCharacter(glyph: string): Promise<CharacterDetailResponse> {
    const character = await this.repository.findByGlyph(glyph);

    if (!character) {
      throw new CharacterNotFoundError(glyph);
    }

    // Extract pinyin readings
    const pinyin = character.characterReadings.map((r) => r.pinyin);

    // Parse meanings from the JSON readings field or from characterReadings
    const readings = Array.isArray(character.readings)
      ? (character.readings as Array<{ meaning?: string }>)
      : [];
    const meanings = readings
      .map((r: { meaning?: string }) => r.meaning)
      .filter((m: string | undefined): m is string => !!m);

    // Resolve radical from the file-based radicals aggregate
    const radical = await this.resolveRadical(character.radicals);

    // Extract phonetic component glyph
    const phoneticComponent = character.phoneticComponent
      ? this.extractPhoneticComponentInfo(character.phoneticComponent)
      : null;

    // Extract HSK levels from CharacterHskLevel table
    const hskLevels = character.hskLevels.map((hl) => hl.hskLevel);

    return {
      glyph: character.glyph,
      pinyin,
      meanings,
      strokeCount: character.strokeCount,
      radical,
      classification: character.classification,
      phoneticComponent,
      hskLevels,
      frequencyRank: character.frequencyRank,
    };
  }

  /**
   * Get phonetic component info for a character.
   *
   * @param glyph - The character glyph
   * @returns Phonetic component with glyph, pinyin, meaning
   * @throws CharacterNotFoundError if glyph not found
   * @throws PhoneticComponentNotFoundError if no phonetic component exists
   */
  async getPhoneticComponent(glyph: string): Promise<PhoneticComponentResponse> {
    const component = await this.repository.findPhoneticComponent(glyph);

    if (component === null) {
      // Check if the character itself exists
      const exists = await this.repository.findByGlyph(glyph);
      if (!exists) {
        throw new CharacterNotFoundError(glyph);
      }
      throw new PhoneticComponentNotFoundError(glyph);
    }

    return this.extractPhoneticComponentInfo(component);
  }

  /**
   * Get homophones for a character — all characters sharing the same pronunciation.
   * Results are grouped by reading (pinyin + tone) for multi-pronunciation characters.
   *
   * @param glyph - The character glyph
   * @param exactTone - If true, filter homophones to match exact tone too
   * @returns HomophoneResponse grouped by reading
   * @throws CharacterNotFoundError if glyph not found
   */
  async getHomophones(glyph: string, exactTone: boolean = false): Promise<HomophoneResponse> {
    const { sourceReadings, homophoneReadings } = await this.repository.findHomophones(
      glyph,
      exactTone,
    );

    if (sourceReadings.length === 0) {
      // Check if the character itself exists
      const exists = await this.repository.findByGlyph(glyph);
      if (!exists) {
        throw new CharacterNotFoundError(glyph);
      }
    }

    // Group homophones by source reading (pinyin + tone)
    const readings: HomophoneReadingGroup[] = sourceReadings.map((sr) => {
      const matchingHomophones = homophoneReadings
        .filter((hr) => hr.pinyin === sr.pinyin && hr.tone === sr.tone)
        .map((hr) => ({
          glyph: hr.character.glyph,
          pinyin: hr.pinyin,
          tone: hr.tone,
          meaning: hr.character.definition ?? null,
        }))
        // Deduplicate by glyph
        .filter((h, i, arr) => arr.findIndex((x) => x.glyph === h.glyph) === i);

      return {
        pinyin: sr.pinyin,
        tone: sr.tone,
        homophones: matchingHomophones,
      };
    });

    return { glyph, readings };
  }

  /**
   * Get decomposition tree for a character — its constituent components.
   *
   * @param glyph - The character glyph
   * @returns DecompositionResponse with ordered component list
   * @throws CharacterNotFoundError if glyph not found
   */
  async getDecomposition(glyph: string): Promise<DecompositionResponse> {
    const components = await this.repository.findDecomposition(glyph);

    if (components.length === 0) {
      // Check if the character itself exists
      const exists = await this.repository.findByGlyph(glyph);
      if (!exists) {
        throw new CharacterNotFoundError(glyph);
      }
    }

    const mappedComponents: DecompositionComponent[] = components.map((cc) => ({
      glyph: cc.component.glyph,
      type: cc.function || "remaining",
      meaning: cc.component.meaning,
    }));

    return { glyph, components: mappedComponents };
  }

  /**
   * Search characters by pinyin, tone, or HSK level.
   * Requires at least one filter parameter.
   *
   * @param params - Search parameters
   * @returns Array of matching search result items
   * @throws CharacterValidationError if all params are empty
   */
  async searchCharacters(params: SearchParams): Promise<SearchResultItem[]> {
    const { q, tone, hskLevel } = params;

    if (!q && !tone && !hskLevel) {
      throw new CharacterValidationError(
        "At least one search parameter (q, tone, hskLevel) is required",
      );
    }

    const results = await this.repository.searchCharacters(params);

    return results.map((r) => ({
      glyph: r.glyph,
      pinyin: r.characterReadings[0]?.pinyin || "",
      tone: r.characterReadings[0]?.tone || 0,
      hskLevels: r.hskLevels.map((hl) => hl.hskLevel),
    }));
  }

  /**
   * Get characters ordered by frequency rank, with optional HSK tier filter.
   *
   * @param tier - Optional HSK tier filter (1-6)
   * @param page - Page number (1-based, default: 1)
   * @param pageSize - Items per page (default: 50)
   * @returns Paginated list of frequency entries
   */
  async getFrequencyList(
    tier?: number,
    page: number = 1,
    pageSize: number = 50,
  ): Promise<PaginatedResponse<FrequencyEntry>> {
    const { data, total } = await this.repository.findFrequencyList(tier, page, pageSize);

    const entries: FrequencyEntry[] = data.map((r) => ({
      glyph: r.glyph,
      frequencyRank: r.frequencyRank ?? 0,
      hskLevel: r.hskLevel,
      pinyin: r.characterReadings[0]?.pinyin || "",
      tone: r.characterReadings[0]?.tone || 0,
    }));

    return { data: entries, page, pageSize, total };
  }

  // ── Private Helpers ────────────────────────────────────────────────────

  /**
   * Resolve the first radical from CharacterRadical records using the
   * Radical reference table (all-in-DB — seeded from content/seed/phase2/
   * by prisma/seed.ts). Replaces the former read of
   * content/radicals/radicals.json at runtime.
   */
  private async resolveRadical(
    radicalRecords: Array<{ radicalId: string; decompositionType: string | null }>,
  ): Promise<{ id: string; glyph: string; meaning: string } | null> {
    if (radicalRecords.length === 0) return null;

    try {
      // Fetch only the referenced radical rows from the DB (repository-backed).
      const radicalIds = radicalRecords.map((r) => r.radicalId);
      const allRadicals = await this.repository.findRadicalsByIds(radicalIds);
      const radicalMap = new Map(allRadicals.map((r) => [r.id, r]));

      // Use the first radical record
      const firstRecord = radicalRecords[0];
      const radical = radicalMap.get(firstRecord.radicalId);

      if (radical) {
        return { id: radical.id, glyph: radical.glyph, meaning: radical.meaning };
      }
    } catch (err) {
      logger.warn(`Failed to resolve radical details from the database`, err);
    }

    return null;
  }

  /**
   * Extract phonetic component info from the database record.
   * Reads the first reading's pinyin from the JSON readings field.
   */
  private extractPhoneticComponentInfo(component: {
    glyph: string;
    readings: unknown;
    definition: string | null;
  }): PhoneticComponentResponse {
    const readings = Array.isArray(component.readings)
      ? (component.readings as Array<{ pinyin?: string }>)
      : [];
    const pinyin = readings.length > 0 ? readings[0]?.pinyin || "" : "";

    return {
      glyph: component.glyph,
      pinyin,
      meaning: component.definition,
    };
  }
}
