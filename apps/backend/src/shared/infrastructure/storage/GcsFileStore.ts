import { createLogger } from "../../utils/logger.js";
import { GCSClient } from "../external/GCSClient.js";

const logger = createLogger("GcsFileStore");

export class GcsFileStore {
  private gcsClient: GCSClient;
  private bucket: string | undefined;

  constructor({ bucket, gcsClient }: { bucket?: string; gcsClient?: GCSClient } = {}) {
    // Lazy by default — constructors take nothing; a client is created on
    // demand unless a shared GCSClient is injected (Nest DI, story 24-4).
    this.gcsClient = gcsClient ?? new GCSClient();
    this.bucket = bucket;
  }

  async exists(objectPath: string): Promise<boolean> {
    try {
      return await this.gcsClient.fileExists(objectPath, this.bucket);
    } catch (err) {
      logger.error("GCS exists failed", err);
      return false;
    }
  }

  async get(objectPath: string): Promise<object | null> {
    try {
      const exists = await this.gcsClient.fileExists(objectPath, this.bucket);
      if (!exists) {
        logger.cacheMiss(objectPath);
        return null;
      }

      const buf = (await this.gcsClient.downloadFile(objectPath, this.bucket)) as Buffer;
      const str = buf.toString("utf-8");
      logger.cacheHit(objectPath);
      try {
        return JSON.parse(str);
      } catch (err) {
        logger.error("Failed to parse cached JSON", {
          path: objectPath,
          error: (err as Error)?.message,
        });
        return null;
      }
    } catch (err) {
      logger.error("GCS get failed", err);
      return null;
    }
  }

  async set(
    objectPath: string,
    obj: unknown,
    contentType: string = "application/json",
  ): Promise<void> {
    try {
      // If caller provided a Buffer and a non-JSON content type, write raw bytes
      if (contentType !== "application/json" && Buffer.isBuffer(obj)) {
        await this.gcsClient.uploadFile(objectPath, obj, contentType, this.bucket);
      } else {
        const buf = Buffer.from(JSON.stringify(obj));
        await this.gcsClient.uploadFile(objectPath, buf, contentType, this.bucket);
      }
      logger.info(`Wrote cache: ${objectPath}`);
    } catch (err) {
      // Log full error but do not surface to client (cache write is best-effort)
      logger.error("GCS set failed", err);
    }
  }

  async getSignedUrl(objectPath: string, expirySeconds: number = 3600): Promise<string | null> {
    try {
      const file = this.gcsClient.getGCSFile(objectPath, this.bucket);
      const expiryMillis = Date.now() + expirySeconds * 1000;
      const [url] = await file.getSignedUrl({ action: "read" as const, expires: expiryMillis });
      return url;
    } catch (err) {
      logger.error("GCS getSignedUrl failed", err);
      return null;
    }
  }
}

export default GcsFileStore;
