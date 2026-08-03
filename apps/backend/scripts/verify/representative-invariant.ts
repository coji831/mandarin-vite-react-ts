/**
 * @file apps/backend/scripts/verify/representative-invariant.ts
 * @description Pure invariant check for the pinyin representative pipeline:
 *   per pinyin syllable, EXACTLY ONE row has representativeRank 0, and all
 *   ranked rows are contiguous 0..n (no gaps, no duplicates, no negatives).
 *
 * Shared by verify-pipeline.ts (Phase 2 JSON + Phase 3 DB) and unit-tested in
 * scripts/__tests__. Pure — no I/O.
 */

export interface RepresentativeRow {
  pinyinSyllableId: string;
  representativeRank: number | null;
}

export interface RepresentativeInvariantResult {
  ok: boolean;
  violations: string[];
  syllablesChecked: number;
}

/**
 * Validate the representative-rank invariant over a list of mapping rows.
 *
 * Unranked rows (representativeRank === null) are ignored — they correspond to
 * the runtime's defensive NULLS-LAST ordering path. The invariant is about the
 * rank STRUCTURE among ranked rows: exactly one 0 per syllable and contiguous
 * 0..n.
 */
export function checkRepresentativeInvariant(
  rows: RepresentativeRow[],
): RepresentativeInvariantResult {
  const bySyllable = new Map<string, number[]>();
  for (const r of rows) {
    if (r.representativeRank == null) continue;
    const list = bySyllable.get(r.pinyinSyllableId) ?? [];
    list.push(r.representativeRank);
    bySyllable.set(r.pinyinSyllableId, list);
  }

  const violations: string[] = [];
  for (const [syllableId, ranks] of bySyllable) {
    const sorted = [...ranks].sort((a, b) => a - b);
    const zeroCount = sorted.filter((r) => r === 0).length;
    if (zeroCount !== 1) {
      violations.push(
        `syllable ${syllableId}: expected exactly one representativeRank=0, found ${zeroCount}`,
      );
      continue;
    }
    // Contiguous 0..n — rank i must equal index i.
    const contiguous = sorted.every((r, i) => r === i);
    if (!contiguous) {
      violations.push(
        `syllable ${syllableId}: ranks [${sorted.join(", ")}] are not contiguous 0..n`,
      );
    }
  }

  return { ok: violations.length === 0, violations, syllablesChecked: bySyllable.size };
}
