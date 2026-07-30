/**
 * @file apps/backend/src/modules/mnemonics/repositories/MnemonicsRepository.ts
 * @description Repository for MnemonicStory Prisma queries.
 *
 * Clean Architecture: Repository — abstracts Prisma ORM.
 * Services must never touch Prisma directly.
 */

import { prisma } from "../../../shared/infrastructure/database/client.js";
import type { Prisma } from "@prisma/client";
import type { MnemonicStoryRecord } from "../types/mnemonics.js";

/**
 * Repository for mnemonic story persistence.
 * Direct Prisma queries — no RadicalsService imports (cross-module Prisma is allowed).
 */
export class MnemonicsRepository {
  /**
   * Find a mnemonic story by character glyph and user.
   * Optionally filter by isEdited status.
   */
  async findByCharacterAndUser(
    characterGlyph: string,
    userId: string | null,
    isEdited?: boolean,
  ): Promise<MnemonicStoryRecord | null> {
    const where: Record<string, unknown> = { characterGlyph };

    if (userId !== null) {
      where.userId = userId;
    }

    if (isEdited !== undefined) {
      where.isEdited = isEdited;
    }

    const record = await prisma.mnemonicStory.findFirst({ where });
    if (!record) return null;

    return this.toRecord(record);
  }

  /**
   * Find ANY mnemonic story for a character (shared AI version).
   * Used for the DB(AI) step in the 4-step lookup chain.
   */
  async findAnyByCharacter(
    characterGlyph: string,
    isEdited?: boolean,
  ): Promise<MnemonicStoryRecord | null> {
    const where: Record<string, unknown> = { characterGlyph };

    if (isEdited !== undefined) {
      where.isEdited = isEdited;
    }

    const record = await prisma.mnemonicStory.findFirst({ where });
    if (!record) return null;

    return this.toRecord(record);
  }

  /**
   * Upsert a mnemonic story — create or update if exists.
   * Accepts an explicit isEdited parameter instead of deriving it from isPictograph.
   * Handles null userId (shared AI stories) by using findFirst + create/update
   * since Prisma's upsert with composite unique doesn't match null values.
   */
  async upsert(
    characterGlyph: string,
    userId: string | null,
    story: string,
    radicalIds: string[],
    isPictograph: boolean,
    isEdited: boolean,
  ): Promise<MnemonicStoryRecord> {
    const existing = await prisma.mnemonicStory.findFirst({
      where: { characterGlyph, userId },
    });

    if (existing) {
      const record = await prisma.mnemonicStory.update({
        where: { id: existing.id },
        data: { story, radicalIds, isEdited, isPictograph },
      });
      return this.toRecord(record);
    }

    const record = await prisma.mnemonicStory.create({
      data: {
        characterGlyph,
        userId,
        story,
        radicalIds,
        isEdited,
        isPictograph,
      },
    });
    return this.toRecord(record);
  }

  /**
   * Delete a user's mnemonic story (reset to AI version).
   */
  async deleteByCharacterAndUser(characterGlyph: string, userId: string): Promise<void> {
    await prisma.mnemonicStory.deleteMany({
      where: {
        characterGlyph,
        userId,
      },
    });
  }

  /**
   * Fetch radical decomposition for a character directly from the CharacterRadical table.
   * Cross-module Prisma query — not importing RadicalsService, which is allowed.
   */
  async getCharacterRadicals(characterGlyph: string): Promise<
    Array<{
      characterGlyph: string;
      radicalId: string;
    }>
  > {
    return await prisma.characterRadical.findMany({
      where: { characterGlyph },
    });
  }

  /**
   * Fetch a character's classification and related data from the Character table.
   */
  async getCharacterByGlyph(glyph: string): Promise<{
    classification: string | null;
    phoneticComponentId: string | null;
    etymology: string | null;
    definition: string | null;
    readings: Array<{ pinyin: string; tone: number }> | null;
  } | null> {
    const char = await prisma.character.findUnique({
      where: { glyph },
      select: {
        classification: true,
        phoneticComponentId: true,
        etymology: true,
        definition: true,
        readings: true,
      },
    });
    return char as unknown as {
      classification: string | null;
      phoneticComponentId: string | null;
      etymology: string | null;
      definition: string | null;
      readings: Array<{ pinyin: string; tone: number }> | null;
    } | null;
  }

  /**
   * Fetch the phonetic component character's glyph, pinyin, and meaning.
   */
  async getPhoneticComponent(componentId: string): Promise<{
    glyph: string;
    pinyin: string;
    meaning: string;
  } | null> {
    const comp = await prisma.character.findUnique({
      where: { id: componentId },
      select: { glyph: true, readings: true, definition: true },
    });
    if (!comp) return null;
    const readings = (comp.readings as Array<{ pinyin: string; tone: number }> | null) || [];
    return {
      glyph: comp.glyph,
      pinyin: readings[0]?.pinyin ?? "",
      meaning: comp.definition ?? "",
    };
  }

  /**
   * Map Prisma model to domain record.
   */
  private toRecord(raw: {
    id: string;
    characterGlyph: string;
    userId: string | null;
    story: string;
    radicalIds: Prisma.JsonValue;
    isEdited: boolean;
    isPictograph: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): MnemonicStoryRecord {
    return {
      id: raw.id,
      characterGlyph: raw.characterGlyph,
      userId: raw.userId,
      story: raw.story,
      radicalIds:
        typeof raw.radicalIds === "string"
          ? JSON.parse(raw.radicalIds)
          : Array.isArray(raw.radicalIds)
            ? raw.radicalIds.map((id) => String(id))
            : [],
      isEdited: raw.isEdited,
      isPictograph: raw.isPictograph,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }
}
