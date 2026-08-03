/**
 * @file apps/backend/src/modules/audio/services/AudioUrlSigner.ts
 * @description Signed/public URL helpers for audio. Signed URLs are
 * short-lived and re-signed on every read so a browser <audio>/Audio() element
 * (which cannot attach Authorization headers) can play them.
 */

import { audioConfig } from "../config.js";
import type { GcsClientLike } from "../types/audio.js";

export class AudioUrlSigner {
  constructor(private readonly gcs: GcsClientLike) {}

  /** Re-sign a fresh short-lived read URL for a GCS path. */
  async getSignedUrl(
    path: string,
    expirySeconds: number = audioConfig.signedUrlTtlSeconds,
  ): Promise<string> {
    return this.gcs.getSignedUrl(path, expirySeconds);
  }

  /** Public (unauthenticated) URL — requires the object/bucket to be publicly readable. */
  getPublicUrl(path: string): string {
    return this.gcs.getPublicUrl?.(path) ?? `https://storage.googleapis.com/${path}`;
  }
}
