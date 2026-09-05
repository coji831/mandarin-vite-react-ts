# SOLAR v5 — Pilot Scorecard (mandarin, branch `solar-v5-wire`)

Live proof-of-concept for the v5 governor harness. Small, deliberate tests first;
the full epic runs only after each primitive is green. Evidence = run-cards in
`.solar/runs/<thread>.json` + handoff results in `.solar/handoffs/` (the graph
node is the source of truth — no need to paste chat output).

## Ladder

| #   | Prompt (@Governor v5)                                                         | Proves                                                                | Status  | Evidence                                                                                          |
| --- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------- |
| T1  | Audit the shared `Button` component for DESIGN.md token violations            | Hermes decode → `review`/`code-reviewer`; single dispatch; read-only  | ✅ PASS | `runs/btn-token-audit.json` — role code-reviewer, APPROVED, 10 findings w/ token fixes, git clean |
| T2  | Trace how `optionalAuth` is resolved on the TTS endpoints and report findings | `research` → `investigator`; gather-only                              | ✅ PASS | `runs/tts-optionalauth-trace.json` — role investigator, APPROVED, deep trace + 6 flags, git clean |
| T3  | Add a small frontend util + test under `src/shared/`                          | **Stack resolution** (`frontend-engineer`); first write-capable agent | ✅ PASS | `runs/shared-utils-cn.json` — role frontend-engineer, 3 files (`cn.ts`+test+barrel), vitest 5/5 **independently verified**, lint/tsc green |
| T4  | Write the implementation note for the T2 findings, then have it reviewed      | **Nested delegation** (docs-writer → code-reviewer) + bubble-up       | ⬜      | —                                                                                                 |
| T5  | (vague/ambiguous ask, e.g. "it's still broken")                               | Hermes low/medium → **clearance bounce** (asks, doesn't guess)        | ⬜      | —                                                                                                 |
| T6  | epic 25 scoped run                                                            | Full self-chain (composition)                                         | ⬜      | only if T1–T5 green                                                                               |

## Gate notes

- Run each test in a **fresh chat / fresh thread** (isolation + clean signal).
  Cross-test context is the repo run-cards, not the chat.
- Inspect `git diff` after write-capable tests (T3+); commit only what to keep.
- Artifacts (runs/handoffs/ledger) are gitignored; this scorecard is committed.

## Caveats logged so far

1. **Token telemetry = 0 on `agent-dispatch`** — work happens in the IDE agent
   (DeepSeek via extension), outside the graph's metering. Token numbers only
   meaningful on the `http` runner.
2. **Verdict auto-APPROVED** — mandarin runs `human_approval: false` (light
   profile). Real code will also auto-approve unless we enable approvals.
3. T1/T2 both read-only (reviewer/investigator) — the real write + nesting risk
   starts at T3/T4.
4. **T3 nuance:** the stored objective was role-prefixed (`frontend-engineer: …`)
   + fully specified, so the run proved write-capability + scope discipline but
   did NOT exercise Hermes stack-resolution from a *vague* ask. Re-check that
   later with an unprefixed "add a small frontend util" if needed.

## Open risks to watch

- Nested delegation depth (does an agent-spawned agent spawn the next?) — T4.
- Hermes decision-card parsing + clearance UX in real Copilot — T5.
