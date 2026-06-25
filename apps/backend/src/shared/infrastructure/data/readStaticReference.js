/**
 * @file apps/backend/src/shared/infrastructure/data/readStaticReference.js
 * @description Generic utility to read static reference data from GCS (prod) or local file (dev).
 * Used for read-only reference datasets: pinyin/tones, radicals, characters, grammar, idioms.
 * NOT for dynamic per-user data — those use the Repository pattern.
 *
 * Cache: Module-level Map — survives for process lifetime, cleared on restart.
 */

import fs from "fs";
import path from "path";
import { config } from "../../config/index.js";
import { downloadFile } from "../external/GCSClient.js";

const cache = new Map();

/**
 * Read a static reference JSON file from GCS (production) or local filesystem (development).
 * Results are cached in-memory for the process lifetime.
 *
 * @param {string} relativePath — Path relative to the data/ directory, e.g. "foundations/pinyin-tones-pool.json"
 * @returns {Promise<Object>} Parsed JSON content
 */
export async function readStaticReference(relativePath) {
  if (cache.has(relativePath)) return cache.get(relativePath);

  let raw;
  if (config.nodeEnvironment === "production" && config.gcsBucket) {
    const buffer = await downloadFile(relativePath, config.gcsBucket);
    raw = buffer.toString();
  } else {
    const localPath = path.resolve(config.localDataPath, relativePath);
    raw = fs.readFileSync(localPath, "utf-8");
  }

  const data = JSON.parse(raw);
  cache.set(relativePath, data);
  return data;
}
