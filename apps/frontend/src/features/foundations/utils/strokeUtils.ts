/**
 * @file strokeUtils.ts
 * @description Utility functions for stroke analysis and display
 * Story 18.4: Stroke Order Reference & Animations
 */

/**
 * Raw character stroke data from hanzi-writer-data CDN JSON.
 * Mirrors the structure returned by the hanzi-writer-data package.
 */
export interface CharData {
  strokes?: string[];
  medians?: number[][][];
}

/**
 * Analyze character stroke median data to determine which stroke order rules apply.
 * Falls back to the two general rules (Top→Bottom, Left→Right) for most characters.
 *
 * @param charData - The raw character data object with medians array
 * @returns Array of stroke order rule descriptions
 */
export function determineStrokeRules(charData: CharData | null | undefined): string[] {
  const rules: string[] = [];
  const medians = charData?.medians;
  if (!medians || medians.length === 0) {
    return ["Top \u2192 Bottom", "Left \u2192 Right"]; // defaults for most chars
  }

  // Check vertical spread (top-to-bottom)
  const ySpans = medians.map((m: number[][]) => {
    const ys = m.map((p: number[]) => p[1]);
    return Math.max(...ys) - Math.min(...ys);
  });
  const avgYSpan = ySpans.reduce((a: number, b: number) => a + b, 0) / ySpans.length;

  // Check horizontal spread (left-to-right)
  const xSpans = medians.map((m: number[][]) => {
    const xs = m.map((p: number[]) => p[0]);
    return Math.max(...xs) - Math.min(...xs);
  });
  const avgXSpan = xSpans.reduce((a: number, b: number) => a + b, 0) / xSpans.length;

  // Determine rules based on stroke distribution
  if (avgYSpan > 30) rules.push("Top \u2192 Bottom");
  if (avgXSpan > 30) rules.push("Left \u2192 Right");

  // For enclosed characters, check if medians suggest outside-in
  if (medians.length >= 3) {
    const firstY = medians[0][0][1];
    const lastY = medians[medians.length - 1][0][1];
    if (lastY > firstY && avgYSpan > 40) {
      rules.push("Outside \u2192 Inside");
    }
  }

  return rules.length > 0 ? rules : ["Top \u2192 Bottom", "Left \u2192 Right"];
}
