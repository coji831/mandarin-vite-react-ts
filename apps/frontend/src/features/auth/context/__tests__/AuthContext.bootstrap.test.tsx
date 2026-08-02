/**
 * @file AuthContext.bootstrap.test.tsx
 * @description Integration tests for the F4 session silent-refresh race fix.
 *
 * Guards against F4: `AuthContext.initAuth` previously called /auth/me with raw
 * `fetch` (bypassing the axios interceptor) AND `AuthContext.refreshTokens` ran
 * a SECOND, independent refresh implementation sharing the backend's single-use
 * ROTATING refresh cookie. With StrictMode enabled, two concurrent refreshes
 * with the same cookie → the losing racer gets 401 INVALID_TOKEN → fatal logout.
 *
 * Fix: bootstrap and the axios interceptor now share ONE single-flight
 * `requestAccessToken()` promise (see shared/api/axiosClient.ts). Each test
 * asserts: auth failure → EXACTLY ONE /auth/refresh → retry → user restored.
 */
import { StrictMode } from "react";
import { describe, it, expect, afterEach, afterAll, beforeAll } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "src/mocks/server";
import { clearLogoutCallback } from "services";
import { AuthProvider, useAuth } from "../AuthContext";

const ME = "http://localhost:3001/api/v1/auth/me";
const REFRESH = "http://localhost:3001/api/v1/auth/refresh";

const MOCK_USER = {
  id: "u1",
  email: "user@example.com",
  displayName: "Test User",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

/**
 * Well-formed, non-expired JWT with a bad signature — not expired locally, so
 * the request interceptor won't proactively refresh; invalid to the server.
 */
function createToken(userId: string): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify({ exp: Date.now() / 1000 + 3600, userId }));
  return `${header}.${body}.invalid-signature`;
}

/** Tampered token stored in localStorage — the server always rejects it. */
const TAMPERED_TOKEN = createToken("u1-bad");
/** Fresh access token returned by a successful /auth/refresh. */
const REFRESHED_TOKEN = createToken("u1-good");

function AuthHarness() {
  const { user, isLoading } = useAuth();
  return (
    <div>
      <span data-testid="isLoading">{String(isLoading)}</span>
      <span data-testid="userEmail">{user ? user.email : "null"}</span>
    </div>
  );
}

function renderAuth(options: { strictMode?: boolean } = {}) {
  const tree = (
    <AuthProvider>
      <AuthHarness />
    </AuthProvider>
  );
  return render(options.strictMode ? <StrictMode>{tree}</StrictMode> : tree);
}

/**
 * Simulates a tampered-access-token session: /auth/me rejects ANY request that
 * carries the tampered token (403 INVALID_TOKEN) and accepts the refreshed
 * token; /auth/refresh rotates the cookie (single-use) and returns a fresh
 * access token. The refresh delay keeps the in-flight window wide enough that
 * concurrent 403s deterministically join the single refresh promise.
 */
function setupTamperedSessionHandlers() {
  const counters = { me: 0, refresh: 0 };

  server.use(
    http.get(ME, ({ request }) => {
      counters.me += 1;
      // The JWT is base64-encoded, so decode the payload to identify the token.
      const auth = request.headers.get("Authorization") ?? "";
      const token = auth.replace(/^Bearer\s+/i, "");
      let userId = "";
      try {
        userId = JSON.parse(atob(token.split(".")[1])).userId as string;
      } catch {
        // Unparseable token — treat as tampered.
      }
      if (userId === "u1-bad") {
        return HttpResponse.json(
          { error: "Forbidden", code: "INVALID_TOKEN", message: "Invalid access token" },
          { status: 403 },
        );
      }
      return HttpResponse.json({ success: true, data: { user: MOCK_USER } }, { status: 200 });
    }),
    http.post(REFRESH, async () => {
      counters.refresh += 1;
      await new Promise((resolve) => setTimeout(resolve, 20));
      return HttpResponse.json(
        { success: true, data: { accessToken: REFRESHED_TOKEN } },
        { status: 200 },
      );
    }),
  );

  return counters;
}

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
  clearLogoutCallback();
});

afterAll(() => server.close());

describe("AuthContext bootstrap (F4 silent-refresh race)", () => {
  it("tampered token → /auth/me 403 → exactly ONE /auth/refresh → retry → user restored", async () => {
    const counters = setupTamperedSessionHandlers();
    localStorage.setItem("accessToken", TAMPERED_TOKEN);

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("userEmail").textContent).toBe(MOCK_USER.email));

    expect(counters.refresh).toBe(1);
    expect(counters.me).toBe(2); // initial 403 + interceptor retry
    expect(screen.getByTestId("isLoading").textContent).toBe("false");
    expect(localStorage.getItem("accessToken")).toBe(REFRESHED_TOKEN);
  });

  it("StrictMode double-mount with tampered token → still exactly ONE /auth/refresh", async () => {
    const counters = setupTamperedSessionHandlers();
    localStorage.setItem("accessToken", TAMPERED_TOKEN);

    renderAuth({ strictMode: true });

    await waitFor(() => expect(screen.getByTestId("userEmail").textContent).toBe(MOCK_USER.email));

    expect(counters.refresh).toBe(1);
    expect(counters.me).toBe(4); // 2 initial 403s (double mount) + 2 interceptor retries
    expect(screen.getByTestId("isLoading").textContent).toBe("false");
    expect(localStorage.getItem("accessToken")).toBe(REFRESHED_TOKEN);
  });

  it("guest (no token) StrictMode double-mount → exactly ONE non-fatal 400 MISSING_TOKEN refresh", async () => {
    let refreshCalls = 0;
    server.use(
      http.post(REFRESH, async () => {
        refreshCalls += 1;
        await new Promise((resolve) => setTimeout(resolve, 20));
        return HttpResponse.json(
          {
            error: "Failed to refresh session",
            code: "MISSING_TOKEN",
            message: "Refresh token is required",
          },
          { status: 400 },
        );
      }),
    );

    renderAuth({ strictMode: true });

    await waitFor(() => expect(screen.getByTestId("isLoading").textContent).toBe("false"));

    expect(refreshCalls).toBe(1);
    expect(screen.getByTestId("userEmail").textContent).toBe("null");
    expect(localStorage.getItem("accessToken")).toBeNull();
  });
});
