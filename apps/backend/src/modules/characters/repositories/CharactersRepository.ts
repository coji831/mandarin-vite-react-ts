/**
 * @file apps/backend/src/modules/characters/repositories/CharactersRepository.ts
 * @description Repository for Character Prisma queries.
 *
 * Clean Architecture: Repository — abstracts Prisma ORM.
 * Services must never touch Prisma directly.
 *
 * All queries use `glyph` (not `simplified`) as the unique character identifier.
 * CharacterReading.characterId is a FK to Character.id — homophone queries
 * must resolve glyph → id first.
 */

import type { Prisma } from "@prisma/client";

import { prisma } from "../../../shared/infrastructure/database/client.js";
import type { SearchParams } from "../types/characters.js";

// ── Internal Query Result Types ──────────────────────────────────────────

/** Full character with all relations for the detail endpoint. */
export interface CharacterFull {
  id: string;
  glyph: string;
  traditional: string | null;
  strokeCount: number;
  classification: string | null;
  phoneticComponentId: string | null;
  hskLevel: number | null;
  frequencyRank: number | null;
  definition: string | null;
  readings: unknown;
  characterReadings: Array<{
    id: string;
    characterId: string;
    pinyin: string;
    tone: number;
    type: string | null;
    commonality: number | null;
  }>;
  radicals: Array<{
    characterGlyph: string;
    radicalId: string;
    decompositionType: string | null;
  }>;
  hskLevels: Array<{ hskLevel: number }>;
  phoneticComponent: {
    glyph: string;
    readings: unknown;
    definition: string | null;
  } | null;
}

/** Character with readings and HSK levels for search results. */
interface CharacterWithReadings {
  id: string;
  glyph: string;
  hskLevel: number | null;
  frequencyRank: number | null;
  characterReadings: Array<{
    pinyin: string;
    tone: number;
  }>;
  hskLevels: Array<{ hskLevel: number }>;
}

/** Homophone character with its reading data. */
interface HomophoneReadingWithCharacter {
  id: string;
  characterId: string;
  pinyin: string;
  tone: number;
  type: string | null;
  character: {
    id: string;
    glyph: string;
    definition: string | null;
  };
}

/** Character component with resolved component details. */
interface CharacterComponentWithComponent {
  id: string;
  characterId: string;
  componentId: string;
  position: string | null;
  function: string | null;
  component: {
    glyph: string;
    meaning: string | null;
  };
}

/** Frequency list character entry. */
interface CharacterFrequencyEntry {
  id: string;
  glyph: string;
  frequencyRank: number | null;
  hskLevel: number | null;
  characterReadings: Array<{
    pinyin: string;
    tone: number;
  }>;
}

// ── Repository ───────────────────────────────────────────────────────────

/**
 * Repository for character-related database queries.
 */
export class CharactersRepository {
  /**
   * Find radical reference rows by their business-key IDs (rad_XXXX).
   * Backs CharactersService.resolveRadical — replaces the former file read of
   * content/radicals/radicals.json (all-in-DB: Radical table).
   *
   * @param ids - Radical IDs to fetch (e.g. ["rad_0038"])
   * @returns Matching Radical rows (id, glyph, meaning)
   */
  async findRadicalsByIds(
    ids: string[],
  ): Promise<Array<{ id: string; glyph: string; meaning: string }>> {
    if (ids.length === 0) return [];
    return prisma.radical.findMany({
      where: { id: { in: ids } },
      select: { id: true, glyph: true, meaning: true },
    });
  }

  /**
   * Find a character by its glyph, including all related data.
   *
   * @param glyph - The character glyph (e.g., "好")
   * @returns Full character record with relations, or null if not found
   */
  async findByGlyph(glyph: string): Promise<CharacterFull | null> {
    const character = await prisma.character.findUnique({
      where: { glyph },
      include: {
        characterReadings: true,
        hskLevels: true,
        radicals: {
          select: {
            characterGlyph: true,
            radicalId: true,
            decompositionType: true,
          },
        },
        phoneticComponent: {
          select: {
            glyph: true,
            readings: true,
            definition: true,
          },
        },
      },
    });

    if (!character) return null;

    // CharacterFull matches the prisma shape; readings JSON is cast below
    return {
      id: character.id,
      glyph: character.glyph,
      traditional: character.traditional,
      strokeCount: character.strokeCount,
      classification: character.classification,
      phoneticComponentId: character.phoneticComponentId,
      hskLevel: character.hskLevel,
      frequencyRank: character.frequencyRank,
      definition: character.definition,
      readings: character.readings,
      characterReadings: character.characterReadings.map((r) => ({
        id: r.id,
        characterId: r.characterId,
        pinyin: r.pinyin,
        tone: r.tone,
        type: r.type,
        commonality: r.commonality,
      })),
      radicals: character.radicals.map((r) => ({
        characterGlyph: r.characterGlyph,
        radicalId: r.radicalId,
        decompositionType: r.decompositionType,
      })),
      hskLevels: character.hskLevels.map((hl) => ({ hskLevel: hl.hskLevel })),
      phoneticComponent: character.phoneticComponent,
    };
  }

  /**
   * Find the phonetic component character for a given glyph.
   * Returns the referenced character via the phoneticComponent self-relation.
   *
   * @param glyph - The character glyph
   * @returns Phonetic component data or null if not found/not present
   */
  async findPhoneticComponent(glyph: string): Promise<{
    glyph: string;
    readings: unknown;
    definition: string | null;
  } | null> {
    const character = await prisma.character.findUnique({
      where: { glyph },
      select: {
        phoneticComponent: {
          select: {
            glyph: true,
            readings: true,
            definition: true,
          },
        },
      },
    });

    if (!character || !character.phoneticComponent) return null;
    return character.phoneticComponent;
  }

  /**
   * Find homophones for a given character by pinyin matching.
   * Two-step: resolve glyph → Character.id, then query CharacterReading by characterId.
   *
   * @param glyph - The character glyph to find homophones for
   * @param exactTone - If true, also match tone number (in addition to pinyin)
   * @returns Array of reading records with character details
   */
  async findHomophones(
    glyph: string,
    exactTone: boolean,
  ): Promise<{
    sourceReadings: Array<{ pinyin: string; tone: number }>;
    homophoneReadings: HomophoneReadingWithCharacter[];
  }> {
    // Step 1: Resolve source character ID
    const source = await prisma.character.findUnique({
      where: { glyph },
      select: { id: true },
    });

    if (!source) {
      return { sourceReadings: [], homophoneReadings: [] };
    }

    // Step 2: Get readings for source character
    const sourceReadings = await prisma.characterReading.findMany({
      where: { characterId: source.id },
      select: { pinyin: true, tone: true },
    });

    if (sourceReadings.length === 0) {
      return { sourceReadings: [], homophoneReadings: [] };
    }

    // Step 3: Build pinyin filter
    const pinyinSet = [...new Set(sourceReadings.map((r) => r.pinyin))];

    // Build where condition for homophone readings
    const where: Prisma.CharacterReadingWhereInput = {
      pinyin: { in: pinyinSet },
      characterId: { not: source.id },
    };

    if (exactTone) {
      const toneSet = [...new Set(sourceReadings.map((r) => r.tone))];
      where.tone = { in: toneSet };
    }

    const homophoneReadings = await prisma.characterReading.findMany({
      where,
      include: {
        character: {
          select: {
            id: true,
            glyph: true,
            definition: true,
          },
        },
      },
      take: 50,
    });

    return {
      sourceReadings,
      homophoneReadings: homophoneReadings as HomophoneReadingWithCharacter[],
    };
  }

  /**
   * Find decomposition components for a character.
   * Resolves glyph → Character.id first, then queries CharacterComponent.
   *
   * @param glyph - The character glyph
   * @returns Array of character components with resolved component data
   */
  async findDecomposition(glyph: string): Promise<CharacterComponentWithComponent[]> {
    const character = await prisma.character.findUnique({
      where: { glyph },
      select: { id: true },
    });

    if (!character) return [];

    const components = await prisma.characterComponent.findMany({
      where: { characterId: character.id },
      include: {
        component: {
          select: { glyph: true, meaning: true },
        },
      },
      orderBy: { position: "asc" },
    });

    return components as CharacterComponentWithComponent[];
  }

  /**
   * Search characters by pinyin (partial match), tone filter, or HSK level.
   * Requires at least one filter parameter.
   *
   * @param params - Search parameters (q, tone, hskLevel)
   * @returns Array of matching character records with readings
   */
  async searchCharacters(params: SearchParams): Promise<CharacterWithReadings[]> {
    const { q, tone, hskLevel } = params;

    // Build where clause dynamically
    const where: Prisma.CharacterWhereInput = {};

    if (q) {
      where.characterReadings = {
        some: { pinyin: { contains: q } },
      };
    }

    if (tone) {
      const toneFilter = { some: { tone: parseInt(tone, 10) } };
      if (where.characterReadings) {
        where.characterReadings = {
          some: {
            ...((where.characterReadings as { some?: Record<string, unknown> }).some ?? {}),
            ...toneFilter.some,
          },
        };
      } else {
        where.characterReadings = toneFilter;
      }
    }

    if (hskLevel) {
      where.hskLevels = {
        some: { hskLevel: parseInt(hskLevel, 10) },
      };
    }

    const characters = await prisma.character.findMany({
      where,
      select: {
        id: true,
        glyph: true,
        hskLevel: true,
        frequencyRank: true,
        characterReadings: {
          select: { pinyin: true, tone: true },
        },
        hskLevels: {
          select: { hskLevel: true },
        },
      },
      take: 50,
    });

    return characters as CharacterWithReadings[];
  }

  /**
   * Find characters ordered by frequency rank, optionally filtered by HSK tier.
   * Supports pagination.
   *
   * @param tier - Optional HSK tier filter (1-6)
   * @param page - Page number (1-based, default: 1)
   * @param pageSize - Items per page (default: 50)
   * @returns Array of frequency entries with glyph, rank, and reading data
   */
  async findFrequencyList(
    tier?: number,
    page: number = 1,
    pageSize: number = 50,
  ): Promise<{ data: CharacterFrequencyEntry[]; total: number }> {
    const skip = (page - 1) * pageSize;

    const where: Prisma.CharacterWhereInput = {};
    if (tier !== undefined) {
      where.hskLevels = { some: { hskLevel: tier } };
    }

    const [characters, total] = await Promise.all([
      prisma.character.findMany({
        where,
        select: {
          id: true,
          glyph: true,
          frequencyRank: true,
          hskLevel: true,
          characterReadings: {
            select: { pinyin: true, tone: true },
            take: 1,
          },
        },
        orderBy: { frequencyRank: "asc" },
        skip,
        take: pageSize,
      }),
      prisma.character.count({ where }),
    ]);

    return { data: characters as CharacterFrequencyEntry[], total };
  }
}
