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
import { GCSClient } from "../infrastructure/external/GCSClient.js";

const gcsClient = new GCSClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Content directory root (repo root /content/)
export const CONTENT_DIR = path.resolve(__dirname, "../../../../../content");

/**
 * ContentFile — shape of parsed JSON content files from the content/ directory.
 * Common fields across all content types (radicals, pinyin, tones, characters, etc.).
 */
export interface ContentFile {
  id?: string;
  number?: number;
  name?: string;
  mark?: string;
  glyph?: string;
  meaning?: string;
  syllable?: string;
  tone?: number;
  character?: string | null;
  pinyin?: string;
  ipa?: string;
  description?: string;
  category?: string;
  pitch_description?: string;
  example_syllable?: string;
  example_character?: string;
  contour?: string;
  color?: string;
  name_pinyin?: string;
  simplified?: string;
  metadata?: Record<string, unknown>;
  readings?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

/**
 * Read all JSON files from a content subdirectory, sorted by filename.
 * @param subDir - e.g. "pinyin", "tones", "references"
 * @returns Parsed JSON objects
 */
export async function readContentDir(subDir: string): Promise<ContentFile[]> {
  if (config.nodeEnvironment === "production" && config.gcsBucket) {
    const prefix = `content/${subDir}/`;
    const files = await gcsClient.listFiles(prefix);
    const results = [];
    for (const filePath of files) {
      const buffer = await gcsClient.downloadFile(filePath);
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
export async function readContentFile(subDir: string, filename: string): Promise<ContentFile> {
  if (config.nodeEnvironment === "production" && config.gcsBucket) {
    const buffer = await gcsClient.downloadFile(`content/${subDir}/${filename}`);
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
export async function readContentFiles(subDir: string, prefix: string): Promise<ContentFile[]> {
  const all = await readContentDir(subDir);
  return all
    .filter((f) => f.id && String(f.id).startsWith(prefix))
    .sort((a, b) => String(a.id || "").localeCompare(String(b.id || "")));
}

/**
 * Read an aggregate content file (a JSON array) from a content subdirectory.
 * Aggregate files contain the full dataset as a single JSON array, replacing
 * the old pattern of one file per entity.
 *
 * @param subDir - e.g. "radicals", "pinyin", "tones"
 * @param aggregateName - e.g. "radicals.json", "pinyin.json", "tones.json"
 * @returns Parsed array of content items
 */
export async function readAggregateContent<T = ContentFile>(
  subDir: string,
  aggregateName: string,
): Promise<T[]> {
  if (config.nodeEnvironment === "production" && config.gcsBucket) {
    const buffer = await gcsClient.downloadFile(`content/${subDir}/${aggregateName}`);
    return JSON.parse(buffer.toString()) as T[];
  }
  const filePath = path.join(CONTENT_DIR, subDir, aggregateName);
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T[];
}

/**
 * Read content from an aggregate file and filter by a predicate.
 * Convenience wrapper for common aggregate access patterns.
 * @param subDir - e.g. "radicals"
 * @param aggregateName - e.g. "radicals.json"
 * @param predicate - Filter function
 * @returns Filtered array of content items
 */
export async function readAggregateContentWhere<T = ContentFile>(
  subDir: string,
  aggregateName: string,
  predicate: (item: T) => boolean,
): Promise<T[]> {
  const all = await readAggregateContent<T>(subDir, aggregateName);
  return all.filter(predicate);
}

/**
 * Find a single item in an aggregate content file by a key-value match.
 * @param subDir - e.g. "radicals"
 * @param aggregateName - e.g. "radicals.json"
 * @param key - Property name to match (e.g. "id")
 * @param value - Value to match
 * @returns Matching item or undefined
 */
export async function findInAggregateContent<T = ContentFile>(
  subDir: string,
  aggregateName: string,
  key: keyof T,
  value: unknown,
): Promise<T | undefined> {
  const all = await readAggregateContent<T>(subDir, aggregateName);
  return all.find((item) => item[key] === value);
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
