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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Content directory root (repo root /content/)
export const CONTENT_DIR = path.resolve(__dirname, "../../../../../content");

/**
 * Read all JSON files from a content subdirectory, sorted by filename.
 * @param {string} subDir - e.g. "pinyin", "tones", "references"
 * @returns {Object[]} Parsed JSON objects
 */
export function readContentDir(subDir) {
  const dirPath = path.join(CONTENT_DIR, subDir);
  const files = fs
    .readdirSync(dirPath)
    .filter((f) => f.endsWith(".json"))
    .sort();
  return files.map((f) => JSON.parse(fs.readFileSync(path.join(dirPath, f), "utf-8")));
}

/**
 * Read a single content file.
 * @param {string} subDir - e.g. "pinyin", "tones", "references"
 * @param {string} filename - e.g. "tone-reference.json"
 * @returns {Object} Parsed JSON object
 */
export function readContentFile(subDir, filename) {
  const filePath = path.join(CONTENT_DIR, subDir, filename);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

/**
 * Read content files matching a prefix from a content subdirectory.
 * @param {string} subDir - e.g. "pinyin"
 * @param {string} prefix - e.g. "init_", "fin_", "tn_"
 * @returns {Object[]} Parsed JSON objects sorted by id
 */
export function readContentFiles(subDir, prefix) {
  const dirPath = path.join(CONTENT_DIR, subDir);
  const files = fs
    .readdirSync(dirPath)
    .filter((f) => f.startsWith(prefix) && f.endsWith(".json"))
    .sort();
  return files
    .map((f) => JSON.parse(fs.readFileSync(path.join(dirPath, f), "utf-8")))
    .sort((a, b) => (a.id || "").localeCompare(b.id || ""));
}

/**
 * Strip tone marks from a pinyin syllable, returning plain ASCII.
 * @param {string} syllable - Pinyin with tone marks (e.g., "mā")
 * @returns {string} Plain pinyin (e.g., "ma")
 */
export function stripToneMarks(syllable) {
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
 * @param {Array} array
 * @returns {Array} Shuffled copy
 */
export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
