/**
 * @file apps/backend/scripts/__tests__/representative-invariant.test.ts
 * @description Unit tests for the representative-rank invariant used by the
 *   pipeline gate (verify-pipeline.ts Phase 2 + Phase 3).
 */
import { describe, it, expect } from "vitest";
import { checkRepresentativeInvariant } from "../verify/representative-invariant.js";

const r = (pinyinSyllableId: string, representativeRank: number | null) => ({
  pinyinSyllableId,
  representativeRank,
});

describe("checkRepresentativeInvariant", () => {
  it("passes when each syllable has exactly one rank-0 and contiguous 0..n", () => {
    const result = checkRepresentativeInvariant([
      r("ps_00001", 0),
      r("ps_00001", 1),
      r("ps_00001", 2),
      r("ps_00002", 0),
      r("ps_00002", 1),
    ]);
    expect(result.ok).toBe(true);
    expect(result.violations).toEqual([]);
    expect(result.syllablesChecked).toBe(2);
  });

  it("fails when a syllable has more than one rank-0", () => {
    const result = checkRepresentativeInvariant([
      r("ps_00001", 0),
      r("ps_00001", 0),
      r("ps_00001", 1),
    ]);
    expect(result.ok).toBe(false);
    expect(result.violations.join(" ")).toContain("expected exactly one representativeRank=0");
  });

  it("fails when a syllable has NO rank-0", () => {
    const result = checkRepresentativeInvariant([r("ps_00001", 1), r("ps_00001", 2)]);
    expect(result.ok).toBe(false);
    expect(result.violations.join(" ")).toContain("expected exactly one representativeRank=0");
  });

  it("fails on non-contiguous ranks (gaps)", () => {
    const result = checkRepresentativeInvariant([
      r("ps_00001", 0),
      r("ps_00001", 2), // gap: 1 missing
    ]);
    expect(result.ok).toBe(false);
    expect(result.violations.join(" ")).toContain("not contiguous 0..n");
  });

  it("fails on negative ranks", () => {
    const result = checkRepresentativeInvariant([r("ps_00001", -1), r("ps_00001", 0)]);
    expect(result.ok).toBe(false);
    expect(result.violations.join(" ")).toContain("not contiguous 0..n");
  });

  it("ignores unranked (null) rows defensively", () => {
    const result = checkRepresentativeInvariant([
      r("ps_00001", null),
      r("ps_00001", 0),
      r("ps_00001", 1),
    ]);
    expect(result.ok).toBe(true);
  });

  it("passes on an empty input", () => {
    const result = checkRepresentativeInvariant([]);
    expect(result.ok).toBe(true);
    expect(result.syllablesChecked).toBe(0);
  });
});
