/**
 * @file shared/services/phaseGateService.ts
 * @description Phase gate API service — fetches the caller's phase gate and
 * caches the last successful answer so the gate survives a backend outage.
 *
 * Cache namespace (Story 25-2 — identity lockstep): exactly two keys,
 * `phaseGate:guest` and `phaseGate:user`. The bucket is chosen by identity
 * *class*, not identity, because `shared/**` may not import `features/auth`
 * (module-boundary rule) and no user id is persisted. A class split alone
 * cannot tell user A from user B on a shared device, so EVERY identity
 * transition evicts the cache through `clearPhaseGateCache()` — see
 * `features/auth/context/AuthContext.tsx`. A gate cached for one identity is
 * therefore never served to another while a fetch is failing.
 *
 * This module owns the namespace: no caller hardcodes a cache key string.
 */
import { apiClient } from "../api/axiosClient";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import type { PhaseGate } from "@mandarin/shared-types";

/** Prefix shared by every cached gate — the namespace `clearPhaseGateCache` owns. */
const CACHE_KEY_PREFIX = "phaseGate:";
const GUEST_CACHE_KEY = `${CACHE_KEY_PREFIX}guest`;
const USER_CACHE_KEY = `${CACHE_KEY_PREFIX}user`;

/**
 * Marker for the one-shot pre-25-2 cache purge. Deliberately OUTSIDE the
 * `phaseGate:` namespace so `clearPhaseGateCache()` never deletes it (deleting
 * it would re-arm the purge and wipe a fresh cache on the next load).
 */
const LEGACY_PURGE_MARKER = "mandarin:phaseGate-identity-purge:v1";

/**
 * Auth-keyed cache key (calibrated identity lockstep — Story 24-7).
 * The guest gate (`createGuestPhaseGate` → `{currentPhase: 1, isGuest: true}`)
 * and a logged-in user's persisted gate differ, so the localStorage fallback
 * must never serve one identity's gate to the other. Guest vs logged-in
 * buckets are separate; `usePhaseGate` re-fetches on auth change and
 * `AuthContext` evicts both buckets on every identity transition.
 */
function phaseGateCacheKey(): string {
  return localStorage.getItem("accessToken") ? USER_CACHE_KEY : GUEST_CACHE_KEY;
}

/**
 * Remove every cached phase gate (both identity classes) and nothing else.
 *
 * Called by `features/auth/context/AuthContext.tsx` on every identity
 * transition — login, register, explicit logout, silent 401 logout, boot-time
 * refresh failure, and refresh-cookie session restore — so the next fetch is
 * answered by the server (or by nothing) rather than by the previous
 * identity's gate.
 */
export function clearPhaseGateCache(): void {
  const keys: string[] = [];
  // Collect first, delete after: `removeItem` re-indexes localStorage mid-loop.
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_KEY_PREFIX)) keys.push(key);
  }
  keys.forEach((key) => localStorage.removeItem(key));
}

/**
 * One-shot purge of the pre-25-2 `phaseGate:user` residue.
 *
 * Builds before Story 25-2 wrote the user gate under the same `phaseGate:user`
 * key but never evicted it on identity change, so whatever sits there at the
 * first load after the upgrade may belong to a different person. The marker
 * makes the purge idempotent: it runs exactly once per device, so the gate
 * cached later in that session — and on every later boot — is preserved.
 */
export function purgeLegacyPhaseGateResidue(): void {
  if (localStorage.getItem(LEGACY_PURGE_MARKER)) return;
  localStorage.removeItem(USER_CACHE_KEY);
  localStorage.setItem(LEGACY_PURGE_MARKER, "done");
}

export async function fetchPhaseGate(): Promise<PhaseGate> {
  try {
    const response = await apiClient.get(ROUTE_PATTERNS.progressionPhaseGate);
    const data = response.data as PhaseGate;
    // Cache successfully fetched phase gate (auth-keyed — never cross-identity)
    localStorage.setItem(phaseGateCacheKey(), JSON.stringify(data));
    return data;
  } catch {
    // Backend unavailable — try the localStorage cache for THIS identity
    const cached = localStorage.getItem(phaseGateCacheKey());
    if (cached) {
      return JSON.parse(cached) as PhaseGate;
    }
    throw new Error("Phase gate unavailable");
  }
}
