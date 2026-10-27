/**
 * @file features/auth/context/__tests__/AuthContext.phaseGateEviction.test.tsx
 * @description The §7.2 staleness regression (Story 25-2): a phase gate cached
 * for one identity must never be served to the next person on the same device
 * when the gate fetch is failing.
 *
 * Before this story `phaseGate:user` was never cleared (`logout()` removed only
 * the token), so on a shared device user A's cached gate answered user B's
 * failing fetch — a real cross-user leak of gate state. These tests drive the
 * REAL `AuthProvider` + the REAL `usePhaseGate` over MSW and assert the two
 * transitions that matter:
 * 1. login A → logout → login B (the explicit logout path), and
 * 2. refresh-cookie session restore (the boot-time, non-obvious path).
 *
 * Integration tier (Testing Trophy): no service or hook mocks — only HTTP.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { clearLogoutCallback } from "services";
import { purgeLegacyPhaseGateResidue } from "shared/services";
import { usePhaseGate } from "shared/hooks";
import { server } from "src/mocks/server";
import { AuthProvider, useAuth } from "../AuthContext";

const LOGIN = "http://localhost:3001/api/v1/auth/login";
const LOGOUT = "http://localhost:3001/api/v1/auth/logout";
const ME = "http://localhost:3001/api/v1/auth/me";
const REFRESH = "http://localhost:3001/api/v1/auth/refresh";
const PHASE_GATE = "http://localhost:3001/api/v1/progression/phase-gate";

/** Well-formed, non-expired JWT so the request interceptor never pre-refreshes. */
function createToken(label: string): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify({ exp: Date.now() / 1000 + 3600, label }));
  return `${header}.${body}.invalid-signature`;
}

const TOKEN_A = createToken("token-a");
const TOKEN_B = createToken("token-b");

function userFor(email: string) {
  return {
    id: email.split("@")[0],
    email,
    displayName: email.split("@")[0].toUpperCase(),
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

/** User A's persisted gate — the value that must never reach user B. */
const A_GATE = {
  id: "pg-a",
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

/** The calibrated guest gate served while no access token is present. */
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

/** Exposes the auth actions plus the live phase gate the shell would render. */
function Harness() {
  const { user, login, logout } = useAuth();
  const { phaseGate, isLoading } = usePhaseGate();
  return (
    <div>
      <span data-testid="email">{user?.email ?? "guest"}</span>
      <span data-testid="phase">{phaseGate ? String(phaseGate.currentPhase) : "none"}</span>
      <span data-testid="gate-loading">{String(isLoading)}</span>
      <button onClick={() => void login({ email: "a@example.com", password: "pw" })}>
        login-a
      </button>
      <button onClick={() => void login({ email: "b@example.com", password: "pw" })}>
        login-b
      </button>
      <button onClick={() => void logout()}>logout</button>
    </div>
  );
}

/** Shared login/logout handlers — the returned token identifies the caller. */
function authHandlers() {
  return [
    http.post(LOGIN, async ({ request }) => {
      const body = (await request.json()) as { email: string };
      const accessToken = body.email === "a@example.com" ? TOKEN_A : TOKEN_B;
      return HttpResponse.json(
        { success: true, data: { user: userFor(body.email), accessToken } },
        { status: 200 },
      );
    }),
    http.post(LOGOUT, () => HttpResponse.json({ success: true }, { status: 200 })),
  ];
}

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
beforeEach(() => localStorage.clear());
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
  clearLogoutCallback();
});
afterAll(() => server.close());

describe("AuthContext — phase gate eviction on identity change (Story 25-2)", () => {
  it("user A's gate is not served to user B after logout, even when B's gate fetch fails", async () => {
    server.use(
      ...authHandlers(),
      // A logged-in caller gets phase 4; a guest gets the calibrated guest gate.
      http.get(PHASE_GATE, ({ request }) =>
        HttpResponse.json(request.headers.get("Authorization") ? A_GATE : GUEST_GATE),
      ),
    );

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );

    // Guest first: the calibrated guest gate (never all-unlocked).
    await waitFor(() => expect(screen.getByTestId("phase").textContent).toBe("1"));

    // User A signs in → A's persisted gate is fetched and cached.
    fireEvent.click(screen.getByText("login-a"));
    await waitFor(() => expect(screen.getByTestId("email").textContent).toBe("a@example.com"));
    await waitFor(() => expect(screen.getByTestId("phase").textContent).toBe("4"));
    expect(JSON.parse(localStorage.getItem("phaseGate:user")!)).toMatchObject({ currentPhase: 4 });

    // Explicit logout — the leak path. The cache must be evicted with the token.
    fireEvent.click(screen.getByText("logout"));
    await waitFor(() => expect(screen.getByTestId("email").textContent).toBe("guest"));
    expect(localStorage.getItem("phaseGate:user")).toBeNull();

    // Backend outage: every gate fetch from now on fails.
    server.use(
      http.get(PHASE_GATE, () => HttpResponse.json({ error: "unavailable" }, { status: 500 })),
    );

    // User B signs in on the same device. No cache for B → no phase (null),
    // NEVER A's Phase 4.
    fireEvent.click(screen.getByText("login-b"));
    await waitFor(() => expect(screen.getByTestId("email").textContent).toBe("b@example.com"));
    await waitFor(() => expect(screen.getByTestId("gate-loading").textContent).toBe("false"));

    expect(screen.getByTestId("phase").textContent).toBe("none");
  });

  it("a refresh-cookie session restore evicts the previous identity's gate", async () => {
    // A device that already ran the one-shot legacy purge, then kept user A's
    // gate while the access token is gone (only the refresh cookie remains).
    purgeLegacyPhaseGateResidue();
    localStorage.setItem("phaseGate:user", JSON.stringify(A_GATE));
    localStorage.removeItem("accessToken");

    server.use(
      http.post(REFRESH, () =>
        HttpResponse.json({ success: true, data: { accessToken: TOKEN_A } }, { status: 200 }),
      ),
      http.get(ME, () =>
        HttpResponse.json(
          { success: true, data: { user: userFor("b@example.com") } },
          { status: 200 },
        ),
      ),
      http.get(PHASE_GATE, () => HttpResponse.json({ error: "unavailable" }, { status: 500 })),
    );

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );

    // The refresh cookie restores a session — for a DIFFERENT person than the
    // gate left in storage.
    await waitFor(() => expect(screen.getByTestId("email").textContent).toBe("b@example.com"));

    await waitFor(() => expect(screen.getByTestId("gate-loading").textContent).toBe("false"));
    expect(screen.getByTestId("phase").textContent).toBe("none");
    expect(localStorage.getItem("phaseGate:user")).toBeNull();
  });
});
