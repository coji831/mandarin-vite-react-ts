/**
 * @file apps/backend/src/modules/progression/services/__tests__/gateStatus.factory.test.ts
 * @description Unit tests for `buildGuestGateStatus` (Story 25-2 — Guest
 * Identity Lockstep). These are the drift proofs: every gate field is derived
 * from the guest identity, so moving the guest's phase MUST move the gates.
 * Re-hardcoding `"Guest — Phase 1 only"` fails the Phase-4 case immediately,
 * and the Phase-1 case pins the pre-25-2 wire shape byte-for-byte.
 */

import { describe, it, expect } from "vitest";
import { createGuestPhaseGate } from "@mandarin/shared-constants";
import { buildGuestGateStatus } from "../gateStatus.factory.js";

/** The three computed gates the builder must fill (order = payload key order). */
const GATE_KEYS = ["phase2Gate", "characterCountGate", "phase3To4Gate"] as const;

describe("buildGuestGateStatus (Story 25-2)", () => {
  it("Phase-1 guest → the calibrated lock payload, byte-identical to the retired literal", () => {
    const gates = buildGuestGateStatus(createGuestPhaseGate());

    expect(Object.keys(gates)).toEqual([...GATE_KEYS]);
    for (const key of GATE_KEYS) {
      expect(gates[key]).toEqual({
        passed: false,
        reason: "GUEST",
        details: "Guest — Phase 1 only",
      });
      // Wire shape (key presence + order), not just deep equality.
      expect(Object.keys(gates[key])).toEqual(["passed", "reason", "details"]);
    }
  });

  it('DRIFT PROOF: a Phase-4 guest flips every gate to passed with "Phase 4" details', () => {
    const gates = buildGuestGateStatus({ currentPhase: 4, isGuest: true });

    for (const key of GATE_KEYS) {
      expect(gates[key].passed).toBe(true);
      expect(gates[key].details).toContain("Phase 4");
      expect(gates[key].details).not.toContain("Phase 1");
      // A passed gate carries no lock reason.
      expect(gates[key].reason).toBeUndefined();
      expect(Object.keys(gates[key])).toEqual(["passed", "details"]);
    }
  });

  it("phase boundary: the lock follows `currentPhase >= 2` exactly", () => {
    const locked = buildGuestGateStatus({ currentPhase: 1, isGuest: true });
    const unlocked = buildGuestGateStatus({ currentPhase: 2, isGuest: true });

    for (const key of GATE_KEYS) {
      expect(locked[key].passed).toBe(false);
      expect(locked[key].reason).toBe("GUEST");
      expect(unlocked[key].passed).toBe(true);
      expect(unlocked[key].reason).toBeUndefined();
      expect(unlocked[key].details).toContain("Phase 2");
    }
  });

  it("derives all three gates from ONE value (no per-gate literal can diverge)", () => {
    const gates = buildGuestGateStatus({ currentPhase: 3, isGuest: true });

    expect(gates.phase2Gate).toEqual(gates.characterCountGate);
    expect(gates.characterCountGate).toEqual(gates.phase3To4Gate);
  });

  it("non-guest identity → throws (a guest payload never replaces a real gate)", () => {
    expect(() => buildGuestGateStatus({ currentPhase: 3, isGuest: false })).toThrow(
      "Failed to build guest gate status for a non-guest identity",
    );
  });
});
