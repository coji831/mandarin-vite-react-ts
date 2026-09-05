/**
 * @file shared/utils/cn.test.ts
 * @description Unit tests for the cn class-name joiner.
 */
import { describe, it, expect } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("filters falsy entries (undefined, null, false, 0, '')", () => {
    expect(cn("a", undefined)).toBe("a");
    expect(cn("a", null)).toBe("a");
    expect(cn("a", false)).toBe("a");
    expect(cn("a", 0)).toBe("a");
    expect(cn("a", "")).toBe("a");
    expect(cn(undefined, null, false, 0, "")).toBe("");
  });

  it("joins strings with a single space", () => {
    expect(cn("btn", "btn-primary")).toBe("btn btn-primary");
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("joins conditional values (truthy kept, falsy dropped)", () => {
    const active = true;
    const disabled = false;
    expect(cn("btn", active && "is-active", disabled && "is-disabled")).toBe("btn is-active");
    expect(cn("btn", !active && "is-active")).toBe("btn");
    const count = 0; // falsy numeric value
    const total = 1; // truthy numeric value
    expect(cn("btn", count && "is-counted", total && "is-total")).toBe("btn is-total");
  });

  it("accepts array inputs (flat and nested)", () => {
    expect(cn(["a", "b"])).toBe("a b");
    expect(cn("x", ["y", null, "z"])).toBe("x y z");
    expect(cn(["a", ["b", "c"]], "d")).toBe("a b c d");
  });

  it("returns an empty string when nothing is truthy", () => {
    expect(cn()).toBe("");
    expect(cn([])).toBe("");
    expect(cn([null, "", false])).toBe("");
  });
});
