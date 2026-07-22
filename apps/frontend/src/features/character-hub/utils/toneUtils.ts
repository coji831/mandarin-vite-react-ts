/**
 * @file toneUtils.ts
 * @description Shared tone utility functions for Character Hub.
 * Extracted from HubIdentityCard and HubReadings to eliminate duplication.
 */

/**
 * Tone color mapping — matches tone number to CSS tone class.
 * Handles tones 1-4 with dedicated classes, tone 0 (neutral) as tertiary,
 * and undefined/missing as empty string (for IdentityCard usage).
 */
export function getToneClass(tone?: number): string {
  if (tone == null) return "";
  const classes: Record<number, string> = {
    1: "tone-1",
    2: "tone-2",
    3: "tone-3",
    4: "tone-4",
    0: "text-tertiary",
  };
  return classes[tone] ?? "text-tertiary";
}

/**
 * Extract tone number from pinyin string (e.g. "hǎo" → 3).
 * Returns 0 for neutral tone (no tone mark).
 */
export function extractTone(pinyin: string): number {
  const toneChars = pinyin.match(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/);
  if (!toneChars) return 0;
  const toneMap: Record<string, number> = {
    ā: 1,
    á: 2,
    ǎ: 3,
    à: 4,
    ē: 1,
    é: 2,
    ě: 3,
    è: 4,
    ī: 1,
    í: 2,
    ǐ: 3,
    ì: 4,
    ō: 1,
    ó: 2,
    ǒ: 3,
    ò: 4,
    ū: 1,
    ú: 2,
    ǔ: 3,
    ù: 4,
    ǖ: 1,
    ǘ: 2,
    ǚ: 3,
    ǜ: 4,
  };
  return toneMap[toneChars[0]] ?? 0;
}
