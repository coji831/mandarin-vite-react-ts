# SOLAR v5 — Pilot Scorecard (mandarin, branch `solar-v5-wire`)

Live proof-of-concept for the v5 governor harness. Small, deliberate tests first;
the full epic runs only after each primitive is green. Evidence = run-cards in
`.solar/runs/<thread>.json` + handoff results in `.solar/handoffs/` (the graph
node is the source of truth — no need to paste chat output).

## Ladder

| #   | Prompt (@Governor v5)                                                         | Proves                                                                | Status  | Evidence                                                                                                                                                                                                                                                                                                                     |
| --- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1  | Audit the shared `Button` component for DESIGN.md token violations            | Hermes decode → `review`/`code-reviewer`; single dispatch; read-only  | ✅ PASS | `runs/btn-token-audit.json` — role code-reviewer, APPROVED, 10 findings w/ token fixes, git clean                                                                                                                                                                                                                            |
| T2  | Trace how `optionalAuth` is resolved on the TTS endpoints and report findings | `research` → `investigator`; gather-only                              | ✅ PASS | `runs/tts-optionalauth-trace.json` — role investigator, APPROVED, deep trace + 6 flags, git clean                                                                                                                                                                                                                            |
| T3  | Add a small frontend util + test under `src/shared/`                          | **Stack resolution** (`frontend-engineer`); first write-capable agent | ✅ PASS | `runs/shared-utils-cn.json` — role frontend-engineer, 3 files (`cn.ts`+test+barrel), vitest 5/5 **independently verified**, lint/tsc green                                                                                                                                                                                   |
| T4  | Write the implementation note for the T2 findings, then have it reviewed      | **Nested delegation** (docs-writer → code-reviewer) + bubble-up       | ✅ PASS | `runs/t4-optionalauth-docsreview.json` — chain `docs-review`, ONE dispatch: docs-writer = CHAIN ENTRY, autonomously delegated → Code Reviewer verdict **bubbled as the FINAL result** (0 HIGH / 0 MEDIUM / 3 LOW, APPROVED). **Autonomous nesting PROVEN.** (First attempt was mediated + misrouted — see Caveats 5–7.)      |
| T5  | (vague/ambiguous ask, e.g. "it's still broken")                               | Hermes low/medium → **clearance bounce** (asks, doesn't guess)        | ✅ PASS | intake thread: Hermes decoded **low-confidence** (no target/stack/antecedent) → **clearance bounce** via `vscode_askQuestions` (asked "What specifically is 'it'?") → operator confirmed T5 probe. **No dispatch** (dispatching would falsify the test). Evidence lives in the intake thread, not a run-card — see Caveat 8. |
| T6  | epic 25 scoped run                                                            | Full self-chain (composition)                                         | ⬜      | only if T1–T5 green                                                                                                                                                                                                                                                                                                          |

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
   - fully specified, so the run proved write-capability + scope discipline but
     did NOT exercise Hermes stack-resolution from a _vague_ ask. Re-check that
     later with an unprefixed "add a small frontend util" if needed.
5. **T4 routing fallback:** an unprefixed write-then-review objective
   ("Write the implementation note … then have it reviewed") classified to the
   generic `reviewer` role (read-only, system prompt = adversarial verdict), not
   `docs-writer` — the handoff even pointed at a non-existent
   `.github/agents/reviewer.agent.md`. Resolution: user-approved re-run pinned
   `--role docs-writer` (fresh thread `t4-optionalauth-note`). Root cause =
   classifier lacks role names in the objective (cf. Caveat 4); generic
   `reviewer` fallback cannot satisfy a _write_ objective. Recommend: either
   role-prefix such tasks, or make the classifier treat "write a note/doc" as
   `docs-writer` before the review keyword.
6. **T4 nested-review residual:** the nested code-reviewer APPROVED with one
   residual line-ref error left in the note's Truth-check record
   (`assertEnvClaim` :58–67 vs actual :62–68; the LOW fix landed only in the
   body, not the record). Driver caught + fixed post-run. Implies the reviewer
   fix list should be re-applied verbatim to the whole artifact, not just
   where the finding was quoted.
7. **T4 autonomy verdict (chain re-run):** the first attempt was MEDIATED (two
   dispatches, driver composed the review brief) because it wasn't run as a
   chain. Re-run as `--chain docs-review` → docs-writer's handoff carried
   `## Chain mode` (entry), it autonomously delegated to Code Reviewer, and the
   verdict bubbled up as the final result in ONE run (`t4-optionalauth-
docsreview.json`). **Conclusion: agent-spawned-agent nesting works at depth 2
   when the entry is told it's a chain.** Lesson: write-then-review must go
   through the chain, not single dispatch.
8. **T5 evidence lives in the intake thread, not a run-card** — a clearance
   bounce fires BEFORE any dispatch, so there is no `.solar/runs/*.json` to
   cite. Evidence = Hermes's decision card (low → bounce, do-not-guess) + the
   operator's confirmation. T5 verified the bounce; **T6 (epic chain) is now
   unblocked** (T1–T5 all green).

## Open risks to watch

- ~~Nested delegation depth~~ **RESOLVED at depth 2** (T4 chain re-run). Remaining:
  depth beyond 2 (epic T6) — same mechanism, unproven at 7 links.
- ~~Hermes decision-card parsing + clearance UX in real Copilot~~ **RESOLVED (T5 ✅):**
  low-confidence decode → `vscode_askQuestions` clearance bounce fired pre-dispatch;
  operator confirmed the probe. No guess-dispatch.
- Human-owned UIUX gate pausing a chain mid-run — epic T6.
