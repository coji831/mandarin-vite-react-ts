/**
 * @file MnemonicCard.test.tsx
 * @description Tests for MnemonicCard — layout selection + regeneration guidance.
 * Story 21.20: Classification-Aware Mnemonic UI
 */

import { describe, it, expect } from "vitest";
import { resolveEffectiveClassification } from "../layoutSelection";
import { getRegenerationTip } from "../regenerationGuidance";

describe("resolveEffectiveClassification", () => {
  it("returns pictograph for pictograph classification", () => {
    expect(resolveEffectiveClassification("pictograph", [])).toBe("pictograph");
  });

  it("returns phono_semantic for phono_semantic classification", () => {
    expect(resolveEffectiveClassification("phono_semantic", [])).toBe("phono_semantic");
  });

  it("returns compound_ideograph for ideograph with 2+ radicals", () => {
    expect(resolveEffectiveClassification("ideograph", ["日", "月"])).toBe("compound_ideograph");
    expect(resolveEffectiveClassification("ideograph", ["木", "木", "火"])).toBe("compound_ideograph");
  });

  it("returns simple_ideograph for ideograph with <2 radicals", () => {
    expect(resolveEffectiveClassification("ideograph", [])).toBe("simple_ideograph");
    expect(resolveEffectiveClassification("ideograph", ["一"])).toBe("simple_ideograph");
  });

  it("returns default for null classification", () => {
    expect(resolveEffectiveClassification(null, [])).toBe("default");
  });

  it("returns default for undefined classification", () => {
    expect(resolveEffectiveClassification(undefined, [])).toBe("default");
  });

  it("returns default for unknown classification", () => {
    expect(resolveEffectiveClassification("unknown_type", [])).toBe("default");
  });
});

describe("getRegenerationTip", () => {
  it("returns pictograph tip for pictograph", () => {
    const tip = getRegenerationTip("pictograph");
    expect(tip).toContain("visual imagery");
  });

  it("returns phono_semantic tip for phono_semantic", () => {
    const tip = getRegenerationTip("phono_semantic");
    expect(tip).toContain("sound clue");
  });

  it("returns compound_ideograph tip for compound_ideograph", () => {
    const tip = getRegenerationTip("compound_ideograph");
    expect(tip).toContain("components combine");
  });

  it("returns simple_ideograph tip for simple_ideograph", () => {
    const tip = getRegenerationTip("simple_ideograph");
    expect(tip).toContain("abstract concept");
  });

  it("returns default tip for unknown classification", () => {
    const tip = getRegenerationTip("unknown_type");
    expect(tip).toContain("easier to remember");
  });

  it("returns default tip for empty string", () => {
    const tip = getRegenerationTip("");
    expect(tip).toContain("easier to remember");
  });
});
