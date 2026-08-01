// GCSClient.ts
// Google Cloud Storage (GCS) infrastructure client
// Low-level storage operations - business logic belongs in core/services/
//
// NOTE: Currently uses GOOGLE_TTS_CREDENTIALS_RAW as fallback for GCS operations.
// For production, consider creating a dedicated GCS service account with only
// Storage Object Creator and Storage Object Viewer roles for better security isolation.
// Set via GCS_CREDENTIALS_RAW environment variable.
//
import { Storage, File } from "@google-cloud/storage";
import { config } from "../../config/index.js";

/**
 * Google Cloud Storage infrastructure client.
 */
export class GCSClient {
  private storageClient: Storage | null = null;
  private bucketName: string | null = null;

  private getClient(): Storage {
    if (!this.storageClient) {
      const credentials = config.gcsCredentials;
      if (!credentials) {
        throw new Error(
          "GCS credentials not found. Set GCS_CREDENTIALS_RAW or GOOGLE_TTS_CREDENTIALS_RAW with a service account that has Storage Object Creator role.",
        );
      }
      this.storageClient = new Storage({
        credentials: credentials,
        projectId: credentials.project_id as string | undefined,
      });
    }
    return this.storageClient;
  }

  private getBucket(): string {
    if (!this.bucketName) {
      const bucket = config.gcsBucket;
      if (!bucket) throw new Error("GCS_BUCKET_NAME env var not set");
      this.bucketName = bucket;
    }
    return this.bucketName;
  }

  private getFile(filePath: string, bucket?: string): File {
    const client = this.getClient();
    const resolvedBucket = bucket || this.getBucket();
    return client.bucket(resolvedBucket).file(filePath);
  }

  /** @deprecated Use getFile via a public method — kept for GcsFileStore compatibility */
  getGCSFile(filePath: string, bucket?: string): File {
    return this.getFile(filePath, bucket);
  }

  async fileExists(filePath: string, bucket?: string): Promise<boolean> {
    const file = this.getFile(filePath, bucket);
    const [exists] = await file.exists();
    return exists;
  }

  async downloadFile(filePath: string, bucket?: string): Promise<Buffer> {
    const file = this.getFile(filePath, bucket);
    const [contents] = await file.download();
    return contents;
  }

  async uploadFile(
    filePath: string,
    buffer: Buffer,
    contentType: string = "application/octet-stream",
    bucket?: string,
  ): Promise<void> {
    const file = this.getFile(filePath, bucket);

    // Match old conversationCache.js behavior (line 62):
    // Use { contentType } directly - this doesn't trigger delete operation
    await file.save(buffer, { contentType });
  }

  /**
   * List files in a GCS bucket matching a prefix.
   * @param prefix - Path prefix to filter by (e.g. "content/pinyin/")
   * @param bucket - Optional bucket name; falls back to getBucket()
   * @returns Array of file paths
   */
  async listFiles(prefix: string, bucket?: string): Promise<string[]> {
    const resolvedBucket = bucket || this.getBucket();
    const client = this.getClient();
    const [files] = await client.bucket(resolvedBucket).getFiles({ prefix });
    return files
      .map((f: File) => f.name)
      .filter((name: string) => name.endsWith(".json"))
      .sort();
  }

  /**
   * Get public URL for a GCS file
   * @param filePath - Path to file in bucket
   * @param bucket - Optional bucket name; falls back to getBucket()
   * @returns Public URL
   */
  getPublicUrl(filePath: string, bucket?: string): string {
    const resolvedBucket = bucket || this.getBucket();
    return `https://storage.googleapis.com/${resolvedBucket}/${filePath}`;
  }

  /**
   * Get a short-lived signed (read) URL for a GCS file.
   * Signed URLs are self-authenticating — auth lives in the query string — so
   * they are directly playable by a browser <audio>/Audio() element, which
   * cannot attach Authorization headers. Unlike getPublicUrl(), this does NOT
   * require the bucket or object to be publicly readable.
   *
   * Signature mirrors GcsFileStore.getSignedUrl (objectPath, expirySeconds).
   * @param filePath - Path to file in bucket
   * @param expirySeconds - Signed URL lifetime (default 3600 = 1 hour)
   * @param bucket - Optional bucket name; falls back to getBucket()
   * @returns Signed read URL
   */
  async getSignedUrl(
    filePath: string,
    expirySeconds: number = 3600,
    bucket?: string,
  ): Promise<string> {
    const file = this.getFile(filePath, bucket);
    const expires = Date.now() + expirySeconds * 1000;
    const [url] = await file.getSignedUrl({ action: "read" as const, expires });
    return url;
  }
}
