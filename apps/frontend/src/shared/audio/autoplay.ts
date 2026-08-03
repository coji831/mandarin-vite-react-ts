/**
 * @file shared/audio/autoplay.ts
 * @description Autoplay-policy detection wrapper (feature-detected, 2026 modern path).
 *
 * Thin wrapper over `navigator.getAutoplayPolicy("mediaelement")` so the
 * AudioManager is testable without touching `navigator` directly: the manager
 * receives an injected policy getter (default: `detectAutoplayPolicy`).
 *
 * The `NotAllowedError` catch on `audio.play()` remains the runtime fallback —
 * the policy API is advisory and gesture-tracking is stateful. Both paths
 * converge on `status: "blocked"`.
 */

export type AutoplayPolicy = "allowed" | "allowed-muted" | "disallowed" | "unknown";

/** Injected policy getter — lets callers/tests control the policy without `navigator`. */
export type AutoplayPolicyGetter = () => AutoplayPolicy;

interface NavigatorWithAutoplayPolicy {
  getAutoplayPolicy?(
    arg: "mediaelement" | HTMLMediaElement,
  ): "allowed" | "allowed-muted" | "disallowed";
}

/**
 * Returns the autoplay policy using the injected getter.
 *
 * @param getter policy getter (default: feature-detected `navigator` lookup)
 */
export function getAutoplayPolicy(
  getter: AutoplayPolicyGetter = detectAutoplayPolicy,
): AutoplayPolicy {
  return getter();
}

/**
 * Default policy getter: queries `navigator.getAutoplayPolicy("mediaelement")`
 * when available, falling back to the per-element variant when an element is
 * provided, else `"unknown"`.
 *
 * @param element optional media element for the more-accurate per-element variant
 */
export function detectAutoplayPolicy(element?: HTMLMediaElement): AutoplayPolicy {
  if (typeof navigator === "undefined") return "unknown";

  const nav = navigator as NavigatorWithAutoplayPolicy;
  if (typeof nav.getAutoplayPolicy !== "function") return "unknown";

  try {
    const result = element ? nav.getAutoplayPolicy(element) : nav.getAutoplayPolicy("mediaelement");
    if (result === "allowed" || result === "allowed-muted" || result === "disallowed") {
      return result;
    }
  } catch {
    // API present but threw — treat as unknown and rely on the runtime catch.
  }
  return "unknown";
}
