/**
 * @file shared/hooks/__tests__/usePhaseGate.test.tsx
 * @description Hook tests for `usePhaseGate` (Testing Trophy INTEGRATION tier:
 * hook + MSW against the real phase-gate service + apiClient).
 *
 * Public API under test: `{ phaseGate, isLoading }`.
 *
 * Story 25-2 pins three behaviours:
 * 1. one fetch path — a success resolves the gate and clears loading;
 * 2. refetch on identity change — the access token is the effect dependency,
 *    so login/logout re-asks the server with the new identity;
 * 3. failure resolves `phaseGate: null` — never a stale cached value.
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { server } from "src/mocks/server";
import { usePhaseGate } from "../usePhaseGate";

const PHASE_GATE_URL = "http://localhost:3001/api/v1/progression/phase-gate";

/**
 * A well-formed, non-expired JWT — the axios interceptor treats an unparseable
 * token as expired and drops it, which would quietly flip the cache key.
 */
function authToken(label: string): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify({ exp: Date.now() / 1000 + 3600, label }));
  return `${header}.${body}.test-signature`;
}

const USER_TOKEN = authToken("user-a");

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

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
beforeEach(() => localStorage.clear());
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
});
afterAll(() => server.close());

describe("usePhaseGate", () => {
  it("fetches once and resolves the gate", async () => {
    let calls = 0;
    server.use(
      http.get(PHASE_GATE_URL, () => {
        calls += 1;
        return HttpResponse.json(GUEST_GATE);
      }),
    );

    const { result } = renderHook(() => usePhaseGate());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.phaseGate).toBeNull();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.phaseGate).toEqual(GUEST_GATE);
    expect(calls).toBe(1);
  });

  it("refetches when the identity (access token) changes", async () => {
    server.use(
      http.get(PHASE_GATE_URL, ({ request }) =>
        HttpResponse.json(request.headers.get("Authorization") ? USER_GATE : GUEST_GATE),
      ),
    );

    const { result, rerender } = renderHook(() => usePhaseGate());
    await waitFor(() => expect(result.current.phaseGate).toEqual(GUEST_GATE));

    // Log in: the token is the hook's identity signal.
    localStorage.setItem("accessToken", USER_TOKEN);
    rerender();

    await waitFor(() => expect(result.current.phaseGate).toEqual(USER_GATE));

    // Log out: back to the guest gate.
    localStorage.removeItem("accessToken");
    rerender();

    await waitFor(() => expect(result.current.phaseGate).toEqual(GUEST_GATE));
  });

  it("resolves null (not a stale gate) when the fetch fails", async () => {
    server.use(
      http.get(PHASE_GATE_URL, () => HttpResponse.json({ error: "unavailable" }, { status: 500 })),
    );

    const { result } = renderHook(() => usePhaseGate());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.phaseGate).toBeNull();
  });

  it("drops a previously resolved gate when a later fetch for the new identity fails", async () => {
    server.use(http.get(PHASE_GATE_URL, () => HttpResponse.json(GUEST_GATE)));

    const { result, rerender } = renderHook(() => usePhaseGate());
    await waitFor(() => expect(result.current.phaseGate).toEqual(GUEST_GATE));

    server.use(
      http.get(PHASE_GATE_URL, () => HttpResponse.json({ error: "unavailable" }, { status: 500 })),
    );
    act(() => localStorage.setItem("accessToken", USER_TOKEN));
    rerender();

    await waitFor(() => expect(result.current.phaseGate).toBeNull());
  });

  it("never exposes the previous identity's gate while the new fetch is in flight", async () => {
    server.use(http.get(PHASE_GATE_URL, () => HttpResponse.json(GUEST_GATE)));

    const { result, rerender } = renderHook(() => usePhaseGate());
    await waitFor(() => expect(result.current.phaseGate).toEqual(GUEST_GATE));

    // The new identity's gate takes a moment to arrive…
    server.use(
      http.get(PHASE_GATE_URL, async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json(USER_GATE);
      }),
    );
    act(() => localStorage.setItem("accessToken", USER_TOKEN));
    rerender();

    // …and the guest gate must already be gone: no gate until the server answers.
    expect(result.current.phaseGate).toBeNull();
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.phaseGate).toEqual(USER_GATE));
  });
});
