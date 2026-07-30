/**
 * @file packages/shared-utils/src/sandhi/__tests__/toneSandhiUtils.test.ts
 * Tests for sandhi-related shared utilities.
 * Story 21.16: Audio-to-Type — Neutral Tone & Sandhi
 */

import { describe, it, expect } from "vitest";
import { isSandhiAcceptable } from "../toneSandhiUtils";

describe("isSandhiAcceptable", () => {
  describe("3-3 Sandhi Rule", () => {
    it("accepts tone 2 when correct tone is 3 under 3-3 sandhi", () => {
      expect(isSandhiAcceptable(3, 2, true, "3-3")).toBe(true);
    });

    it("exact match still works under 3-3 sandhi", () => {
      expect(isSandhiAcceptable(3, 3, true, "3-3")).toBe(true);
    });

    it("rejects tone 1 when correct tone is 3 under 3-3 sandhi", () => {
      expect(isSandhiAcceptable(3, 1, true, "3-3")).toBe(false);
    });
  });

  describe("Non-sandhi questions", () => {
    it("returns false when isSandhiQuestion is false", () => {
      expect(isSandhiAcceptable(3, 2, false, "3-3")).toBe(false);
    });

    it("returns false when isSandhiQuestion is undefined", () => {
      expect(isSandhiAcceptable(3, 2, undefined, "3-3")).toBe(false);
    });
  });

  describe("Unknown rules", () => {
    it("returns false for unrecognized sandhi rule", () => {
      expect(isSandhiAcceptable(2, 3, true, "2-3")).toBe(false);
    });
  });

  describe("Exact match edge cases", () => {
    it("returns true when tones match regardless of sandhi rule", () => {
      expect(isSandhiAcceptable(2, 2, true, "3-3")).toBe(true);
    });

    it("returns true when tones match and isSandhiQuestion is false", () => {
      expect(isSandhiAcceptable(3, 3, false, "3-3")).toBe(true);
    });

    it("returns true when tones match and sandhiRule is undefined", () => {
      expect(isSandhiAcceptable(4, 4, true, undefined)).toBe(true);
    });
  });

  describe("Reverse direction", () => {
    it("does not accept reverse 3-3 sandhi (tone 2 becoming tone 3)", () => {
      expect(isSandhiAcceptable(2, 3, true, "3-3")).toBe(false);
    });
  });

  describe("Neutral tone (tone 0)", () => {
    it("returns true when both tones are 0", () => {
      expect(isSandhiAcceptable(0, 0, true, "3-3")).toBe(true);
    });
  });
});
