/**
 * @file hooks/__tests__/useBlueprintPosition.test.ts
 * @description The Blueprint's persisted position record — the signal that lets
 * a returning learner resume instead of re-walking seven steps.
 *
 * The contract: a missing, corrupt, or partially-invalid value degrades to the
 * top of the Blueprint field by field, and never throws. This record controls
 * position and copy only — it must never be readable as permission (BM-1 L6).
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  clearBlueprintPosition,
  isBlueprintStepId,
  readBlueprintPosition,
  writeBlueprintPosition,
} from "../useBlueprintPosition";

const STORAGE_KEY = "foundations:blueprintPosition";

describe("useBlueprintPosition — storage helpers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("reads an empty position when nothing is stored", () => {
    expect(readBlueprintPosition()).toEqual({ lastStepId: null, completedAt: null });
  });

  it("round-trips a written position", () => {
    const position = { lastStepId: "tones" as const, completedAt: "2026-01-01T00:00:00.000Z" };
    writeBlueprintPosition(position);
    expect(readBlueprintPosition()).toEqual(position);
  });

  it("degrades to an empty position on corrupt JSON instead of throwing", () => {
    localStorage.setItem(STORAGE_KEY, "{ not json");
    expect(readBlueprintPosition()).toEqual({ lastStepId: null, completedAt: null });
  });

  it("drops an unknown step id but keeps a valid completion stamp", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ lastStepId: "calligraphy", completedAt: "2026-01-01T00:00:00.000Z" }),
    );

    expect(readBlueprintPosition()).toEqual({
      lastStepId: null,
      completedAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("treats a non-object payload as empty", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify("tones"));
    expect(readBlueprintPosition()).toEqual({ lastStepId: null, completedAt: null });
  });

  it("clears the record", () => {
    writeBlueprintPosition({ lastStepId: "finals", completedAt: null });
    clearBlueprintPosition();
    expect(readBlueprintPosition()).toEqual({ lastStepId: null, completedAt: null });
  });

  it("survives storage that throws (private mode / disabled storage)", () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    const removeItem = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("denied");
    });

    expect(readBlueprintPosition()).toEqual({ lastStepId: null, completedAt: null });
    expect(() => writeBlueprintPosition({ lastStepId: "tones", completedAt: null })).not.toThrow();
    expect(() => clearBlueprintPosition()).not.toThrow();

    getItem.mockRestore();
    setItem.mockRestore();
    removeItem.mockRestore();
  });

  it("narrows real step ids only", () => {
    expect(isBlueprintStepId("radicals")).toBe(true);
    expect(isBlueprintStepId("calligraphy")).toBe(false);
    expect(isBlueprintStepId(null)).toBe(false);
    expect(isBlueprintStepId(7)).toBe(false);
  });
});
