/**
 * @file __tests__/hubPath.test.ts
 * @description Unit tests for the hub URL builders (session = route, not modal).
 */
import { describe, it, expect } from "vitest";
import { hubPathFor, hubOriginFor } from "../hubPath";

describe("hubPathFor", () => {
  it("builds the routed detail path for an entity", () => {
    expect(hubPathFor({ entityType: "grammar", entityId: "gr_0018" })).toBe(
      "/learn/hub/grammar/gr_0018",
    );
  });

  it("carries an optional label as a display hint", () => {
    expect(hubPathFor({ entityType: "word", entityId: "喜欢" }, "xǐhuān")).toBe(
      `/learn/hub/word/${encodeURIComponent("喜欢")}?label=${encodeURIComponent("xǐhuān")}`,
    );
  });

  it("omits the label when none is given", () => {
    expect(hubPathFor({ entityType: "radical", entityId: "rad_0001" }, null)).toBe(
      "/learn/hub/radical/rad_0001",
    );
  });
});

describe("hubOriginFor", () => {
  it("maps each entity type to the Browse surface it is met on", () => {
    expect(hubOriginFor("grammar")).toBe("/learn/grammar");
    expect(hubOriginFor("chengyu")).toBe("/learn/chengyu");
    expect(hubOriginFor("radical")).toBe("/learn/radicals");
    expect(hubOriginFor("character")).toBe("/learn/foundations");
    expect(hubOriginFor("word")).toBe("/learn/readers");
  });
});
