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

let storageClient: Storage | null = null;
let bucketName: string | null | undefined = null;

export function getGCSClient(): Storage {
  if (!storageClient) {
    const credentials = config.gcsCredentials;
    if (!credentials) {
      throw new Error(
        "GCS credentials not found. Set GCS_CREDENTIALS_RAW or GOOGLE_TTS_CREDENTIALS_RAW with a service account that has Storage Object Creator role.",
      );
    }
    storageClient = new Storage({
      credentials: credentials,
      projectId: credentials.project_id,
    });
  }
  return storageClient;
}

export function getBucketName(): string {
  if (!bucketName) {
    bucketName = config.gcsBucket;
    if (!bucketName) throw new Error("GCS_BUCKET_NAME env var not set");
  }
  return bucketName;
}

export function getGCSFile(filePath: string, bucket?: string): File {
  const client = getGCSClient();
  const resolvedBucket = bucket || getBucketName();
  return client.bucket(resolvedBucket).file(filePath);
}

export async function fileExists(filePath: string, bucket?: string): Promise<boolean> {
  const file = getGCSFile(filePath, bucket);
  const [exists] = await file.exists();
  return exists;
}

export async function downloadFile(filePath: string, bucket?: string): Promise<Buffer> {
  const file = getGCSFile(filePath, bucket);
  const [contents] = await file.download();
  return contents;
}

export async function uploadFile(
  filePath: string,
  buffer: Buffer,
  contentType: string = "application/octet-stream",
  bucket?: string,
): Promise<void> {
  const file = getGCSFile(filePath, bucket);

  // Match old conversationCache.js behavior (line 62):
  // Use { contentType } directly - this doesn't trigger delete operation
  await file.save(buffer, { contentType });
}

/**
 * List files in a GCS bucket matching a prefix.
 * @param prefix - Path prefix to filter by (e.g. "content/pinyin/")
 * @param bucket - Optional bucket name; falls back to getBucketName()
 * @returns Array of file paths
 */
export async function listFiles(prefix: string, bucket?: string): Promise<string[]> {
  const resolvedBucket = bucket || getBucketName();
  const client = getGCSClient();
  const [files] = await client.bucket(resolvedBucket).getFiles({ prefix });
  return files
    .map((f: File) => f.name)
    .filter((name: string) => name.endsWith(".json"))
    .sort();
}

/**
 * Get public URL for a GCS file
 * @param filePath - Path to file in bucket
 * @param bucket - Optional bucket name; falls back to getBucketName()
 * @returns Public URL
 */
export function getPublicUrl(filePath: string, bucket?: string): string {
  const resolvedBucket = bucket || getBucketName();
  return `https://storage.googleapis.com/${resolvedBucket}/${filePath}`;
}
