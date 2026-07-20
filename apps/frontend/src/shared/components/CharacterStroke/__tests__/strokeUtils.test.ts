/**
 * @file strokeUtils.test.ts
 * @description Tests for determineStrokeRules utility
 * Story 18.4: Stroke Order Reference & Animations
 */

import { describe, it, expect } from "vitest";
import { determineStrokeRules, type CharData } from "../strokeUtils";

describe("determineStrokeRules", () => {
  it("returns default rules when charData is null", () => {
    const result = determineStrokeRules(null);
    expect(result).toEqual(["Top → Bottom", "Left → Right"]);
  });

  it("returns default rules when charData is undefined", () => {
    const result = determineStrokeRules(undefined);
    expect(result).toEqual(["Top → Bottom", "Left → Right"]);
  });

  it("returns default rules when medians is missing", () => {
    const data: CharData = { strokes: ["M...", "M..."] };
    const result = determineStrokeRules(data);
    expect(result).toEqual(["Top → Bottom", "Left → Right"]);
  });

  it("returns default rules when medians is empty array", () => {
    const data: CharData = { medians: [] };
    const result = determineStrokeRules(data);
    expect(result).toEqual(["Top → Bottom", "Left → Right"]);
  });

  it("detects Top→Bottom and Left→Right rules from well-spread medians", () => {
    // Simulate a character with strokes spread both vertically and horizontally.
    // Average Y spread > 30 → Top→Bottom
    // Average X spread > 30 → Left→Right
    const data: CharData = {
      medians: [
        [
          [0, 0],
          [10, 50],
        ], // vertical-ish (ySpan: 50, xSpan: 10)
        [
          [10, 0],
          [80, 0],
        ], // horizontal (ySpan: 0, xSpan: 70)
        [
          [0, 50],
          [80, 50],
        ], // horizontal (ySpan: 0, xSpan: 80)
        [
          [0, 0],
          [0, 70],
        ], // vertical (ySpan: 70, xSpan: 0)
        [
          [50, 0],
          [60, 50],
        ], // diagonal (ySpan: 50, xSpan: 10)
        // avg ySpan: 34, avg xSpan: 34
      ],
    };
    const result = determineStrokeRules(data);
    expect(result).toContain("Top → Bottom");
    expect(result).toContain("Left → Right");
  });

  it("returns default rules when medians have no significant spread", () => {
    // All strokes clustered in a small area
    const data: CharData = {
      medians: [
        [
          [0, 0],
          [5, 5],
        ],
        [
          [0, 5],
          [5, 0],
        ],
      ],
    };
    const result = determineStrokeRules(data);
    expect(result).toEqual(["Top → Bottom", "Left → Right"]);
  });
});
