/**
 * @file axiosClient.refresh.test.ts
 * @description Integration tests for the silent refresh flow (F4) using MSW.
 *
 * Guards against the F4 defect: the response interceptor only keyed on 401 while
 * the backend returns 403 INVALID_TOKEN for tampered access tokens, so an
 * auth-failed response never triggered `/auth/refresh` and the user was logged out.
 *
 * Each test asserts: auth-failed response → exactly ONE `/auth/refresh` call →
 * the original request retries successfully.
 */
import { describe, it, expect, afterEach, afterAll, beforeAll, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "src/mocks/server";
import { apiClient, requestAccessToken, setLogoutCallback, clearLogoutCallback } from "../axiosClient";

// apiClient baseURL is `http://localhost:3001/api`; MSW handlers need FULL URLs
// (relative paths are not resolved against an origin in the node test env).
const PROTECTED = "http://localhost:3001/api/v1/protected";
const REFRESH = "http://localhost:3001/api/v1/auth/refresh";

/** A well-formed (non-expired) JWT with a bad signature — not expired locally, invalid to the server. */
function createTamperedToken(): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify({ exp: Date.now() / 1000 + 3600, userId: "u1" }));
  return `${header}.${body}.invalid-signature`;
}

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
  clearLogoutCallback();
});

afterAll(() => server.close());

describe("axiosClient silent refresh (F4)", () => {
  it("403 INVALID_TOKEN → single /auth/refresh → retries the original request successfully", async () => {
    let protectedCalls = 0;
    let refreshCalls = 0;

    // Refresh must return a well-formed, NON-expired JWT — otherwise the request
    // interceptor treats it as expired and proactively refreshes again on the retry.
    const refreshedToken = createTamperedToken();
    server.use(
      http.get(PROTECTED, () => {
        protectedCalls += 1;
        if (protectedCalls === 1) {
          return HttpResponse.json(
            { error: "Forbidden", code: "INVALID_TOKEN", message: "Invalid access token" },
            { status: 403 },
          );
        }
        return HttpResponse.json({ success: true, data: { ok: true } }, { status: 200 });
      }),
      http.post(REFRESH, () => {
        refreshCalls += 1;
        return HttpResponse.json(
          { success: true, data: { accessToken: refreshedToken } },
          { status: 200 },
        );
      }),
    );

    // Tampered token: well-formed + not locally expired → server rejects with 403 INVALID_TOKEN
    localStorage.setItem("accessToken", createTamperedToken());

    const response = await apiClient.get("/v1/protected");

    expect(response.data).toEqual({ success: true, data: { ok: true } });
    expect(refreshCalls).toBe(1);
    expect(protectedCalls).toBe(2);
    expect(localStorage.getItem("accessToken")).toBe(refreshedToken);
  });

  it("401 → single /auth/refresh → retries the original request successfully", async () => {
    let protectedCalls = 0;
    let refreshCalls = 0;

    server.use(
      http.get(PROTECTED, () => {
        protectedCalls += 1;
        if (protectedCalls === 1) {
          return HttpResponse.json(
            { error: "Unauthorized", code: "TOKEN_EXPIRED", message: "Access token has expired" },
            { status: 401 },
          );
        }
        return HttpResponse.json({ success: true, data: { ok: true } }, { status: 200 });
      }),
      http.post(REFRESH, () => {
        refreshCalls += 1;
        // Well-formed non-expired JWT (see first test for why this matters).
        return HttpResponse.json(
          { success: true, data: { accessToken: createTamperedToken() } },
          { status: 200 },
        );
      }),
    );

    localStorage.setItem("accessToken", createTamperedToken());

    const response = await apiClient.get("/v1/protected");

    expect(response.data).toEqual({ success: true, data: { ok: true } });
    expect(refreshCalls).toBe(1);
    expect(protectedCalls).toBe(2);
  });

  it("refresh failure → rejects and invokes the logout callback", async () => {
    const logout = vi.fn();
    setLogoutCallback(logout);

    server.use(
      http.get(PROTECTED, () =>
        HttpResponse.json(
          { error: "Forbidden", code: "INVALID_TOKEN", message: "Invalid access token" },
          { status: 403 },
        ),
      ),
      http.post(REFRESH, () =>
        HttpResponse.json(
          {
            error: "Failed to refresh session",
            code: "INVALID_TOKEN",
            message: "Invalid refresh token",
          },
          { status: 401 },
        ),
      ),
    );

    localStorage.setItem("accessToken", createTamperedToken());

    await expect(apiClient.get("/v1/protected")).rejects.toBeDefined();
    expect(logout).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("accessToken")).toBeNull();
  });

  it("concurrent requestAccessToken() callers → exactly ONE /auth/refresh (shared single-flight dedupe)", async () => {
    let refreshCalls = 0;

    server.use(
      http.post(REFRESH, async () => {
        refreshCalls += 1;
        // Keep the in-flight window wide so both callers join the same promise.
        await new Promise((resolve) => setTimeout(resolve, 20));
        return HttpResponse.json(
          { success: true, data: { accessToken: createTamperedToken() } },
          { status: 200 },
        );
      }),
    );

    // Fire two refreshes back-to-back WITHOUT awaiting the first — both share
    // the single rotating refresh cookie, so only ONE POST may be issued.
    const [a, b] = await Promise.all([requestAccessToken(), requestAccessToken()]);

    expect(refreshCalls).toBe(1);
    expect(a).toBe(b);
    expect(localStorage.getItem("accessToken")).toBe(a);
  });
});
