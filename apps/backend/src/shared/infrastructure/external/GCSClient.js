// GCSClient.js
// Google Cloud Storage (GCS) infrastructure client
// Low-level storage operations - business logic belongs in core/services/
//
// NOTE: Currently uses GOOGLE_TTS_CREDENTIALS_RAW as fallback for GCS operations.
// For production, consider creating a dedicated GCS service account with only
// Storage Object Creator and Storage Object Viewer roles for better security isolation.
// Set via GCS_CREDENTIALS_RAW environment variable.
//
import { Storage } from "@google-cloud/storage";
import { config } from "../../config/index.js";

let storageClient = null;
let bucketName = null;

export function getGCSClient() {
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

export function getBucketName() {
  if (!bucketName) {
    bucketName = config.gcsBucket;
    if (!bucketName) throw new Error("GCS_BUCKET_NAME env var not set");
  }
  return bucketName;
}

export function getGCSFile(filePath, bucket) {
  const client = getGCSClient();
  const resolvedBucket = bucket || getBucketName();
  return client.bucket(resolvedBucket).file(filePath);
}

export async function fileExists(filePath, bucket) {
  const file = getGCSFile(filePath, bucket);
  const [exists] = await file.exists();
  return exists;
}

export async function downloadFile(filePath, bucket) {
  const file = getGCSFile(filePath, bucket);
  const [contents] = await file.download();
  return contents;
}

export async function uploadFile(
  filePath,
  buffer,
  contentType = "application/octet-stream",
  bucket,
) {
  const file = getGCSFile(filePath, bucket);

  // Match old conversationCache.js behavior (line 62):
  // Use { contentType } directly - this doesn't trigger delete operation
  await file.save(buffer, { contentType });
}

/**
 * Get public URL for a GCS file
 * @param {string} filePath - Path to file in bucket
 * @param {string} [bucket] - Optional bucket name; falls back to getBucketName()
 * @returns {string} Public URL
 */
export function getPublicUrl(filePath, bucket) {
  const resolvedBucket = bucket || getBucketName();
  return `https://storage.googleapis.com/${resolvedBucket}/${filePath}`;
}
