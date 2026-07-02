/**
 * @file apps/backend/src/shared/utils/contentUtils.js
 * @description Shared utilities for reading from the content/ directory
 *
 * Centralizes content file reading, path resolution, and pinyin utilities
 * to eliminate duplication across services.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "../config/index.js";
import { downloadFile, listFiles } from "../infrastructure/external/GCSClient.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Content directory root (repo root /content/)
export const CONTENT_DIR = path.resolve(__dirname, "../../../../../content");

/**
 * Read all JSON files from a content subdirectory, sorted by filename.
 * @param subDir - e.g. "pinyin", "tones", "references"
 * @returns Parsed JSON objects
 */
export async function readContentDir(subDir: string): Promise<Record<string, unknown>[]> {
  if (config.nodeEnvironment === "production" && config.gcsBucket) {
    const prefix = `content/${subDir}/`;
    const files = await listFiles(prefix);
    const results = [];
    for (const filePath of files) {
      const buffer = await downloadFile(filePath);
      results.push(JSON.parse(buffer.toString()));
    }
    return results.sort((a, b) => (a.id || "").localeCompare(b.id || ""));
  }
  const dirPath = path.join(CONTENT_DIR, subDir);
  const files = fs
    .readdirSync(dirPath)
    .filter((f) => f.endsWith(".json"))
    .sort();
  return files.map((f) => JSON.parse(fs.readFileSync(path.join(dirPath, f), "utf-8")));
}

/**
 * Read a single content file.
 * @param subDir - e.g. "pinyin", "tones", "references"
 * @param filename - e.g. "tone-reference.json"
 * @returns Parsed JSON object
 */
export async function readContentFile(
  subDir: string,
  filename: string,
): Promise<Record<string, unknown>> {
  if (config.nodeEnvironment === "production" && config.gcsBucket) {
    const buffer = await downloadFile(`content/${subDir}/${filename}`);
    return JSON.parse(buffer.toString());
  }
  const filePath = path.join(CONTENT_DIR, subDir, filename);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

/**
 * Read content files matching a prefix from a content subdirectory.
 * @param subDir - e.g. "pinyin"
 * @param prefix - e.g. "init_", "fin_", "tn_"
 * @returns Parsed JSON objects sorted by id
 */
export async function readContentFiles(
  subDir: string,
  prefix: string,
): Promise<Record<string, unknown>[]> {
  const all = await readContentDir(subDir);
  return all
    .filter(
      (f) =>
        (f as Record<string, unknown>).id &&
        String((f as Record<string, unknown>).id).startsWith(prefix),
    )
    .sort((a, b) =>
      String((a as Record<string, unknown>).id || "").localeCompare(
        String((b as Record<string, unknown>).id || ""),
      ),
    );
}

/**
 * Strip tone marks from a pinyin syllable, returning plain ASCII.
 * @param syllable - Pinyin with tone marks (e.g., "mā")
 * @returns Plain pinyin (e.g., "ma")
 */
export function stripToneMarks(syllable: string): string {
  return syllable
    .replace(/[āáǎà]/g, "a")
    .replace(/[ōóǒò]/g, "o")
    .replace(/[ēéěè]/g, "e")
    .replace(/[īíǐì]/g, "i")
    .replace(/[ūúǔù]/g, "u")
    .replace(/[ǖǘǚǜ]/g, "ü");
}

/**
 * Fisher-Yates shuffle (returns a new array).
 * @param array
 * @returns Shuffled copy
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
