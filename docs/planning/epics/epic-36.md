---
purpose: "ASR Pronunciation & Tone Feedback"
status: ratified
last-verified: 2026-10-31
type: planning
---

# Epic 36 — ASR Pronunciation & Tone Feedback _(N1)_ _(product-gated)_

**Goal:** Ship hybrid F0 + ASR speaking practice (A1 shadowing + A2 read-aloud) with scoring — product-gated on the Q11 validation pass.

**Boundary — IN:** hybrid F0 + ASR scoring seam (client YIN/WebAudio F0 + ASR phoneme alignment); formats A1 shadowing + A2 read-aloud (P7); pitch-overlay UI + score feedback; scoring auth-only + guest **demo quota 3+3 tries/day** (**P8/P18 re-framed**); product-gate = Q11 pass (iFlytek ISE / Azure zh-CN / FunASR / in-house hybrid shortlist — FV4/FV6; run approved, parallel).

**Boundary — NON-GOALS (OUT):** phoneme-level analytics → not v1; voice/video calls/avatar → not v1; vendor tone-error-rate promise → measured in-house (Q11), not a vendor claim.

**Rough AC (5):**

1. BE: ASR scoring endpoint (auth + guest 3+3/day server-enforced) returns pronunciation/tone feedback for A1 + A2.
2. FE: recording UI (mic, playback, pitch overlay) + score display for both formats; story/e2e with mocked ASR.
3. BE: hybrid seam — client F0 extracted and combined with ASR alignment; neutral-tone/tone-sandhi handling documented.
4. Gate: epic closes only after the Q11 validation-pass record is attached (per-vendor tone accuracy, F0 reliability, whisper degradation, safe threshold).
5. Guest: ASR scoring under demo quota (3+3) — no unbounded guest cost (L5).

**UI scope:** `UI: A1 shadowing + A2 read-aloud speaking UI (record/playback + pitch overlay + score feedback) — design spec TBD`.

**Dependencies:** needs 29 (gateway/quota), Q11 pass (parallel — **de-gates 36**), 39 (soft: logs for debugging).

**Close criteria:** BR/impl + Storybook-first speaking UI; Tier 1 + Tier 2; verification artifact = the Q11 evidence + threshold record (blocking AC 4).

---

---

Back to the index: [Epic Plan 25-40](../epics-25-40.md) | sequencing: [Sequencing Summary](../epics-25-40.md#sequencing-summary)
