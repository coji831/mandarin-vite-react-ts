/**
 * Unit tests for `createGuestPhaseGate` — the calibrated guest identity.
 * Story 24-7: guests unlock exactly Phase 1 (`{currentPhase: 1, isGuest: true}`),
 * never all content. The old over-generous shape was `{currentPhase: 4,
 * phase4Unlocked: true}`; the `id: "guest-unlocked"` sentinel is preserved so
 * `isGuestPhaseGate` (shared-types) keeps recognizing the guest gate.
 */
import { describe, expect, it } from "vitest";
import { createGuestPhaseGate } from "../index.js";

describe("createGuestPhaseGate", () => {
  it("returns the calibrated Phase-1 guest shape (currentPhase: 1, isGuest: true)", () => {
    const gate = createGuestPhaseGate();
    expect(gate.currentPhase).toBe(1);
    expect(gate.isGuest).toBe(true);
  });

  it("does NOT unlock all phases (no phase4Unlocked all-unlock)", () => {
    const gate = createGuestPhaseGate();
    expect(gate.phase4Unlocked).toBe(false);
    expect(gate.phase4Unlocked).not.toBe(true);
    expect(gate.currentPhase).not.toBe(4);
  });

  it("reports no passed phase gates or progression data (guest = none)", () => {
    const gate = createGuestPhaseGate();
    expect(gate.phase1Passed).toBe(false);
    expect(gate.phase2Passed).toBe(false);
    expect(gate.phase3Passed).toBe(false);
    expect(gate.qualificationScore).toBeNull();
    expect(gate.placedPhase).toBeNull();
    expect(gate.phase1Retention).toBeNull();
    expect(gate.phase2Retention).toBeNull();
    expect(gate.phase3Retention).toBeNull();
    expect(gate.gateCriteria).toBeNull();
  });

  it("keeps the guest-unlocked sentinel id so isGuestPhaseGate still matches", () => {
    const gate = createGuestPhaseGate();
    expect(gate.id).toBe("guest-unlocked");
  });

  it("stamps createdAt/updatedAt with the current time", () => {
    const gate = createGuestPhaseGate();
    expect(typeof gate.createdAt).toBe("string");
    expect(typeof gate.updatedAt).toBe("string");
    expect(new Date(gate.createdAt).getTime()).not.toBeNaN();
    expect(new Date(gate.updatedAt).getTime()).not.toBeNaN();
  });
});
