/**
 * legacyProgress.ts
 *
 * Utility helpers to read/clear/write legacy persisted Mandarin progress.
 * This abstraction centralizes legacy storage key handling so the provider can
 * deterministically clear legacy data during initialization.
 */
const LEGACY_KEY = "mandarin:progress";

export function readLegacyProgress(): unknown | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn("readLegacyProgress: failed to read legacy progress", e);
    return null;
  }
}

export function clearLegacyProgress(): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.removeItem(LEGACY_KEY);
  } catch (e) {
    console.warn("clearLegacyProgress: failed to clear legacy progress", e);
  }
}

export function writeLegacyProgress(data: unknown): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(LEGACY_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("writeLegacyProgress: failed to write legacy progress", e);
  }
}
