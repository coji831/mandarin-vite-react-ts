/**
 * @file utils/radicalDataUtils.ts
 * @description Pure utility functions for filtering and sorting radicals
 * Story 19.1: Radicals Browser Structure
 */

import type { RadicalData, RadicalFilter } from "../types";

/**
 * Case-insensitive substring match on pinyin, meaning, or glyph.
 * Returns true if any of these fields contains the search string.
 */
export function filterBySearch(radicals: RadicalData[], search: string): RadicalData[] {
  if (!search.trim()) return radicals;
  const query = search.trim().toLowerCase();
  return radicals.filter(
    (r) =>
      (r.name_pinyin?.toLowerCase() ?? "").includes(query) ||
      (r.meaning?.toLowerCase() ?? "").includes(query) ||
      (r.glyph?.includes(query) ?? false),
  );
}

/**
 * Filter radicals by exact stroke count match.
 * Pass `null` to skip filtering (show all).
 */
export function filterByStrokeCount(
  radicals: RadicalData[],
  strokeCount: number | null,
): RadicalData[] {
  if (strokeCount === null) return radicals;
  // strokeCount 17 means "17+" — show all radicals with 17 or more strokes
  if (strokeCount >= 17) {
    return radicals.filter((r) => r.stroke_count >= 17);
  }
  return radicals.filter((r) => r.stroke_count === strokeCount);
}

/**
 * Filter to show only recommended (top 20) radicals.
 * Pass `false` to show all radicals.
 */
export function filterTop20(radicals: RadicalData[], showOnlyTop20: boolean): RadicalData[] {
  if (!showOnlyTop20) return radicals;
  return radicals.filter((r) => r.is_recommended);
}

/**
 * Sort radicals by the specified criterion.
 * Default sort (if sortBy is unrecognized) is by kangxi_index ascending.
 */
export function sortRadicals(
  radicals: RadicalData[],
  sortBy: RadicalFilter["sortBy"],
): RadicalData[] {
  const sorted = [...radicals];
  switch (sortBy) {
    case "stroke_count_asc":
      return sorted.sort((a, b) => a.stroke_count - b.stroke_count);
    case "stroke_count_desc":
      return sorted.sort((a, b) => b.stroke_count - a.stroke_count);
    case "meaning":
      return sorted.sort((a, b) => a.meaning.localeCompare(b.meaning));
    case "kangxi_index":
    default:
      return sorted.sort((a, b) => a.kangxi_index - b.kangxi_index);
  }
}

/**
 * Apply the full filter pipeline: search → stroke count → top20 toggle → sort.
 */
export function applyFilterPipeline(radicals: RadicalData[], filter: RadicalFilter): RadicalData[] {
  let result = radicals;
  result = filterBySearch(result, filter.search);
  result = filterByStrokeCount(result, filter.strokeCount);
  result = filterTop20(result, filter.showTop20Only);
  result = sortRadicals(result, filter.sortBy);
  return result;
}
