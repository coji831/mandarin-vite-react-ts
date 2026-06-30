/**
 * Upload Content Files to GCS
 *
 * Reads all JSON files from the local content/ directory and uploads them
 * to the GCS bucket under the content/ prefix — mirroring the local structure.
 *
 * In production, the backend's readContentDir/readContentFiles functions load
 * content from GCS instead of the local filesystem (see contentUtils.js).
 *
 * Usage:
 *   node scripts/upload-content-to-gcs.js
 *
 * Environment variables (from .env.local):
 *   GCS_BUCKET_NAME     - Target GCS bucket (default: mandarin-tts-app-cache)
 *   GCS_CREDENTIALS_RAW - Service account JSON (stringified)
 *   GOOGLE_TTS_CREDENTIALS_RAW - Fallback if GCS_CREDENTIALS_RAW is not set
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Storage } from "@google-cloud/storage";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Config ────────────────────────────────────────────

const CONTENT_DIR = path.resolve(__dirname, "..", "content");
const BUCKET_NAME = process.env.GCS_BUCKET_NAME || "mandarin-tts-app-cache";
const GCS_PREFIX = "content/";

// Supported content subdirectories to upload
const SUBDIRS = [
  "characters",
  "chengyu",
  "grammar",
  "pinyin",
  "radicals",
  "references",
  "tones",
  "words",
];

// ── GCS Client Setup ─────────────────────────────────

function getCredentials() {
  const raw = process.env.GCS_CREDENTIALS_RAW || process.env.GOOGLE_TTS_CREDENTIALS_RAW;
  if (!raw) {
    console.error(
      "❌ GCS credentials not found. Set GCS_CREDENTIALS_RAW or GOOGLE_TTS_CREDENTIALS_RAW.",
    );
    process.exit(1);
  }
  try {
    return JSON.parse(raw);
  } catch {
    console.error("❌ Failed to parse GCS credentials JSON.");
    process.exit(1);
  }
}

function getStorageClient() {
  const credentials = getCredentials();
  return new Storage({ credentials, projectId: credentials.project_id });
}

// ── Upload Logic ──────────────────────────────────────

async function uploadFile(storage, localPath, gcsPath) {
  try {
    await storage.bucket(BUCKET_NAME).upload(localPath, {
      destination: gcsPath,
      contentType: "application/json",
    });
    console.log(`  ✅ uploaded: ${gcsPath}`);
    return true;
  } catch (err) {
    console.error(`  ❌ failed: ${gcsPath} — ${err.message}`);
    return false;
  }
}

async function uploadDirectory(storage, subDir) {
  const dirPath = path.join(CONTENT_DIR, subDir);
  if (!fs.existsSync(dirPath)) {
    console.log(`  ⏭️  skipped (not found): ${subDir}/`);
    return { total: 0, success: 0 };
  }

  const files = fs
    .readdirSync(dirPath)
    .filter((f) => f.endsWith(".json"))
    .sort();

  if (files.length === 0) {
    console.log(`  ⏭️  skipped (no JSON files): ${subDir}/`);
    return { total: 0, success: 0 };
  }

  console.log(`\n📂 ${subDir}/ (${files.length} files):`);
  let success = 0;

  for (const file of files) {
    const localPath = path.join(dirPath, file);
    const gcsPath = `${GCS_PREFIX}${subDir}/${file}`;
    const ok = await uploadFile(storage, localPath, gcsPath);
    if (ok) success++;
  }

  return { total: files.length, success };
}

// ── Main ──────────────────────────────────────────────

async function main() {
  console.log("═".repeat(60));
  console.log("  Content → GCS Upload");
  console.log(`  Bucket: ${BUCKET_NAME}`);
  console.log(`  Prefix: ${GCS_PREFIX}`);
  console.log("═".repeat(60));

  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`❌ Content directory not found: ${CONTENT_DIR}`);
    process.exit(1);
  }

  const storage = getStorageClient();
  let totalFiles = 0;
  let totalSuccess = 0;

  for (const subDir of SUBDIRS) {
    const { total, success } = await uploadDirectory(storage, subDir);
    totalFiles += total;
    totalSuccess += success;
  }

  console.log("\n" + "═".repeat(60));
  console.log(`  Complete: ${totalSuccess}/${totalFiles} files uploaded`);
  console.log(`  Bucket: gs://${BUCKET_NAME}/${GCS_PREFIX}`);
  console.log("═".repeat(60));

  if (totalSuccess < totalFiles) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Upload failed:", err.message);
  process.exit(1);
});
