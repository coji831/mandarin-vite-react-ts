// Dedicated Google Cloud Storage (GCS) service
import { Storage } from "@google-cloud/storage";
import { config } from "../config/index.js";

let storageClient = null;
let bucketName = null;

export function getGCSClient() {
  if (!storageClient) {
    const credentials = config.gcsCredentials;
    if (!credentials) {
      throw new Error(
        "GCS credentials not found. Set GCS_CREDENTIALS_RAW or GOOGLE_TTS_CREDENTIALS_RAW."
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

export function getGCSFile(filePath) {
  const client = getGCSClient();
  const bucket = getBucketName();
  return client.bucket(bucket).file(filePath);
}

export async function fileExists(filePath) {
  const file = getGCSFile(filePath);
  const [exists] = await file.exists();
  return exists;
}

export async function downloadFile(filePath) {
  const file = getGCSFile(filePath);
  const [contents] = await file.download();
  return contents;
}

export async function uploadFile(filePath, buffer, contentType = "application/octet-stream") {
  const file = getGCSFile(filePath);
  await file.save(buffer, { contentType });
}

export function getPublicUrl(filePath) {
  const bucket = getBucketName();
  return `https://storage.googleapis.com/${bucket}/${filePath}`;
}
