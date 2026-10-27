/**
 * @file __tests__/hubPath.test.ts
 * @description Unit tests for the hub URL builders (session = route, not modal).
 */
import { describe, it, expect } from "vitest";
import { hubPathFor, hubOriginFor, hubEntityFromPath, readHubRouteState } from "../hubPath";

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

describe("hubEntityFromPath", () => {
  it("decodes the entity a hub path names", () => {
    expect(hubEntityFromPath(`/learn/hub/word/${encodeURIComponent("喜欢")}`)).toEqual({
      entityType: "word",
      entityId: "喜欢",
    });
  });

  it("adopts the route's label hint", () => {
    expect(
      hubEntityFromPath("/learn/hub/chengyu/cy_0001", `?label=${encodeURIComponent("破釜沉舟")}`),
    ).toEqual({ entityType: "chengyu", entityId: "cy_0001", label: "破釜沉舟" });
  });

  it("returns null for a non-hub route", () => {
    expect(hubEntityFromPath("/learn/chengyu")).toBeNull();
    expect(hubEntityFromPath("/learn/hub")).toBeNull();
    expect(hubEntityFromPath("/learn/hub/word")).toBeNull();
  });

  it("returns null for an unknown entity type or bad encoding", () => {
    expect(hubEntityFromPath("/learn/hub/dragon/abc")).toBeNull();
    expect(hubEntityFromPath("/learn/hub/word/%E0%A4%A")).toBeNull();
  });
});

describe("readHubRouteState", () => {
  it("passes through a from + trail session state", () => {
    const state = { from: "/learn/chengyu", trail: [{ entityType: "chengyu", entityId: "cy_1" }] };
    expect(readHubRouteState(state)).toEqual(state);
  });

  it("normalizes anything else to an empty session state", () => {
    expect(readHubRouteState(null)).toEqual({});
    expect(readHubRouteState(undefined)).toEqual({});
    expect(readHubRouteState("nope")).toEqual({});
    expect(readHubRouteState({ from: 7, trail: "nope" })).toEqual({
      from: undefined,
      trail: undefined,
    });
  });
});
