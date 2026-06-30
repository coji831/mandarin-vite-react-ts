/**
 * @file apps/backend/src/shared/infrastructure/content/ContentIndexService.js
 * @description ContentIndexService — syncs content/manifest.json → ContentItem Prisma table.
 * Provides phase-based content queries with LRU cache (5min TTL).
 *
 * Clean Architecture: Infrastructure layer — bridges content filesystem with database registry.
 * Uses shared contentUtils for filesystem/GCS abstraction.
 */
import { createLogger } from "../../utils/logger.js";
import { readContentFile, readContentDir } from "../../utils/contentUtils.js";
import { prisma } from "../database/client.js";

const logger = createLogger("ContentIndexService");

// Phase mapping: content subdirectory → phaseId
const PHASE_MAP = {
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
const CONTENT_TYPE_MAP = {
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
function extractTitle(contentType, data) {
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

function extractSubtitle(contentType, data) {
  switch (contentType) {
    case "radical":
      return data.meaning || null;
    case "character":
      return data.readings?.[0]?.core_meaning || null;
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

export class ContentIndexService {
  constructor() {
    this._cache = null;
    this._cacheTimestamp = 0;
    this._manifestVersion = null;
  }

  /**
   * Sync content/manifest.json → ContentItem database.
   * Reads the manifest and all content files, upserts ContentItem rows.
   * Called on cold start or when manifest version changes.
   * @returns {Promise<number>} Number of items upserted
   */
  async syncManifest() {
    logger.info("Syncing content manifest to ContentItem registry...");

    // Read manifest from content root (empty subDir) using shared contentUtils
    const manifestData = await readContentFile("", "manifest.json");

    const { content_types } = manifestData;
    const manifestVersion = manifestData.version || 1;
    let totalUpserted = 0;

    for (const contentType of content_types) {
      const phaseId = PHASE_MAP[contentType];
      if (!phaseId) {
        logger.warn(`No phase mapping for content type: ${contentType}, skipping`);
        continue;
      }

      const registryType = CONTENT_TYPE_MAP[contentType];
      const items = [];

      if (contentType === "radicals") {
        // Radicals have explicit file lists in the manifest
        const radicalFiles = manifestData.radicals?.files || [];
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
              metadata: data.metadata || null,
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
              metadata: data.metadata || null,
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
            metadata: item.metadata,
            version: manifestVersion,
          },
          create: {
            id: item.id,
            contentType: item.contentType,
            contentId: item.contentId,
            phaseId: item.phaseId,
            title: item.title,
            subtitle: item.subtitle,
            metadata: item.metadata,
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
   * @param {number} phaseId - 1 | 2 | 3 | 4
   * @returns {Promise<Array>}
   */
  async getPhaseContent(phaseId) {
    await this._ensureSynced();
    return this._cached(async () => {
      return prisma.contentItem.findMany({
        where: { phaseId, isActive: true },
        orderBy: { contentId: "asc" },
      });
    }, `phase-${phaseId}`);
  }

  /**
   * Get all ContentItems for a given content type.
   * Results are cached with 5min TTL.
   * @param {string} contentType - e.g., "radical", "character", "pinyin"
   * @returns {Promise<Array>}
   */
  async getContentByType(contentType) {
    await this._ensureSynced();
    return this._cached(async () => {
      return prisma.contentItem.findMany({
        where: { contentType, isActive: true },
        orderBy: { contentId: "asc" },
      });
    }, `type-${contentType}`);
  }

  /**
   * Invalidate the internal cache.
   */
  _invalidateCache() {
    this._cache = new Map();
    this._cacheTimestamp = Date.now();
  }

  /**
   * Cached query helper — caches per-key with TTL expiry.
   * @param {Function} queryFn - Async function to execute on cache miss
   * @param {string} key - Cache key
   * @returns {Promise<any>}
   */
  async _cached(queryFn, key) {
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
  async _ensureSynced() {
    if (this._manifestVersion === null) {
      await this.syncManifest();
    }
  }
}

/**
 * Module-level singleton instance.
 */
let instance = null;

/**
 * Get or create the ContentIndexService singleton.
 * @returns {ContentIndexService}
 */
export function getContentIndexService() {
  if (!instance) {
    instance = new ContentIndexService();
  }
  return instance;
}
