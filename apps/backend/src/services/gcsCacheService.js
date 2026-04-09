import { createLogger } from "../utils/logger.js";
import * as gcsClient from "../infrastructure/external/GCSClient.js";

const logger = createLogger("GcsCacheService");

export class GcsCacheService {
  constructor() {}

  async get(objectPath) {
    try {
      const exists = await gcsClient.fileExists(objectPath);
      if (!exists) {
        logger.cacheMiss(objectPath);
        return null;
      }

      const buf = await gcsClient.downloadFile(objectPath);
      const str = Buffer.isBuffer(buf) ? buf.toString("utf-8") : buf.toString();
      logger.cacheHit(objectPath);
      try {
        return JSON.parse(str);
      } catch (err) {
        logger.error("Failed to parse cached JSON", {
          path: objectPath,
          error: err?.message,
        });
        return null;
      }
    } catch (err) {
      logger.error("GCS get failed", err);
      return null;
    }
  }

  async set(objectPath, obj) {
    try {
      const buf = Buffer.from(JSON.stringify(obj));
      await gcsClient.uploadFile(objectPath, buf, "application/json");
      logger.info(`Wrote cache: ${objectPath}`);
    } catch (err) {
      // Log full error but do not surface to client (cache write is best-effort)
      logger.error("GCS set failed", err);
    }
  }
}

export default GcsCacheService;
