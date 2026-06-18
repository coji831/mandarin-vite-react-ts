/**
 * @file utils/pinyinAudioMap.ts
 * @description Pinyin-to-character audio mapping for TTS
 * Story 18.2: Pinyin System Guide
 *
 * Maps each pinyin syllable (with tone marks) to a common Chinese character
 * that has that exact pronunciation. Used to generate high-quality TTS audio
 * by sending real Chinese characters to the backend instead of pinyin text.
 *
 * Data is loaded from public/data/foundations/pinyin-audio-map.json
 * and cached in memory after first load.
 */

// Module-level cache
let cachedMap: Record<string, string> | null = null;

/**
 * Load the pinyin-to-character audio mapping from JSON.
 * Cached in memory after first load.
 */
export async function loadPinyinAudioMap(): Promise<Record<string, string>> {
  if (cachedMap) return cachedMap;
  const response = await fetch("/data/foundations/pinyin-audio-map.json");
  if (!response.ok) throw new Error(`Failed to load pinyin audio map: HTTP ${response.status}`);
  const data: Record<string, string> = await response.json();
  cachedMap = data;
  return data;
}

/**
 * Get the best character to use for TTS audio of a given pinyin syllable.
 * Falls back to the pinyin string itself if no mapping exists.
 * Async because it may need to load the map from JSON.
 */
export async function getPinyinAudioText(pinyin: string): Promise<string> {
  const map = await loadPinyinAudioMap();
  return map[pinyin] ?? pinyin;
}
