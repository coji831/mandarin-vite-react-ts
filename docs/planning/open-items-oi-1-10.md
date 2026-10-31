---
purpose: "Decision record for open items OI-1 to OI-10 raised during the 25-40 re-slice"
status: ratified
last-verified: 2026-10-31
type: planning
---

# Resolved Open Items OI-1 to OI-10 (Decision Record)

## OI-1 — D7 home + `epic-24` name collision

- **Recommendation:** Re-scope the parked `epic-24-dotnet-migration` **in place** → **`epic-24-nestjs-shell-migration`** (D7 track): replace the ASP.NET content with the NestJS 11 shell-swap scope, run **parallel to epics 25–28, complete before epic-29** (locked D7), and mark the .NET-specific material **RETIRED** (its revalidation gate is unmet and D1 already rejects .NET). Resolve the collision by **renumbering `epic-24-traditional-characters` → `epic-41-traditional-characters`** (rename BR + impl folders), status **"deferred — Phase-4 content, out of 25–40 scope, not scheduled in this plan."**
- **Rationale:** D7 is decided (2026-08-17) and needs an execution vehicle; re-scoping in place keeps the migration's traceability (oldest open "backend replacement" epic) and its revalidation-gate history. The traditional-characters epic is real, committed, and Phase-4 (post-roadmap) — it must keep a number, but it cannot share "epic-24" with the active migration track; 41 is the first free slot after the 25–40 arc.
- **Status:** `RESOLVED — EXECUTED (docs reorg Pass 1 + renumber epic-24→41, 2026-08-17)`
- **Where it lands:** epic-plan renumber table + `tech-mapping.md` §6 (D7 row) + a retirement note on the old dotnet impl folder.
- **Residual risk:** Renaming the two committed `epic-24-traditional-characters` folders is a docs-churn item; must land in one commit with the renumber table to avoid broken links.
- **Re-ratified 2026-08-21 (serial; D10):** the OI-1 execution framing — "run **parallel to epics 25–28, complete before epic-29**" — is **superseded** by the owner's serial decision: **full-scoped Epic 24 runs FIRST to completion (15 stories, fully self-contained), then epics 25–28 land on NestJS**. The D7 home + `epic-24` name-collision resolution stands unchanged; only the execution timing changed. See the new decision-log entry **D10** (`.github/decision-log.json`).

## OI-2 — Quota-number final sign-off

- **Recommendation:** **Confirm the committed defaults as fixed planning defaults NOW** — ASR **3+3 tries/day** · AI generation **5/3/1/1 per day** · Conversation **1 session ≤5 turns/day** · TTS **2 generated-audio calls/day** (figure from OI-3). Close business item B.2/D6 at **planning time**, not at five separate BR-time confirmations (epic-25/26/29/31/36). The only still-blank figure (TTS generated-audio count) is filled by OI-3.
- **Rationale:** The numbers are already owner-**accepted** ("Defaults accepted", pivot decision 3); the only remaining step was a confirm ritual repeated across five BRs. Deferring to BR time creates churn with zero new information. All numbers are per-guest, session-local, server-enforced — consistent with L1/L5.
- **Status:** `RESOLVED — recommended`
- **Where it lands:** business-model Appendix B.2 row closed; `tech-mapping` D6 marked resolved; BRs 25/26/29/31/36 cite the planning doc instead of re-confirming.
- **Residual risk:** None material — defaults are penny-scale; any future change keys off costing data (same trigger as OI-3/OI-5).

## OI-3 — TTS guest mechanics

- **Recommendation:** Split the resolution across two epics: **epic-25** resolves the **read/cache path** — verify both `POST /v1/tts` and `POST /v1/readers/passages/:id/audio` are cache-first (cache-miss ≠ guest-visible cost on the read path), confirm they stay free reads, and record the actual miss→generation path per surface. **epic-29 M2** owns the **generated-audio quota figure + server-side counter** — default **2 generated-audio calls/day per guest**, enforced by the same Redis per-guest counter (`quota:<day>:<deviceUserId|ip|fp>:tts`) + `AICallLog` write path as the demo-quota counters and circuit breaker. No separate TTS counter in epic-25.
- **Rationale:** TTS generation is vendor cost and must be enforced by the single L5 machinery epic-29 M2 builds — building a TTS-only counter in epic-25 would be throwaway when the unified quota spine lands. epic-25's verification is needed first so epic-29 sizes the counter correctly (which surface actually generates on miss). 2/day = one passage audio + one standalone sample, a real demo without a cost tap.
- **Status:** `RESOLVED — recommended`
- **Where it lands:** epic-25 BR (verification story), epic-29 M2 (counter + quota), business-model §3 TTS row gains the figure.
- **Residual risk:** If either surface is NOT actually cache-first today, epic-25 must flip it to `requireAuth`/guest-gated before epic-29 — the verification story is the gate.

## OI-4 — `AICallLog` retention window + fine-tune harvest sequencing (OB6 / Q4)

- **Recommendation:** Adopt an **AI-specific two-tier window** instead of mirroring T12's 24-month: **6 months full-payload** (prompt/response text) → truncate to **non-PII aggregates** (tokens, latency, `schemaValid`, fallback, cost, outcome linkage) → **24-month hard-delete of the aggregates** (mirrors T12's ceiling for consistency). **Mechanism:** monthly partition by `createdAt` + a **scheduled hard-delete job** (drop payload partitions >6 mo, drop aggregate partitions >24 mo). **Harvest sequencing (epic-35):** the AICallLog-side fine-tune harvest is designed as a **continuous extraction job** (runs from epic-35 onward, pulling rows as they age, well before the 6-month drop) — never a one-time dump racing the TTL. The OB6 spec (epic-29) must state the 6-month full-payload window so epic-35 can rely on it.
- **Rationale:** AI prompts/responses are user content — a 6-month full-payload window is defensible under GDPR minimization (M18) and still ample for fine-tune corpus and RAG-1 metrics (hit-rate/redirect-share are computed on recent windows). Truncate-then-aggregate keeps cost dashboards (OB5) with a 24-month history without keeping raw user text. Continuous harvest removes the deadline race entirely.
- **Status:** `RESOLVED — recommended`
- **Where it lands:** epic-29 OB6 (retention spec + partition job); epic-35 (continuous harvest story); `recalibrate: GDPR counsel + actual fine-tune yield`.
- **Residual risk:** If the fine-tune corpus proves thin at 6 months, the window can widen — but only with a documented consent/privacy basis; the 24-month aggregate tier is unaffected.

## OI-5 — Global guest-spend cap + cross-feature per-user budget (L5)

- **Recommendation (a):** Ship concrete defaults in **epic-29 M2**, marked `recalibrate: real costing data (post-epic-29)`:
  - **Global guest-spend circuit breaker:** **$10/day aggregate** guest vendor spend (across ALL guests). At the committed quotas this is ~300+ fully-demoing guests — a safe marketing-budget ceiling that still trips long before abuse.
  - **Cross-feature per-user daily budget:** **100k input / 50k output tokens per registered user/day** (≈$0.10–0.30/user/day at Flash-Lite), covering mnemonics + quiz-feedback + assistant E.1–E.4 + N2 in one unified budget.
- **Recommendation (b) — mechanism:** Both are Redis counters incremented at the **`AICallLog` write path** (epic-29 interceptor): `guestspend:<date>` (aggregate, dollar-estimate per call) and `aicall:<userId>:<date>` (token sums, per-surface). Trip behavior = **server-side feature flag** — guest breaker flips "guest-ai-cache-only" for the remainder of the UTC day; per-user budget-exceeded returns a 429 with "register/lift quota" copy (no paywall — free-for-now, O1). Numbers live in the flag store so recalibration needs no code deploy.
- **Rationale:** L5 policy is LOCKED but the figures were deferred "until costing data" — leaving them unshipped means the circuit breaker ships with no cap (unshipped safety). A conservative default shipped now, flag-tunable, honors L5's "bounded marketing line" and is trivially recalibrated once real costing exists.
- **Status:** `RESOLVED — recommended`
- **Where it lands:** epic-29 M2 (counters + breaker + flag store); business-model §6 notes the default figures as planning defaults.
- **Residual risk:** The $10/day and token figures are pre-costing estimates — must be reviewed at the first post-epic-29 costing pass or they silently become the permanent cap.

## OI-6 — P9/G7 funnel capture — confirm deferral + seam-alive mechanism

- **Recommendation:** **Confirm epic-39 does NOT build the funnel** (O3 LOCKED: deferred until the costing feature; epic-39 = observability only — P9 stays unbuilt). **Re-entry point:** the **costing/monetization (V10) feature** — G7 returns as its measurement leg, per O3's own tie. **Seam-alive without building the funnel:** YES — the **T18 amendment** (add `experimentId`/`variant` to `ActivityEvent` payloads, **epic-38**) + the **server-side flag store** (**epic-29**) plus **one new `account_registered` event type** (**epic-38**) are sufficient. The conversion-adjacent events (`gate_passed`, `quiz_completed`, `review_rating`, quota-exhausted register CTAs) are already in the taxonomy — so when the costing feature arrives, guest→register→engagement can be reconstructed from existing data + `experimentId` with **no schema change**.
- **Rationale:** O3 is locked and T18's "funnels deferred" stance holds at launch — building any funnel UI/computation now is out of scope. But the cost of keeping the seam alive is two cheap, in-scope additions (payload fields + one event type + the flag store epic-29 already needs for AI-rollout safety). Guest events remain consent-gated per T12.
- **Status:** `RESOLVED — recommended`
- **Where it lands:** epic-29 (flag store), epic-38 (`experimentId`/`variant` + `account_registered`); epic-39 BR explicitly lists P9 as "not built, deferred to costing feature."
- **Residual risk:** Reconstructive funnel data assumes consent-gated guest events are captured at all — if guest telemetry capture stays zero (T12), the funnel can only start measuring from registration; acceptable and documented.

## OI-7 — Q11 ASR test run — confirm parallel + de-gate record spec

- **Recommendation:** **Confirm Q11 is approved to run now as a parallel research track** (decision 6 approved the run; budget ≈$3k engineering + ≤$500 cloud and the vendor set are locked, FV4/FV6). It is **off the 25–40 critical path** (parallel). **epic-36 stays blocked until the pass record exists.** The de-gating record must be a single committed artifact (e.g., `docs/knowledge-base/data/q11-asr-validation.md`) containing **all six**: (1) **per-vendor tone accuracy** on an agreed labeled isolated-syllable + word set (NOT sentence CER) for iFlytek ISE / Azure zh-CN / FunASR SenseVoice (v1 path: Azure baseline → iFlytek specialist → FunASR fallback) — **2026 audit caveat: Azure pronunciation assessment is fine, but its tone/prosody assessment is en-US-only, so the tone leg must use a tone-capable path (iFlytek returns tone-numbered syllables); the UI must be pitch-contour-first (visual F0 overlay), not a generic pronunciation score**; (2) **F0 reliability** — client YIN/WebAudio accuracy across a device/browser/mic matrix (min: desktop Chrome/Firefox/Safari + 2 mobile browsers + 2 mic types); (3) **neutral-tone + tone-sandhi** handling (轻声, 三声变调, 一/不) with documented failure modes; (4) **whisper/low-volume degradation** quantified on the labeled set (the AISHELL6 3.95→18.93% signal); (5) a **pre-registered pedagogically-safe threshold** (tone-classification accuracy floor + F0-tone agreement bound) below which the feature serves **overall-pronunciation-only** feedback, never tone grading; (6) **per-score cost** across the shortlist confirming the $0.12-hr voice cap.
- **Rationale:** FV5 already sharpened the scope; the record's job is to make the gate **objective and pre-registered** (no post-hoc pass). The threshold (5) is the actual product gate — without it, "Q11 passed" is unfalsifiable.
- **Status:** `RESOLVED — recommended`
- **Where it lands:** parallel track (owner-side run); epic-36 BR cites the record as its de-gate; not part of 25–40 sequencing.
- **Residual risk:** The run is vendor-time-bound (iFlytek trial + Azure F0 provisioning); if the labeled-set accuracy is vendor-dependent, the v1 path order (Azure→iFlytek→FunASR) may need adjusting — that's a run outcome, not a plan decision.

## OI-8 — Milestone-promotion rule (M2 of epics 26/27/29/33)

- **Recommendation:** Adopt a **mechanical promotion rule, applied at BR time (no owner round-trip)**: auto-promote an M2 to its own epic iff **all of**: (a) it is **not** the epic's core deliverable (the epic has an M1 that defines its primary objective), **and** (b) it either **estimates > 13 SP** (≈ >2 stories / >~2 weeks solo), **or** owns a **distinct surface/integration** none of the epic's other milestones touch (new module, new page, new enforcement seam), **or** is a **hard dependency** for a downstream epic's start. Else keep it a milestone. **Pre-screen now:** **epic-29 M2 → promote** (L5 enforcement seam — demo-quota counters + circuit breaker + cross-feature budget — a distinct seam and a hard dependency for 31/36's demo quotas); **epic-27 M2 → keep** (it IS epic-27's core deliverable, per OI-9); **epic-33 M2 (G6 machine-token infra) → promote** (distinct infra seam, hard dep for E.5); **epic-26 M2 → keep** (core learning-practices calibration).
- **Rationale:** The rule needs a decision heuristic, not case-by-case escalation — 13 SP captures the "won't fit the parent's review cadence" boundary, the surface clause captures cross-cutting seams, and the dependency clause protects sequencing (29-M2's enforcement blocks 31/36). Applying it at BR time keeps the owner out of the loop while staying deterministic.
- **Status:** `RESOLVED — recommended`
- **Where it lands:** planning doc "Milestone Promotion Rule" section; epic-29 and epic-33 BRs reflect the promoted M2s.
- **Residual risk:** The 13-SP bar is a sizing judgment — if a BR estimates far off, the rule is reapplied mechanically at that BR; no drift beyond one BR.

## OI-9 — 27-M2 rebase scope + migration order

- **Recommendation:** **Pin the full HSK 2025-rebase inside epic-27's BR scope** as **27-M2**, with this concrete scope: (1) **3,088 char settlement** (FV1 — derived from the CLEC Nov-2025 syllabus PDF; 3,109 branch stays dropped; rebuild `content/characters` with per-level labels; retire or re-label the 2,971 derived-unique set); (2) **10,943 word reconciliation** to the finalized L1–6 cumulative **300/500/1,000/2,000/3,600/5,400** (FV2; manifest 11,092 vs seeded 10,943 discrepancy resolved; the 149 duplicate `wordId`s preserved as valid multi-level tags via the `WordHskLevel` junction fix `@@id([wordId, hskLevel])`, R10); (3) **band-end mis-sum fix** (`hsk-word-counts.js` `getCumulativeWordCount` double-sums band-end totals → 17,034; fix to true values, no double-sum); (4) **L1–6 labels** to finalized counts + **"2025-syllabus aligned"** marketing framing (FV3). **Migration order (concrete):** **data files → seed → code/flag → UI labels → reader ratio.** Step 5 (reader known-word-ratio re-point) also stays in **27** (data-consumer re-point, must not regress P0s/guards). **epic-37** builds the **N3 HSK exam-prep feature** (mock + score prediction + LLM summary, split by exam parts per P9) **on top of** the rebased data — it consumes, never re-does, the rebase.
- **Rationale:** override-2 already put the rebase in epic-27's data-calibration lane; 27-M2 keeps the data-integrity work coherent under one epic (with the §19 invariant: no gate reads a projection whose writer hasn't shipped — reader ratio re-points only after data is live). The order is dependency-safe: content → DB → code consumers → user-facing labels → derived ratio consumers.
- **Status:** `RESOLVED — recommended`
- **Where it lands:** epic-27 BR (M2 scope + order); epic-37 BR (consumer-only scope); `recalibrate: none` (figures already LOCKED by FV1/FV2).
- **Residual risk:** The CLEC PDF is image-only (documented) — the 3,088 set must be transcribed/verified during the rebase; keep a labeled "unresolved char" list for the 3,088-vs-3,109 edge rather than silently dropping characters.

## OI-10 — Health-probe change (Gemini off `/live`)

- **Recommendation:** **Confirm the split — YES, in epic-39 (OB3/P3):** `/live` = process-alive only (no deps, no Gemini, no TTS); `/ready` = deps (Redis ping + Prisma/DB + TTS cache path); **Gemini moves to a low-frequency, non-polled check** (interval job or on-demand `/ready`-adjacent AI-provider check that the platform never probes). This resolves Q5 — it is the right call and the accepted behavior change to the existing live `/api/v1/health` surface. **Config impact:** point Railway's `healthcheckPath` (currently `/api/v1/health`) to the **liveness** endpoint; keep `/api/v1/health` as a **legacy alias** (302 → liveness or return liveness) so existing dashboards/monitors don't break. **Vercel is unaffected** (static SPA — no backend probes).
- **Rationale:** The current `/api/v1/health` makes a **real billed Gemini call per probe** — every platform poll is a cost and a false "down" signal when Gemini degrades (per OTel probe guidance: liveness = no deps). Splitting liveness/readiness decouples "is the process up" from "are dependencies healthy" and stops billing on probes.
- **Status:** `RESOLVED — recommended`
- **Where it lands:** epic-39 OB3 (health split); `railway.toml` `healthcheckPath` update; `HealthController` refactor; `recalibrate: none`.
- **Residual risk:** Any external monitor that polls `/api/v1/health` for dependency health must be re-pointed to `/ready`; the legacy alias covers in-repo callers but not third-party uptime checks.

---

---

Back to the index: [Epic Plan 25-40](./epics-25-40.md)
