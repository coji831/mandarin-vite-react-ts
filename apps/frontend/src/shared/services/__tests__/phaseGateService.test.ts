/**
 * @file shared/services/__tests__/phaseGateService.test.ts
 * @description Unit + MSW tests for the phase-gate cache contract (Story 25-2).
 *
 * Public API under test:
 * - `fetchPhaseGate()` — auth-keyed write, auth-keyed fallback on failure
 * - `clearPhaseGateCache()` — removes every `phaseGate:*` key and nothing else
 * - `purgeLegacyPhaseGateResidue()` — one-shot removal of pre-25-2 residue
 *
 * The regression this pins: a gate cached for one identity is never served to
 * the other. `phaseGate:user` residue must not answer a guest fetch, and a
 * cleared cache must surface "unavailable" instead of a stale gate.
 *
 * The second regression (epic-25 review F1): a fetch that resolves *after* an
 * identity transition must not write into the new identity's bucket. Eviction
 * already ran at the transition, so such a write would be poison nothing clears.
 */
import { http, HttpResponse, type JsonBodyType } from "msw";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { server } from "src/mocks/server";
import {
  clearPhaseGateCache,
  fetchPhaseGate,
  purgeLegacyPhaseGateResidue,
} from "../phaseGateService";

const PHASE_GATE_URL = "http://localhost:3001/api/v1/progression/phase-gate";

/**
 * A well-formed, non-expired JWT — the axios interceptor treats an unparseable
 * token as expired and drops it, which would flip the cache key to `guest`.
 */
function authToken(label: string): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify({ exp: Date.now() / 1000 + 3600, label }));
  return `${header}.${body}.test-signature`;
}

const USER_TOKEN = authToken("user-a");

/** A logged-in learner's persisted gate. */
const USER_GATE = {
  id: "pg-user",
  currentPhase: 4,
  phase1Passed: true,
  phase2Passed: true,
  phase3Passed: true,
  phase4Unlocked: true,
  qualificationScore: 95,
  placedPhase: null,
  phase1Retention: 92,
  phase2Retention: 88,
  phase3Retention: 85,
  gateCriteria: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

/** The calibrated guest gate (`createGuestPhaseGate()` shape). */
const GUEST_GATE = {
  id: "guest-unlocked",
  currentPhase: 1,
  phase1Passed: true,
  phase2Passed: false,
  phase3Passed: false,
  phase4Unlocked: false,
  isGuest: true,
  qualificationScore: null,
  placedPhase: null,
  phase1Retention: null,
  phase2Retention: null,
  phase3Retention: null,
  gateCriteria: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
beforeEach(() => localStorage.clear());
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
});
afterAll(() => server.close());

describe("fetchPhaseGate — cache key per identity class", () => {
  it("caches a guest response under `phaseGate:guest` only", async () => {
    server.use(http.get(PHASE_GATE_URL, () => HttpResponse.json(GUEST_GATE)));

    await expect(fetchPhaseGate()).resolves.toEqual(GUEST_GATE);

    expect(JSON.parse(localStorage.getItem("phaseGate:guest")!)).toEqual(GUEST_GATE);
    expect(localStorage.getItem("phaseGate:user")).toBeNull();
  });

  it("caches a logged-in response under `phaseGate:user` only", async () => {
    localStorage.setItem("accessToken", USER_TOKEN);
    server.use(http.get(PHASE_GATE_URL, () => HttpResponse.json(USER_GATE)));

    await expect(fetchPhaseGate()).resolves.toEqual(USER_GATE);

    expect(JSON.parse(localStorage.getItem("phaseGate:user")!)).toEqual(USER_GATE);
    expect(localStorage.getItem("phaseGate:guest")).toBeNull();
  });
});

/**
 * A response that is held open until the test releases it, so an identity
 * transition can be interleaved deterministically between request and
 * response — no timers, no `sleep`.
 */
function heldResponse(payload: JsonBodyType) {
  let markStarted!: () => void;
  const started = new Promise<void>((resolve) => {
    markStarted = resolve;
  });
  let release!: () => void;
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  const handler = async () => {
    markStarted();
    await released;
    return HttpResponse.json(payload);
  };
  return { handler, started, release };
}

describe("fetchPhaseGate — an in-flight fetch never writes into the other identity's bucket", () => {
  it("does not write `phaseGate:user` when a guest fetch resolves after login", async () => {
    const held = heldResponse(GUEST_GATE);
    server.use(http.get(PHASE_GATE_URL, held.handler));

    const pending = fetchPhaseGate(); // issued as a guest
    await held.started;

    // Guest → login: the token appears and AuthContext evicts both buckets.
    localStorage.setItem("accessToken", USER_TOKEN);
    clearPhaseGateCache();
    held.release();

    // The caller still gets its answer…
    await expect(pending).resolves.toEqual(GUEST_GATE);
    // …but the guest payload is cached under NO key — least of all the new
    // identity's, where a registered user would later read `currentPhase: 1`
    // + `isGuest: true` from a failed fetch.
    expect(localStorage.getItem("phaseGate:user")).toBeNull();
    expect(localStorage.getItem("phaseGate:guest")).toBeNull();
  });

  it("does not write `phaseGate:guest` when an authed fetch resolves after logout", async () => {
    localStorage.setItem("accessToken", USER_TOKEN);
    const held = heldResponse(USER_GATE);
    server.use(http.get(PHASE_GATE_URL, held.handler));

    const pending = fetchPhaseGate(); // issued with the token
    await held.started;

    // Logout: the token is gone and AuthContext evicts both buckets.
    localStorage.removeItem("accessToken");
    clearPhaseGateCache();
    held.release();

    await expect(pending).resolves.toEqual(USER_GATE);
    // A guest must never later read A's `currentPhase: 4` from `phaseGate:guest`.
    expect(localStorage.getItem("phaseGate:guest")).toBeNull();
    expect(localStorage.getItem("phaseGate:user")).toBeNull();
  });

  it("still caches when the identity is unchanged across the round trip", async () => {
    const held = heldResponse(GUEST_GATE);
    server.use(http.get(PHASE_GATE_URL, held.handler));

    const pending = fetchPhaseGate();
    await held.started;
    held.release();

    await expect(pending).resolves.toEqual(GUEST_GATE);
    expect(JSON.parse(localStorage.getItem("phaseGate:guest")!)).toEqual(GUEST_GATE);
  });
});

describe("fetchPhaseGate — failure falls back to THIS identity's cache", () => {
  it("serves the cached user gate when the fetch fails", async () => {
    localStorage.setItem("accessToken", USER_TOKEN);
    localStorage.setItem("phaseGate:user", JSON.stringify(USER_GATE));
    server.use(
      http.get(PHASE_GATE_URL, () => HttpResponse.json({ error: "unavailable" }, { status: 500 })),
    );

    await expect(fetchPhaseGate()).resolves.toEqual(USER_GATE);
  });

  it("serves the cached guest gate when the fetch fails", async () => {
    localStorage.setItem("phaseGate:guest", JSON.stringify(GUEST_GATE));
    server.use(
      http.get(PHASE_GATE_URL, () => HttpResponse.json({ error: "unavailable" }, { status: 500 })),
    );

    await expect(fetchPhaseGate()).resolves.toEqual(GUEST_GATE);
  });

  it("never serves `phaseGate:user` to a guest — throws instead", async () => {
    localStorage.setItem("phaseGate:user", JSON.stringify(USER_GATE));
    server.use(
      http.get(PHASE_GATE_URL, () => HttpResponse.json({ error: "unavailable" }, { status: 500 })),
    );

    await expect(fetchPhaseGate()).rejects.toThrow("Phase gate unavailable");
  });

  it("throws when the identity has no cached gate", async () => {
    localStorage.setItem("accessToken", USER_TOKEN);
    server.use(
      http.get(PHASE_GATE_URL, () => HttpResponse.json({ error: "unavailable" }, { status: 500 })),
    );

    await expect(fetchPhaseGate()).rejects.toThrow("Phase gate unavailable");
  });
});

describe("clearPhaseGateCache", () => {
  it("removes every `phaseGate:*` key and leaves everything else untouched", () => {
    localStorage.setItem("accessToken", USER_TOKEN);
    localStorage.setItem("phaseGate:user", JSON.stringify(USER_GATE));
    localStorage.setItem("phaseGate:guest", JSON.stringify(GUEST_GATE));
    // A future/unknown member of the namespace must go too — no key list.
    localStorage.setItem("phaseGate:something-new", "{}");
    // Sibling keys outside the namespace must survive.
    localStorage.setItem("mandarin:sidebar-collapsed", "true");
    localStorage.setItem("mandarin:phaseGate-identity-purge:v1", "done");

    clearPhaseGateCache();

    const remaining = Object.keys(localStorage).sort();
    expect(remaining).toEqual([
      "accessToken",
      "mandarin:phaseGate-identity-purge:v1",
      "mandarin:sidebar-collapsed",
    ]);
  });

  it("is a no-op when the cache is already empty", () => {
    localStorage.setItem("accessToken", USER_TOKEN);

    expect(() => clearPhaseGateCache()).not.toThrow();
    expect(Object.keys(localStorage)).toEqual(["accessToken"]);
  });

  it("makes a subsequent failing fetch throw instead of returning the evicted gate", async () => {
    localStorage.setItem("accessToken", USER_TOKEN);
    localStorage.setItem("phaseGate:user", JSON.stringify(USER_GATE));
    server.use(
      http.get(PHASE_GATE_URL, () => HttpResponse.json({ error: "unavailable" }, { status: 500 })),
    );

    clearPhaseGateCache();

    await expect(fetchPhaseGate()).rejects.toThrow("Phase gate unavailable");
  });
});

describe("purgeLegacyPhaseGateResidue", () => {
  it("deletes the pre-25-2 `phaseGate:user` value on the first run", () => {
    localStorage.setItem("accessToken", USER_TOKEN);
    localStorage.setItem("phaseGate:user", JSON.stringify(USER_GATE));

    purgeLegacyPhaseGateResidue();

    expect(localStorage.getItem("phaseGate:user")).toBeNull();
    // The live session survives the purge.
    expect(localStorage.getItem("accessToken")).toBe(USER_TOKEN);
  });

  it("runs exactly once — a gate cached after the purge survives the next boot", () => {
    localStorage.setItem("phaseGate:user", JSON.stringify(USER_GATE));

    purgeLegacyPhaseGateResidue();
    localStorage.setItem("phaseGate:user", JSON.stringify(USER_GATE));
    purgeLegacyPhaseGateResidue();

    expect(JSON.parse(localStorage.getItem("phaseGate:user")!)).toEqual(USER_GATE);
  });

  it("is not re-armed by clearPhaseGateCache (the marker lives outside the namespace)", () => {
    purgeLegacyPhaseGateResidue();
    localStorage.setItem("phaseGate:user", JSON.stringify(USER_GATE));

    clearPhaseGateCache();
    localStorage.setItem("phaseGate:user", JSON.stringify(USER_GATE));
    purgeLegacyPhaseGateResidue();

    expect(JSON.parse(localStorage.getItem("phaseGate:user")!)).toEqual(USER_GATE);
  });
});
