/**
 * @file apps/backend/src/shared/utils/__tests__/contentUtils.test.ts
 * Unit tests for contentUtils.stripToneMarks — Phase 2 delegation to the
 * canonical marks-ONLY helper in @mandarin/shared-utils.
 */

import { describe, it, expect } from "vitest";
import { stripToneMarks } from "../contentUtils.js";

describe("contentUtils.stripToneMarks (delegates to @mandarin/shared-utils)", () => {
  it("removes tone marks (marks-only)", () => {
    expect(stripToneMarks("mā")).toBe("ma");
    expect(stripToneMarks("bù")).toBe("bu");
    expect(stripToneMarks("lǜ")).toBe("lü");
    expect(stripToneMarks("xiǎng")).toBe("xiang");
  });

  it("leaves plain/neutral pinyin untouched", () => {
    expect(stripToneMarks("ma")).toBe("ma");
    expect(stripToneMarks("xiang")).toBe("xiang");
  });

  it("does NOT strip a trailing tone digit (marks-only contract)", () => {
    expect(stripToneMarks("ba1")).toBe("ba1");
  });
});
