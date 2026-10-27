/**
 * @file apps/backend/src/modules/progression/services/gateStatus.factory.ts
 * @description Single source for the CALIBRATED guest gate payload (Story 25-2
 * — Guest Identity Lockstep).
 *
 * Before 25-2 the two guest surfaces answered independently: `getPhaseGate`
 * returned `createGuestPhaseGate()` (`{ currentPhase: 1, isGuest: true }`)
 * while `getGates` hand-wrote a second payload with six hardcoded
 * `"Guest — Phase 1 only"` strings. Two literals, two chances to drift — the
 * same anonymous identity could be told Phase 1 by one endpoint and something
 * else by the other. This builder removes the second literal: every field
 * below is a function of the guest identity (`guest.currentPhase`), so `/gates`
 * can only ever repeat what `/phase-gate` said.
 *
 * Why a builder and not one shared object: the surfaces have different shapes
 * (`PhaseGate` vs `{ phase2Gate, characterCountGate, phase3To4Gate }`), so no
 * single value can serve both. The builder takes the guest slice of the
 * `PhaseGate` answer — `buildGuestGateStatus(createGuestPhaseGate())` — and
 * projects it onto the computed-gates shape.
 *
 * Pure: no I/O, no clock, no Prisma. The guest branch never touches the
 * database, which is why there is no server-side gate cache to invalidate
 * (the story 25-2 two-identity integration test pins that as an invariant).
 */

import type { GateResult } from "../types/progression.js";

/**
 * The guest slice of the phase gate — the ONLY input the computed gates derive
 * from. Structural (not tied to one DTO) so `createGuestPhaseGate()` can be
 * passed straight in.
 */
export interface GuestGateIdentity {
  /** Phase the server granted this identity (a real guest is always 1). */
  currentPhase: number;
  /** Marks the session-local guest identity (`createGuestPhaseGate()` → true). */
  isGuest: boolean;
}

/**
 * Computed gate statuses for a guest identity — the `/v1/progression/gates`
 * payload. Same shape `ProgressionService.getGateStatus` returns for a
 * registered user.
 */
export interface GuestGateStatus {
  phase2Gate: GateResult;
  characterCountGate: GateResult;
  phase3To4Gate: GateResult;
}

/** Lock reason for a guest-held gate (computed-gate UPPER_SNAKE vocabulary). */
const GUEST_LOCK_REASON = "GUEST";

/**
 * Project the guest identity onto ONE computed gate.
 *
 * - `passed` — derived: Phase 1 is the guest lock, so any phase ≥ 2 passes.
 * - `reason` — {@link GUEST_LOCK_REASON} while the gate is locked; a passed
 *   gate has no lock reason and the key is absent (JSON drops `undefined`
 *   anyway, so the wire shape stays clean).
 * - `details` — derived: the guest's own phase, never a fixed "Phase 1".
 *
 * @param guest - Guest identity to derive from
 * @returns Gate result for one computed gate
 */
function buildGuestGate(guest: GuestGateIdentity): GateResult {
  const passed = guest.currentPhase >= 2;
  return {
    passed,
    ...(passed ? {} : { reason: GUEST_LOCK_REASON }),
    details: `Guest — Phase ${guest.currentPhase} only`,
  };
}

/**
 * Build the `/v1/progression/gates` guest payload from the SAME answer
 * `/v1/progression/phase-gate` serves — call as
 * `buildGuestGateStatus(createGuestPhaseGate())`.
 *
 * All three computed gates share one derivation (a guest has no per-gate
 * data). The Phase-1 payload is byte-identical to the pre-25-2 hand-written
 * one: `{ passed: false, reason: "GUEST", details: "Guest — Phase 1 only" }`.
 *
 * @param guest - Guest identity (`createGuestPhaseGate()` output works as-is)
 * @returns Computed gate statuses for the guest identity
 * @throws Error when the input is not a guest identity — a guest-shaped
 *         payload must never replace a signed-in learner's real gates
 */
export function buildGuestGateStatus(guest: GuestGateIdentity): GuestGateStatus {
  if (!guest.isGuest) {
    throw new Error("Failed to build guest gate status for a non-guest identity");
  }
  return {
    phase2Gate: buildGuestGate(guest),
    characterCountGate: buildGuestGate(guest),
    phase3To4Gate: buildGuestGate(guest),
  };
}
