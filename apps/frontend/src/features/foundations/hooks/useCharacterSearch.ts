/**
 * @file useCharacterSearch.ts
 * @description Character search utility — validates hanzi input
 * Story 18.4: Stroke Order Reference & Animations
 */

/**
 * Validate input is a single hanzi character (CJK Unified Ideographs range)
 */
export function isValidHanzi(input: string): boolean {
  return /^[\u4e00-\u9fff\u3400-\u4dbf]$/.test(input);
}
