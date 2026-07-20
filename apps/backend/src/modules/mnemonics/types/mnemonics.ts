/**
 * @file apps/backend/src/modules/mnemonics/types/mnemonics.ts
 * @description Type definitions for the Mnemonics module.
 *
 * Clean Architecture: Domain types (entities, value objects, repository interfaces).
 */

/**
 * Error thrown when no mnemonic story is found for a character.
 */
export class MnemonicNotFoundError extends Error {
  constructor(characterGlyph: string) {
    super(`No mnemonic story found for character: ${characterGlyph}`);
    this.name = "MnemonicNotFoundError";
  }
}

/**
 * Pictograph skip-list — characters that are simple drawings and cannot
 * be decomposed into radical-based mnemonics.
 */
export const PICTOGRAPH_CHARS = new Set([
  "人",
  "大",
  "小",
  "口",
  "目",
  "山",
  "水",
  "火",
  "日",
  "月",
  "木",
  "田",
  "土",
  "石",
  "雨",
  "云",
  "牛",
  "马",
  "羊",
  "鸟",
  "鱼",
  "龙",
  "虎",
  "鹿",
  "象",
  "龟",
  "虫",
  "贝",
  "网",
  "车",
]);

/**
 * Radical decomposition for a character — used in prompt building.
 */
export interface RadicalDecomposition {
  radicalId: string;
  radicalLabel?: string;
  radicalMeaning?: string;
}

/**
 * Mnemonic story as stored in the database.
 */
export interface MnemonicStoryRecord {
  id: string;
  characterGlyph: string;
  userId: string | null;
  story: string;
  radicalIds: string[];
  isEdited: boolean;
  isPictograph: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mnemonic story response sent to the client.
 */
export interface MnemonicStoryResponse {
  characterGlyph: string;
  story: string;
  radicalIds: string[];
  isEdited: boolean;
  isPictograph: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Request body for creating/updating a mnemonic story.
 */
export interface MnemonicUpsertRequest {
  story: string;
  radicalIds?: string[];
}

/**
 * Mnemonic repository interface.
 */
export interface IMnemonicsRepository {
  findByCharacterAndUser(
    characterGlyph: string,
    userId: string | null,
    isEdited?: boolean,
  ): Promise<MnemonicStoryRecord | null>;

  findAnyByCharacter(
    characterGlyph: string,
    isEdited?: boolean,
  ): Promise<MnemonicStoryRecord | null>;

  upsert(
    characterGlyph: string,
    userId: string | null,
    story: string,
    radicalIds: string[],
    isPictograph: boolean,
    isEdited: boolean,
  ): Promise<MnemonicStoryRecord>;

  deleteByCharacterAndUser(characterGlyph: string, userId: string): Promise<void>;
}

/**
 * Mnemonic service interface.
 */
export interface IMnemonicsService {
  getMnemonic(characterGlyph: string, userId?: string): Promise<MnemonicStoryResponse>;

  generateMnemonic(characterGlyph: string, userId: string): Promise<MnemonicStoryResponse>;

  updateMnemonic(
    characterGlyph: string,
    userId: string,
    story: string,
    radicalIds?: string[],
  ): Promise<MnemonicStoryResponse>;

  resetMnemonic(characterGlyph: string, userId: string): Promise<void>;
}
