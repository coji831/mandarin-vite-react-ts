import { createLogger } from "../utils/logger.js";
import * as gcsClient from "../infrastructure/external/GCSClient.js";

const logger = createLogger("GcsCacheService");

export class GcsCacheService {
  constructor() {}
  async exists(objectPath) {
    try {
      return await gcsClient.fileExists(objectPath);
    } catch (err) {
      logger.error("GCS exists failed", err);
      return false;
    }
  }

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

  async set(objectPath, obj, contentType = "application/json") {
    try {
      // If caller provided a Buffer and a non-JSON content type, write raw bytes
      if (contentType !== "application/json" && Buffer.isBuffer(obj)) {
        await gcsClient.uploadFile(objectPath, obj, contentType);
      } else {
        const buf = Buffer.from(JSON.stringify(obj));
        await gcsClient.uploadFile(objectPath, buf, contentType);
      }
      logger.info(`Wrote cache: ${objectPath}`);
    } catch (err) {
      // Log full error but do not surface to client (cache write is best-effort)
      logger.error("GCS set failed", err);
    }
  }

  async getSignedUrl(objectPath, expirySeconds = 3600) {
    try {
      const file = gcsClient.getGCSFile(objectPath);
      const expiryMillis = Date.now() + expirySeconds * 1000;
      const [url] = await file.getSignedUrl({ action: "read", expires: expiryMillis });
      return url;
    } catch (err) {
      logger.error("GCS getSignedUrl failed", err);
      return null;
    }
  }
}

export default GcsCacheService;
