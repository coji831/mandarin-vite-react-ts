# SOLAR v5 — Pilot Scorecard (mandarin, branch `solar-v5-wire`)

Live proof-of-concept for the v5 governor harness. Small, deliberate tests first;
the full epic runs only after each primitive is green. Evidence = run-cards in
`.solar/runs/<thread>.json` + handoff results in `.solar/handoffs/` (the graph
node is the source of truth — no need to paste chat output).

## Ladder

| #   | Prompt (@Governor v5)                                                         | Proves                                                                | Status     | Evidence                                                                                                                                                                                                                                                                                                                                                                                  |
| --- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1  | Audit the shared `Button` component for DESIGN.md token violations            | Hermes decode → `review`/`code-reviewer`; single dispatch; read-only  | ✅ PASS    | `runs/btn-token-audit.json` — role code-reviewer, APPROVED, 10 findings w/ token fixes, git clean                                                                                                                                                                                                                                                                                         |
| T2  | Trace how `optionalAuth` is resolved on the TTS endpoints and report findings | `research` → `investigator`; gather-only                              | ✅ PASS    | `runs/tts-optionalauth-trace.json` — role investigator, APPROVED, deep trace + 6 flags, git clean                                                                                                                                                                                                                                                                                         |
| T3  | Add a small frontend util + test under `src/shared/`                          | **Stack resolution** (`frontend-engineer`); first write-capable agent | ✅ PASS    | `runs/shared-utils-cn.json` — role frontend-engineer, 3 files (`cn.ts`+test+barrel), vitest 5/5 **independently verified**, lint/tsc green                                                                                                                                                                                                                                                |
| T4  | Write the implementation note for the T2 findings, then have it reviewed      | **Nested delegation** (docs-writer → code-reviewer) + bubble-up       | ✅ PASS    | `runs/t4-optionalauth-docsreview.json` — chain `docs-review`, ONE dispatch: docs-writer = CHAIN ENTRY, autonomously delegated → Code Reviewer verdict **bubbled as the FINAL result** (0 HIGH / 0 MEDIUM / 3 LOW, APPROVED). **Driver-mediated, NOT autonomous nesting — the Code Reviewer verdict was run by the Governor driver (see Caveat 7).** (First attempt misrouted — Caveat 5.) |
| T5  | (vague/ambiguous ask, e.g. "it's still broken")                               | Hermes low/medium → **clearance bounce** (asks, doesn't guess)        | ✅ PASS    | intake thread: Hermes decoded **low-confidence** (no target/stack/antecedent) → **clearance bounce** via `vscode_askQuestions` (asked "What specifically is 'it'?") → operator confirmed T5 probe. **No dispatch** (dispatching would falsify the test). Evidence lives in the intake thread, not a run-card — see Caveat 8.                                                              |
| T6  | epic 25 scoped run                                                            | Full self-chain (composition)                                         | 🟡 PARTIAL | `runs/epic25-phasea` (chain epic, investigator) + `epic25a-eng` (frontend-engineer) + `epic25a-docs` (docs-review, docs-writer) — epic-25 Phase A DELIVERED (route gating, LockedSurface, guest shell, docs; all APPROVED). But the full autonomous chain did NOT run: nested agents lack the agent-spawn tool (see Caveat 9). Governor reworked to driver-orchestrated links.            |

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
7. **T4 autonomy verdict — CORRECTED:** the re-run as `--chain docs-review` produced a docs-review run (`t4-optionalauth-docsreview.json`) with a Code Reviewer verdict "bubbled up", and it was initially logged as "autonomous nesting PROVEN". **That was WRONG.** The code-reviewer result itself said it was "run by the governor driver as a genuine separate Code Reviewer agent" — the DRIVER ran the next link, not docs-writer. T6 confirmed why: nested agents do not receive the agent-spawn tool. Lesson: write-then-review is driver-orchestrated (run the docs link, then run the review link); agents cannot self-chain.
8. **T5 evidence lives in the intake thread, not a run-card** — a clearance
   bounce fires BEFORE any dispatch, so there is no `.solar/runs/*.json` to
   cite. Evidence = Hermes's decision card (low → bounce, do-not-guess) + the
   operator's confirmation. T5 verified the bounce; **T6 (epic chain) is now
   unblocked** (T1–T5 all green).
9. **T6 / self-chain FALSIFIED (the pilot's headline finding):** when a
   specialist is run as a nested link it does NOT get the agent-spawn tool, so
   "agents chain themselves" cannot happen in this Copilot setup. The epic-25
   Phase A work was delivered as SEGMENTED driver runs (investigator stopped at
   the UIUX human gate and composed architect/uiux in-role; engineering and
   docs ran as separate dispatches) — real, APPROVED output, but not one
   autonomous chain. **Corrected model = driver-orchestrated chaining**: chain
   data decides the order, Governor v5 runs each link (`--role`) and threads
   context, one run-card per link. Governor + solar-agent-chain instruction
   reworked to match. Remaining real gaps: Storybook browser verification
   (wrong config dir), backend TTS guest-cost record deferred to epic-29.

## Pilot conclusion (2026-09-05)

T1–T5 PASS; T6 delivered real epic work but exposed the real execution model.
**Result: SOLAR v5 works as a deterministic driver-orchestrated harness** —
Hermes intake → clearance, Governor runs roles/chains via the graph, run-cards
per dispatch. What was FALSIFIED: autonomous agent-spawns-agent chaining (the
platform does not grant nested agents the agent tool). Design updated to match
reality. Uncommitted real work on the branch (route gating + epic-25 docs) is
ready for the operator to review/commit.

## Epic-25 close-out — Code Reviewer verdict (2026-09-05)

Driver-orchestrated `verify` chain (`investigator → code-reviewer`) re-run
headless over `http` / `deepseek-chat` with an efficient objective (thread
`e25verify-close`):

- **Code Reviewer verdict: APPROVED** — C1–C7 graded HIGH, C8 MEDIUM, each with
  `file:line` evidence; closes the epic-25 pending Code-Reviewer gate. Artifact:
  `.solar/chains/e25verify-close.md` (+ `.json`; run-cards
  `runs/e25verify-close-{0,1}.json`). `.solar/` artifacts are gitignored — this
  scorecard is the committed record.
- **Investigator link: REJECTED (max_rounds)** — the gather link exhausted its
  12-round cap (34 tool calls, 263.5k in, ~90 s) before a final answer; the
  error → REJECTED fix held (no false auto-approve). The reviewer link then
  completed (31 tools, 197.3k in, ~105 s). Net ≈ 461k in / 11.6k out / 65 tools
  / ~3.3 min; est ≈ $0.14 worst-case (no-cache), a fraction of that with cache.
- **Performance datapoint:** read-heavy GATHER roles (investigator) are the
  runaway risk — even at rounds 12 + truncation 8000 + an efficient objective, a
  thorough verify exceeds the cap; the cap never binds on the role that renders
  the verdict. Next lever: constrain the gather objective ("collect only what
  the reviewer needs; cite paths, don't page whole big files") rather than
  raising rounds.

## Open risks to watch

- ~~Autonomous agent-spawns-agent nesting~~ **FALSIFIED (Caveat 9)** — nested
  agents lack the agent tool. Replaced by driver-orchestrated chaining
  (Governor runs each link). Verify the reworked Governor on the next epic run.
- ~~Hermes decision-card parsing + clearance UX~~ **RESOLVED (T5 ✅).**
- Human-owned UIUX gate pausing a chain mid-run — exercised at T6 (investigator
  stopped at the gate correctly).
- Storybook browser verification (config dir) + backend TTS guest-cost record
  (epic-29 deferral) — follow-ups from T6.
