/**
 * @file apps/backend/src/shared/infrastructure/content/ContentIndexService.ts
 * @description ContentIndexService — syncs content/manifest.json → ContentItem Prisma table.
 * Provides phase-based content queries with LRU cache (5min TTL).
 *
 * Clean Architecture: Infrastructure layer — bridges content filesystem with database registry.
 * Uses shared contentUtils for filesystem/GCS abstraction.
 */
import { createLogger } from "../../utils/logger.js";
import { readContentFile, readContentDir } from "../../utils/contentUtils.js";
import type { ContentFile } from "../../utils/contentUtils.js";
import { prisma } from "../database/client.js";
import type { Prisma } from "@prisma/client";

const logger = createLogger("ContentIndexService");

/** Shape of content/manifest.json. */
interface ManifestData {
  content_types?: string[];
  version?: number;
  radicals?: { files?: string[] };
  [key: string]: unknown;
}

/** Content metadata shape stored in ContentItem.metadata (JSON). */
interface ContentMetadata {
  pronunciation_guide?: string;
  hsk_characters?: Array<{ glyph: string; pinyin: string; meaning: string }>;
  etymology?: string;
  frequency_rank?: number;
  notes?: string;
  [key: string]: unknown;
}

// Phase mapping: content subdirectory → phaseId
const PHASE_MAP: Record<string, number> = {
  pinyin: 1,
  tones: 1,
  references: 1,
  radicals: 2,
  grammar: 2,
  characters: 3,
  chengyu: 4,
  words: 3,
};

// Content type identifiers used in the ContentItem registry
const CONTENT_TYPE_MAP: Record<string, string> = {
  pinyin: "pinyin",
  tones: "tone",
  references: "reference",
  radicals: "radical",
  grammar: "grammar",
  characters: "character",
  chengyu: "chengyu",
  words: "word",
};

// Cache TTL: 5 minutes
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Title extraction helpers per content type.
 */
function extractTitle(contentType: string, data: ContentFile): string {
  switch (contentType) {
    case "radical":
      return data.glyph || data.name_pinyin || data.id || "Unknown";
    case "character":
      return data.glyph || data.id || "Unknown";
    case "pinyin":
      return data.pinyin || data.id || "Unknown";
    case "tone":
      return `${data.name || ""} (${data.mark || ""})`.trim() || data.id || "Unknown";
    case "reference":
      return data.id || "Unknown";
    case "grammar":
      return data.name || data.id || "Unknown";
    case "chengyu":
      return data.glyph || data.id || "Unknown";
    case "word":
      return data.simplified || data.id || "Unknown";
    default:
      return data.id || "Unknown";
  }
}

function extractSubtitle(contentType: string, data: ContentFile): string | null {
  switch (contentType) {
    case "radical":
      return data.meaning || null;
    case "character": {
      const readings = data.readings;
      return String(readings?.[0]?.core_meaning ?? "") || null;
    }
    case "pinyin":
      return data.description || data.ipa || null;
    case "tone":
      return data.pitch_description || null;
    case "reference":
      return null;
    default:
      return null;
  }
}

interface ContentItemData {
  id: string;
  contentType: string;
  contentId: string;
  phaseId: number;
  title: string;
  subtitle: string | null;
  metadata: unknown;
}

export class ContentIndexService {
  private _cache: Map<string, unknown> | null;
  private _cacheTimestamp: number;
  private _manifestVersion: number | null;

  constructor() {
    this._cache = null;
    this._cacheTimestamp = 0;
    this._manifestVersion = null;
  }

  /**
   * Sync content/manifest.json → ContentItem database.
   * Reads the manifest and all content files, upserts ContentItem rows.
   * Called on cold start or when manifest version changes.
   * @returns Number of items upserted
   */
  async syncManifest(): Promise<number> {
    logger.info("Syncing content manifest to ContentItem registry...");

    // Read manifest from content root (empty subDir) using shared contentUtils
    const manifestData = (await readContentFile("", "manifest.json")) as ManifestData;

    const { content_types } = manifestData;
    const manifestVersion = manifestData.version || 1;
    let totalUpserted = 0;

    for (const contentType of content_types || []) {
      const phaseId = PHASE_MAP[contentType];
      if (!phaseId) {
        logger.warn(`No phase mapping for content type: ${contentType}, skipping`);
        continue;
      }

      const registryType = CONTENT_TYPE_MAP[contentType];
      const items: ContentItemData[] = [];

      if (contentType === "radicals") {
        // Radicals have explicit file lists in the manifest
        const manifestRadicals = manifestData.radicals;
        const radicalFiles = manifestRadicals?.files || [];
        for (const fileRef of radicalFiles) {
          try {
            const data = await readContentFile("radicals", fileRef);
            const contentId = fileRef.replace(".json", "");
            items.push({
              id: `${registryType}-${contentId}`,
              contentType: registryType,
              contentId,
              phaseId,
              title: extractTitle(registryType, data),
              subtitle: extractSubtitle(registryType, data),
              metadata: (data as { metadata?: ContentMetadata }).metadata || null,
            });
          } catch {
            logger.warn(`Radical file not found: radicals/${fileRef}, skipping`);
          }
        }
      } else {
        // Read all JSON files from the content subdirectory
        try {
          const files = await readContentDir(contentType);
          for (const data of files) {
            const contentId = (data.id || "").replace(".json", "");
            items.push({
              id: `${registryType}-${contentId}`,
              contentType: registryType,
              contentId,
              phaseId,
              title: extractTitle(registryType, data),
              subtitle: extractSubtitle(registryType, data),
              metadata: (data as { metadata?: ContentMetadata }).metadata || null,
            });
          }
        } catch {
          logger.warn(`Content directory not found: ${contentType}, skipping`);
          continue;
        }
      }

      // Upsert each item
      for (const item of items) {
        await prisma.contentItem.upsert({
          where: { id: item.id },
          update: {
            contentType: item.contentType,
            contentId: item.contentId,
            phaseId: item.phaseId,
            title: item.title,
            subtitle: item.subtitle,
            metadata: item.metadata as Prisma.InputJsonValue,
            version: manifestVersion,
          },
          create: {
            id: item.id,
            contentType: item.contentType,
            contentId: item.contentId,
            phaseId: item.phaseId,
            title: item.title,
            subtitle: item.subtitle,
            metadata: item.metadata as Prisma.InputJsonValue,
            version: manifestVersion,
          },
        });
        totalUpserted++;
      }
    }

    this._manifestVersion = manifestVersion;
    this._invalidateCache();

    logger.info(
      `ContentIndex sync complete: ${totalUpserted} items upserted (v${manifestVersion})`,
    );
    return totalUpserted;
  }

  /**
   * Get all ContentItems for a given phase.
   * Results are cached with 5min TTL.
   * @param phaseId - 1 | 2 | 3 | 4
   */
  async getPhaseContent(phaseId: number): Promise<unknown[]> {
    await this._ensureSynced();
    const result = await this._cached(async () => {
      return prisma.contentItem.findMany({
        where: { phaseId, isActive: true },
        orderBy: { contentId: "asc" },
      });
    }, `phase-${phaseId}`);
    return result as unknown[];
  }

  /**
   * Get all ContentItems for a given content type.
   * Results are cached with 5min TTL.
   * @param contentType - e.g., "radical", "character", "pinyin"
   */
  async getContentByType(contentType: string): Promise<unknown[]> {
    await this._ensureSynced();
    const result = await this._cached(async () => {
      return prisma.contentItem.findMany({
        where: { contentType, isActive: true },
        orderBy: { contentId: "asc" },
      });
    }, `type-${contentType}`);
    return result as unknown[];
  }

  /**
   * Invalidate the internal cache.
   */
  private _invalidateCache(): void {
    this._cache = new Map();
    this._cacheTimestamp = Date.now();
  }

  /**
   * Cached query helper — caches per-key with TTL expiry.
   * @param queryFn - Async function to execute on cache miss
   * @param key - Cache key
   */
  private async _cached(queryFn: () => Promise<unknown>, key: string): Promise<unknown> {
    if (!this._cache) {
      this._cache = new Map();
      this._cacheTimestamp = Date.now();
    }

    // Check TTL
    const age = Date.now() - this._cacheTimestamp;
    if (age > CACHE_TTL_MS) {
      this._cache.clear();
      this._cacheTimestamp = Date.now();
    }

    if (this._cache.has(key)) {
      return this._cache.get(key);
    }

    const result = await queryFn();
    this._cache.set(key, result);
    return result;
  }

  /**
   * Ensure the manifest has been synced at least once.
   * Auto-syncs if not yet synced.
   */
  private async _ensureSynced(): Promise<void> {
    if (this._manifestVersion === null) {
      await this.syncManifest();
    }
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
