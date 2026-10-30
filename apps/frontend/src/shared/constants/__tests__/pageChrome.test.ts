/**
 * @file shared/constants/__tests__/pageChrome.test.ts
 * @description Unit tests for the mode/chrome derivation (dual-mode chrome law,
 * page-archetypes.md §0). Mode derives from archetype; chrome follows mode.
 */
import { describe, it, expect } from "vitest";
import { modeForArchetype, chromeForMode, resolvePageMode } from "../pageChrome";

describe("modeForArchetype", () => {
  it("maps focus archetypes (detail, wizard) to focus", () => {
    expect(modeForArchetype("detail")).toBe("focus");
    expect(modeForArchetype("wizard")).toBe("focus");
  });

  it("maps auth to the explicit neither mode", () => {
    expect(modeForArchetype("auth")).toBe("auth");
  });

  it("maps every other archetype to browse", () => {
    for (const a of ["overview", "list", "settings", "profile", "search", "reports", "empty"]) {
      expect(modeForArchetype(a)).toBe("browse");
    }
  });

  it("defaults null/undefined (unassigned) to browse", () => {
    expect(modeForArchetype(null)).toBe("browse");
    expect(modeForArchetype(undefined)).toBe("browse");
  });
});

describe("chromeForMode", () => {
  it("focus = collapsed rail + recessed top bar", () => {
    expect(chromeForMode("focus")).toEqual({ rail: "collapsed", topbar: "recessed" });
  });

  it("browse = expanded rail + standard top bar", () => {
    expect(chromeForMode("browse")).toEqual({ rail: "expanded", topbar: "standard" });
  });

  it("auth = no rail + standard top bar (UserMenu stays reachable)", () => {
    expect(chromeForMode("auth")).toEqual({ rail: "none", topbar: "standard" });
  });
});

describe("resolvePageMode", () => {
  it("resolves the Browse exemplars", () => {
    expect(resolvePageMode("/")).toBe("browse");
    expect(resolvePageMode("/dashboard")).toBe("browse");
    expect(resolvePageMode("/practices")).toBe("browse");
    expect(resolvePageMode("/library")).toBe("browse");
    expect(resolvePageMode("/progress")).toBe("browse");
  });

  it("resolves the Focus exemplars (the sessions)", () => {
    // A session is a route with a bounded start/end, so it is Focus. The two
    // practice sessions live on a query (rework-proposal §4/§7), so the query
    // is what decides the mode.
    expect(resolvePageMode("/practices/review", "?type=pinyin&filter=due")).toBe("focus");
    expect(resolvePageMode("/practices/quiz", "?type=audio-to-pinyin-tone")).toBe("focus");
    expect(resolvePageMode("/learn/foundations")).toBe("focus"); // Blueprint = wizard
    expect(resolvePageMode("/learn/readers/p_00001")).toBe("focus"); // reading = detail
  });

  it("keeps the entry surface of a session route in Browse until the session starts", () => {
    // Choosing a deck (or landing on the quiz with no type) is not a change of
    // intent — the picker stays Browse so the rail never collapses mid-choice.
    expect(resolvePageMode("/practices/review")).toBe("browse");
    expect(resolvePageMode("/practices/review", "?type=pinyin")).toBe("browse");
    expect(resolvePageMode("/practices/quiz")).toBe("browse");
  });

  it("keeps every Learn surface in Browse — a lookup is not a change of intent", () => {
    // The hub is a cross-page PEEK, not a route (rework-proposal §0.3): no
    // `/learn/hub` path exists, so opening one never flips chrome to Focus.
    expect(resolvePageMode("/learn")).toBe("browse");
    expect(resolvePageMode("/learn/grammar")).toBe("browse");
    expect(resolvePageMode("/learn/hub")).toBe("browse");
    // The dense reference index is a Browse scan, not the sequential task.
    expect(resolvePageMode("/learn/foundations/reference")).toBe("browse");
    expect(resolvePageMode("/learn/readers")).toBe("browse");
  });

  it("resolves auth routes to auth (no rail)", () => {
    expect(resolvePageMode("/auth/login")).toBe("auth");
    expect(resolvePageMode("/auth/register")).toBe("auth");
  });

  it("defaults unknown routes to browse", () => {
    expect(resolvePageMode("/does-not-exist")).toBe("browse");
  });
});
