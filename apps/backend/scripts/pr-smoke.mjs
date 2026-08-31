#!/usr/bin/env node
/**
 * @file apps/backend/scripts/pr-smoke.mjs
 * @description Dependency-free smoke test for the NestJS backend (Story 24-17).
 *
 * Shared smoke procedure for BOTH the merge-PR environment (Railway pr-*
 * preview) and the post-flip production smoke after the 24-15 cutover — see
 * docs/guides/operations/deployment.md (§Post-Deployment Verification).
 *
 * Usage:
 *   node apps/backend/scripts/pr-smoke.mjs <BASE_URL>
 *   SMOKE_BASE_URL=<BASE_URL> node apps/backend/scripts/pr-smoke.mjs
 *
 * BASE_URL is the raw origin, e.g. https://<app>.up.railway.app or
 * http://localhost:3001. Routes are asserted under the /api/v1 prefix.
 *
 * Asserts:
 *   - GET  /api/v1/health                       -> 200 + logs the
 *       services.gemini / services.tts / cache.redis booleans (never trust the
 *       always-200 wrapper alone)
 *   - POST /api/v1/auth/register                -> 201 + httpOnly refresh
 *       set-cookie
 *   - POST /api/v1/auth/login                   -> 200 + access token
 *   - POST /api/v1/auth/refresh                 -> 200 (rotation, reads the
 *       refresh cookie)
 *   - GET  /api/v1/auth/me (with Bearer token)  -> 200
 *   - GET  /api/v1/progression/phase-gate (guest) -> { currentPhase: 1, isGuest: true }
 *   - GET  /api/v1/auth/me (no token)           -> 401 { code, message, requestId }
 *
 * Deliberately does NOT assert user-data routes (review / readers / progress /
 * quiz) — on an unseeded preview DB they return empty 200 (documented residual).
 *
 * Exits non-zero on any failed assertion. Uses a unique test-user email to
 * avoid collisions and does best-effort cleanup (logout invalidates the refresh
 * session; the user row may remain on a preview DB, which is harmless).
 *
 * Dependency-free: Node >= 20.7 native fetch + getSetCookie; the repo engines
 * pin Node >= 24.
 */

const BASE_URL = (process.argv[2] ?? process.env.SMOKE_BASE_URL ?? "").replace(/\/+$/, "");

if (!BASE_URL) {
  console.error("[SMOKE] usage: node apps/backend/scripts/pr-smoke.mjs <BASE_URL>");
  process.exit(2);
}

const REQUEST_TIMEOUT_MS = 15_000;
const HEALTH_ATTEMPTS = 10;
const HEALTH_RETRY_MS = 5_000;

let failures = 0;

function fail(label, detail) {
  failures += 1;
  console.error(`[SMOKE] ✗ FAIL ${label}${detail ? ` — ${detail}` : ""}`);
}

function pass(label) {
  console.log(`[SMOKE] ✓ ok ${label}`);
}

function assert(cond, label, detail) {
  if (cond) {
    pass(label);
  } else {
    fail(label, detail);
  }
}

async function request(path, { method = "GET", headers = {}, body } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "follow",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, headers: res.headers, json, text };
}

function getSetCookie(res) {
  const setCookie = res.headers.getSetCookie?.() ?? [];
  if (setCookie.length) return setCookie;
  const single = res.headers.get("set-cookie");
  return single ? [single] : [];
}

function extractCookieValue(setCookies, name) {
  for (const c of setCookies) {
    const m = c.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
    if (m) return m[1];
  }
  return null;
}

const now = Date.now();
const EMAIL = `smoke-${now}-${Math.random().toString(36).slice(2, 8)}@example.com`;
const PASSWORD = "SmokeT3st!2026";

console.log(`[SMOKE] base=${BASE_URL} user=${EMAIL}`);

// ── 1. Health ─────────────────────────────────────────────────────────────
{
  let health = null;
  for (let attempt = 1; attempt <= HEALTH_ATTEMPTS; attempt += 1) {
    try {
      const res = await request("/api/v1/health");
      if (res.status === 200) {
        health = res;
        break;
      }
      console.log(
        `[SMOKE] health not ready (status ${res.status}) — attempt ${attempt}/${HEALTH_ATTEMPTS}`,
      );
    } catch (err) {
      console.log(
        `[SMOKE] health not ready (${err?.message ?? err}) — attempt ${attempt}/${HEALTH_ATTEMPTS}`,
      );
    }
    if (attempt < HEALTH_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, HEALTH_RETRY_MS));
    }
  }
  assert(health !== null, "health -> 200", "endpoint never returned 200");
  if (health) {
    const j = health.json ?? {};
    const services = j.services ?? {};
    const redis = j.cache?.redis ?? {};
    // Log the dependency booleans — the always-200 wrapper alone is not proof
    // the external services / cache are actually up.
    console.log(
      `[SMOKE] health body: services.gemini=${services.gemini} services.tts=${services.tts} cache.redis.connected=${redis.connected}`,
    );
    assert(
      typeof services.gemini === "boolean",
      "health services.gemini is a boolean",
      `got ${String(services.gemini)}`,
    );
    assert(
      typeof services.tts === "boolean",
      "health services.tts is a boolean",
      `got ${String(services.tts)}`,
    );
    assert(
      typeof redis.connected === "boolean",
      "health cache.redis.connected is a boolean",
      `got ${String(redis.connected)}`,
    );
  }
}

// ── 2. Register ───────────────────────────────────────────────────────────
let refreshToken = null;
let accessToken = null;
{
  const res = await request("/api/v1/auth/register", {
    method: "POST",
    body: { email: EMAIL, password: PASSWORD, displayName: "Smoke Tester" },
  });
  const setCookies = getSetCookie(res);
  refreshToken = extractCookieValue(setCookies, "refreshToken");
  const httpOnlyRefresh = setCookies.some((c) => /refreshToken=/.test(c) && /HttpOnly/i.test(c));
  accessToken = res.json?.data?.accessToken ?? null;
  assert(res.status === 201, "register -> 201", `status ${res.status}`);
  assert(!!refreshToken, "register sets refresh token cookie", "no refreshToken= in set-cookie");
  assert(httpOnlyRefresh, "register refresh cookie is httpOnly", JSON.stringify(setCookies));
  assert(!!accessToken, "register returns accessToken", "no data.accessToken");
}

// ── 3. Login ──────────────────────────────────────────────────────────────
{
  const res = await request("/api/v1/auth/login", {
    method: "POST",
    body: { email: EMAIL, password: PASSWORD },
  });
  const setCookies = getSetCookie(res);
  const loginAccess = res.json?.data?.accessToken ?? null;
  if (loginAccess) accessToken = loginAccess;
  const loginRefresh = extractCookieValue(setCookies, "refreshToken");
  if (loginRefresh) refreshToken = loginRefresh; // login rotates the session too
  assert(res.status === 200, "login -> 200", `status ${res.status}`);
  assert(!!accessToken, "login returns accessToken", "no data.accessToken");
  assert(
    setCookies.some((c) => /refreshToken=/.test(c) && /HttpOnly/i.test(c)),
    "login refresh cookie is httpOnly",
    JSON.stringify(setCookies),
  );
}

// ── 4. Refresh (rotation) ─────────────────────────────────────────────────
{
  const res = await request("/api/v1/auth/refresh", {
    method: "POST",
    headers: refreshToken ? { Cookie: `refreshToken=${refreshToken}` } : {},
  });
  const setCookies = getSetCookie(res);
  const rotated = extractCookieValue(setCookies, "refreshToken");
  assert(res.status === 200, "refresh -> 200", `status ${res.status}`);
  assert(!!res.json?.data?.accessToken, "refresh returns new accessToken", "no data.accessToken");
  assert(
    !!rotated && rotated !== refreshToken,
    "refresh rotates refresh cookie",
    "token not rotated",
  );
  if (rotated) refreshToken = rotated;
}

// ── 5. Authenticated me ───────────────────────────────────────────────────
{
  const res = await request("/api/v1/auth/me", {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  assert(res.status === 200, "me (with token) -> 200", `status ${res.status}`);
  assert(!!res.json?.data?.user?.id, "me returns user", "no data.user.id");
}

// ── 6. Guest phase-gate ───────────────────────────────────────────────────
{
  const res = await request("/api/v1/progression/phase-gate");
  assert(res.status === 200, "phase-gate (guest) -> 200", `status ${res.status}`);
  assert(
    res.json?.currentPhase === 1 && res.json?.isGuest === true,
    "phase-gate (guest) -> { currentPhase: 1, isGuest: true }",
    JSON.stringify(res.json),
  );
}

// ── 7. Envelope (401 without token) ───────────────────────────────────────
{
  const res = await request("/api/v1/auth/me");
  const j = res.json ?? {};
  assert(res.status === 401, "me (no token) -> 401", `status ${res.status}`);
  assert(typeof j.code === "string" && j.code.length > 0, "envelope has code", JSON.stringify(j));
  assert(
    typeof j.message === "string" && j.message.length > 0,
    "envelope has message",
    JSON.stringify(j),
  );
  assert(
    typeof j.requestId === "string" && j.requestId.length > 0,
    "envelope has requestId",
    JSON.stringify(j),
  );
}

// ── Cleanup (best-effort) ─────────────────────────────────────────────────
{
  try {
    await request("/api/v1/auth/logout", {
      method: "POST",
      headers: refreshToken ? { Cookie: `refreshToken=${refreshToken}` } : {},
    });
    console.log("[SMOKE] ✓ ok cleanup (logout)");
  } catch {
    // best-effort — a preview DB may keep the user row, which is harmless
  }
}

if (failures > 0) {
  console.error(`[SMOKE] ✗ ${failures} assertion(s) failed`);
  process.exit(1);
}
console.log("[SMOKE] ✓ all smoke assertions passed");
process.exit(0);
