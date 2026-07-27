/**
 * @file apps/backend/src/shared/infrastructure/content/ContentIndexService.ts
 * @description ContentIndexService — provides content metadata from the filesystem.
 * ContentItem table was removed in Phase C; content is queried directly from
 * DB models (Character, Word, Radical, etc.) instead.
 *
 * Clean Architecture: Infrastructure layer — bridges content filesystem with database.
 */
import { createLogger } from "../../utils/logger.js";

const logger = createLogger("ContentIndexService");

export class ContentIndexService {
  /**
   * syncManifest is a no-op since ContentItem table was removed in Phase C.
   * Content is queried directly from DB models (Character, Word, Radical, etc.).
   * @returns 0
   */
  async syncManifest(): Promise<number> {
    logger.info("ContentIndex: ContentItem table was removed in Phase C — sync is a no-op");
    return 0;
  }

  /**
   * getPhaseContent is deprecated — ContentItem table was removed in Phase C.
   * Query content directly from the specific DB model.
   * @returns Empty array
   */
  async getPhaseContent(_phaseId: number): Promise<unknown[]> {
    logger.warn("ContentIndex: getPhaseContent is deprecated (ContentItem removed in Phase C)");
    return [];
  }

  /**
   * getContentByType is deprecated — ContentItem table was removed in Phase C.
   * Query content directly from the specific DB model.
   * @returns Empty array
   */
  async getContentByType(_contentType: string): Promise<unknown[]> {
    logger.warn("ContentIndex: getContentByType is deprecated (ContentItem removed in Phase C)");
    return [];
  }
}

/**
 * Module-level singleton instance.
 */
let instance: ContentIndexService | null = null;

/**
 * Get or create the ContentIndexService singleton.
 * @returns ContentIndexService
 */
export function getContentIndexService(): ContentIndexService {
  if (!instance) {
    instance = new ContentIndexService();
  }
  return instance;
}
