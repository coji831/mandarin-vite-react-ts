---
purpose: 2026 trend/standard fact-check × LLM/RAG-readiness audit of the feature inventory (Axes 1–2)
status: active
last-verified: 2026-08-17
type: business
---

# PinyinPal Feature Validation 2026 — 2026 Trend/Standard Fact-Check × LLM/RAG Readiness

> ⚠️ This document is the official, ratified record of the 2026 trend/standard fact-check × LLM/RAG-readiness audit (Axes 1–2) — Class 2 research source data for the [RATIFIED business model](../business-model.md). See [Business Index](../README.md).

**Purpose**: 2026 trend/standard fact-check + LLM/RAG-readiness audit of the 71-feature inventory — the Architect's three-axis validation, **Axes 1–2**. Axis 1 re-verifies every load-bearing external claim in the calibration against primary 2026 sources; Axis 2 assesses the §19 progress/gating/tracking design (T1–T20) as the LLM/RAG/adaptive substrate.

**Source of truth**:

- [System Feature Inventory — Registered-User Full-Access View](feature-inventory.md) — the 71-feature inventory (LIVE-NOW 28 / FIX 20 / BUILD 21 / GATED 2 + ~12 removed)

**Last Updated:** August 17, 2026 — promoted to `docs/business/research/` (2026-08-15, verbatim); §23 final validation applied (RAG-1 → LOCKED FV14; AS12/S15-amended → feature-approved; open-Q closures); count breakdown aligned to the ratified inventory (LIVE-NOW 28 / FIX 20, 2026-08-09 validation fold)

**Status**: design/review — all proposals; no code changed. The new decision IDs in **Proposed new decision IDs** (OB1–OB6, T19, T20, T18-amendment) are **PROPOSALS for owner confirmation**, not ratified decisions. Existing decision series (P/D/R/S/AS/SU/V/T/Q) are untouched and not renumbered. Per §23 Final Validation (2026-08-14), **RAG-1 → LOCKED (FV14)** and **AS12 (C15) / S15-amended (C17) → feature-approved** (see the §23 note below); the OB/T proposals remain PROPOSALS.

---

## Context Summary — What Was Reviewed

**Documents (read in full):**

- [System Feature Inventory](feature-inventory.md) — 71-feature inventory (LIVE-NOW 28 / FIX 20 / BUILD 21 / GATED 2 + ~12 removed).
- The full calibration decision spec — §3 tracking design (T1–T18), §4 AI roadmap (E.0–E.5, N1–N3, AS/SU), §5 epics 25–38, §6 sign-offs/overrides, §7 decision log + do-not-trust list.

**Code verified directly (2026-08-09):**

- Backend: `shared/utils/logger.ts` (console-based, `[prefix]` strings — **not** structured, **no** log levels), `shared/middleware/errorHandler.ts` (requestId + `{code,message,requestId}` — good baseline), `app/index.ts` (CORS/parsers/requestId/routes/swagger/errorHandler last; graceful shutdown; uncaught handlers), `modules/health/api/HealthController.ts` (checks Gemini via a **real billed** `generateText("Hello")` call + TTS + Redis ping; **no liveness/readiness split**), `shared/infrastructure/external/GeminiClient.ts` (**does not parse `usageMetadata`** → no token counts today), `cacheMiddleware.ts` (in-memory hit/miss metrics, **not exported**), `railway.toml` (`healthcheckPath = /api/v1/health`).
- Frontend: `shared/api/errors.ts` + `axiosClient.ts` (`NormalizedError`/`isAuthFailure`/retry+refresh — solid), shared `ErrorScreen` (fetch-level UI only). **No ErrorBoundary, no analytics, no telemetry, no feature flags** (verified by grep: zero matches).
- `packages/` and both `package.json`: **zero** monitoring/observability libs (no Sentry/OTel/winston/pino/prom-client/posthog).
- `terraform/`: Neon/Upstash/Vercel/GCP only. The TTS cost-alert comment in `main.tf:104-108` documents intent but was **never implemented** (GCP budgets manual).
- `prisma/schema.prisma`: `ReviewItem` = interval-doubling, **no `lapses` field**; `CharacterProgress`/`ReviewLog` zero-write; **none** of `ActivityEvent`/`SrsCardState`/`CharacterMastery`/`UserSrsParams`/`LearnerPrefs`/`AICallLog` exist yet. No SSE seam; no `modules/assistant` or `modules/recommendations`.

**Primary 2026 sources fetched:** Wikipedia _Zhongwen Shuiping Kaoshi_ (edited 2026-08-08); open-spaced-repetition `srs-benchmark` + `ts-fsrs` (active ~Jun 2026); Wikipedia _Duolingo_ (edited 2026-08-03); Duolingo Max blog; OpenTelemetry GenAI semconv (moved to dedicated `semantic-conventions-genai` repo).

---

# AXIS 1 — 2026 Trend/Standard Fact-Check

**Headline: the post-calibration feature set holds up against the 2026 landscape.** Every load-bearing external claim in the calibration was re-verified against primary 2026 sources; the only drift is a timing nuance on HSK rollout. No deprecated format survives in the final list.

| Feature area (ref)                     | 2026 fit                 | Note (evidence, dated)                                                                                                                                                                                                                                                                                                                                                                                                                                                | Action                                 | Epic home |
| -------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | --------- |
| **Learn / Reference lanes** (A1–A13)   | **MATCH**                | Learn-vs-Practice split is the universal 2026 IA (Duolingo Learn vs Practice Hub; Skritter; HelloChinese gates "Train"). Data-driven + phase-gated = correct. Minor: Unicode 17.0 (Sep 2025) adds chars — content-freshness check only.                                                                                                                                                                                                                               | keep                                   | —         |
| **Quiz formats** (B1–B10, P1)          | **MATCH**                | 10 formats incl. typed cloze/sentence-building/dictation/comprehension match 2026 active-production trend; Q8 ≥1 typed answer (P2) aligns with the industry shift away from all-MC.                                                                                                                                                                                                                                                                                   | keep (P1 set)                          | 26/28     |
| **Review / SRS** (B11–B16, T3/T11/T14) | **MATCH**                | FSRS-6 via pinned `ts-fsrs` v5.4.1 is the 2026 mainstream SRS (Anki default; MIT; ~133k weekly dl). **FSRS-7 confirmed real** (srs-benchmark, 2026: newest, 8 optimizable params, fractional intervals, only version modeling same-day recall) — but fractional intervals are not product-required for v1; T11 pin + reserved fork is the right 2026 call. **Not relitigated** per instruction. The live interval-doubling `ReviewItem` is the thing to replace (T3). | keep; fix live code                    | 28/34     |
| **Conversation** (B18/E.2)             | **MATCH**                | 2026 = conversation is the flagship AI surface: Duolingo Max Video Call for Chinese (Wikipedia Aug 2026), beginner Video Call w/ Falstaff (Duolingo blog 2026-01-14). Text-SSE, auth-only, hidden for guests (P10/P16) matches "conversation is monetized/AI-gated".                                                                                                                                                                                                  | keep                                   | 31        |
| **ASR speaking** (B19/N1)              | **MATCH→AHEAD** (gated)  | Tone-feedback ASR is the 2026 differentiator (Speak/Loora/Praktika). Confirmed market gap: **no vendor publishes an explicit tone-error-rate** (V-series) — PinyinPal can own it if Q11 passes. Hybrid F0+ASR is the right architecture (AISHELL6 whispered-studio caveat kept).                                                                                                                                                                                      | keep; Q11 budget/vendor is the blocker | 36        |
| **HSK prep** (F2/N3, override-2/P9)    | **MATCH** (after rebase) | **Nov-2025 finalized syllabus confirmed** (Wikipedia, 2026-08-08): released 2025-11-15, effect 2025-11-18, global trial 2026-01-31, speaking mandatory from L3, L1–6 = 300/500/1000/2000/3600/5400. N3 split-by-exam-parts (P9) matches the real HSK format. **Timing nuance:** full rollout "yet to be implemented" as of Jul 2026 — the rebase is correct, but marketing "HSK 3.0" before full rollout is a small risk; frame as "2025-syllabus aligned".           | keep + prioritize rebase               | 27/37     |
| **Assistant / suggestions** (C8–C13)   | **MATCH**                | S1 Explain = Duolingo "Explain My Answer," **free for all users as of 2026** (Wikipedia Aug 2026) → validates free-for-registered-users (P15). Deterministic-retrieval-first, embeddings gated (S14) matches 2026 retrieval guidance. Rule/score suggestions without an ML bandit (SU10) is correct at this scale (Duolingo's bandit needs ~100M users).                                                                                                              | keep                                   | 30/32/33  |
| **Tracking / progress** (D, §19)       | **MATCH**                | Event-log + write-through projections + read-time aggregates + Redis short-TTL is 2026-validated (Fowler; Postgres 17 JSONB; Upstash managed). See Axis 2 for the field-level gaps.                                                                                                                                                                                                                                                                                   | keep (T-series)                        | 28/38     |
| **Pinyin data** (F3/D14)               | **MATCH**                | 21 initials + 38–39 finals is the standard; target 59 phonemes correct. `PinyinPhoneme` 18+32 is a real gap, not a subset.                                                                                                                                                                                                                                                                                                                                            | fix                                    | 27        |
| **HSK data model** (F1/F7/R10)         | **MATCH**                | 6-band "full HSK 1–6" for N3 is fine; 9-level/3-stage structure noted but deferred (correct — don't claim 9-level totals). `WordHskLevel @@id([wordId,hskLevel])` junction fix (R10) is right.                                                                                                                                                                                                                                                                        | fix                                    | 27        |

**Do-not-trust discipline honored:** no WaniKani formula, no Kim & Webb 0.74, no vendor tone-error-rate, no `py-fsrs`, no Item-17 ">35%/2.5×" cited. FSRS-6 pin not relitigated.

---

# AXIS 2 — Progress/Gating/Tracking Sufficiency as the LLM/RAG Substrate

## Verdict: SOUND substrate, no architectural rework — but ~5 field/sequencing gaps

The §19 design (T1–T18) is the **right shape** for an LLM/RAG/adaptive system: an append-only typed event log feeding write-through projections + read-time aggregates, with Redis short-TTL caching. Nothing here needs to change structurally. The gaps below are **data-field and sequencing decisions, not design changes.**

## What is SUFFICIENT (with citations)

| Need                       | Sufficient via                                                                                                                                                       | Notes                                                                                                       |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| FSRS fitting (T2.2)        | `review_rating` events (T2/T6) + `UserSrsParams` (T7/T13) + pinned `ts-fsrs` (T11) + `@open-spaced-repetition/binding` (Rust optimizer — repo confirmed active 2026) | Sufficient **once** the lapse signal is defined (gap 1) and event completeness holds (same-tx, T1).         |
| Leech modeling (T2.4)      | `review_rating` lapse windows from ActivityEvent                                                                                                                     | Depends on gap 1.                                                                                           |
| Adaptive difficulty (T2.3) | `QuizAttempt`/`QuizAttemptAnswer` (T10) + `SrsCardState` + ActivityEvent                                                                                             | Missing `responseMs` (gap 2) — HLR/DASH/FSRS-7 all use answer-time.                                         |
| Suggestions scoring (E.3)  | SU1: ReviewItem ⊕ QuizAttemptAnswer; SU2 rule; SU3 rule/score + Redis                                                                                                | v0 signal sources must be pinned against **pre-epic-38 live tables** (gap 4).                               |
| Guardian content (E.4)     | PhaseScope (AS4) + vocab-whitelist ⊆ unlocked + content_id existence                                                                                                 | Correct, **provided P0-2 resolves first** (guard 4) and retrieval reads the same unlock source as UI gates. |
| Conversation context (E.2) | Redis short-TTL memory (AS7) + P6 taxonomy events (epic-38)                                                                                                          | Sufficient for serving; eval capture missing (gap 5).                                                       |
| N2 personalization         | `LearnerPrefs` (T7) + ActivityEvent                                                                                                                                  | Sufficient.                                                                                                 |
| Evals (T2.5)               | S15 minimal eval with E.0/E.4                                                                                                                                        | Capture harness must be explicit (gap 5).                                                                   |

## What is MISSING — concrete gap list

| #   | Gap                                                                                                                                                                                                                                                                                       | Why it matters                                                                                                                                 | Where it lands                                                                                                                                                                                            |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1  | **No `lapses` field** on live `ReviewItem` (verified in `schema.prisma:325`) and **no lapse derivation before `ActivityEvent`/`SrsCardState` ship.** SU2's "≥3 lapses/30d" has no defined source for the **v0 weak-item** (E.3, epic-32 — which does **not** depend on epic-28/34 or 38). | The v0 suggestions surface is the first LLM-adjacent surface; it must not guess at lapses.                                                     | **T19 (new)**: `SrsCardState` carries `lapses` (ts-fsrs `Card.lapses`); pre-FSRS v0 derives lapses from `QuizAttemptAnswer` failed answers + `review_rating(source)` — pick one, pin it in epic-26 scope. |
| G2  | **No answer-time (`responseMs`) in review/quiz events.**                                                                                                                                                                                                                                  | FSRS-7's same-day + AT features, HLR/DASH, and T2.3 adaptive difficulty all consume response-time. Cheap to add now, costly to backfill later. | Add `responseMs` to `review_rating`/`quiz_completed` event payloads (epic-38).                                                                                                                            |
| G3  | **"Studied item" is undefined** for AS4 coaching-scope ("coaching only on studied items").                                                                                                                                                                                                | Phase-scoping by `currentPhase` is coarse; "studied" must be a single definable predicate or the assistant leaks scope.                        | **T-series/AS amendment**: studied := `SrsCardState.state != New` OR a successful quiz attempt (source in ActivityEvent/QuizAttempt). Pin before epic-30.                                                 |
| G4  | **E.3 v0 signal sources not pinned against pre-epic-38 tables.** §4.3 cites `WordLookupEvent` (being folded into ActivityEvent, epic-38) but E.3 (epic-32) precedes 38.                                                                                                                   | Recommender must read only tables that exist at ship time.                                                                                     | epic-26/32: define E.3 v0 inputs as `ReviewItem` + `QuizAttemptAnswer` + live `Bookmark`/`ReadingSession`.                                                                                                |
| G5  | **No eval capture harness** (conversation samples; AI-call → user-outcome linkage).                                                                                                                                                                                                       | T2.5 needs golden datasets + outcome labels; without an explicit capture story it never happens.                                               | **T20 (new)**: conversation sample capture (epic-38) + `AICallLog` outcome linkage (epic-29) + golden-dataset story (epic-35).                                                                            |
| G6  | **No machine-token infra.** Auth is user-JWT only; E.5's "REST + machine token" (V8) needs a service-token store + scoping + rate limits.                                                                                                                                                 | The agent contract is the future integration surface; tokens are a prerequisite, not a story detail.                                           | epic-33 (E.5) — add a token story.                                                                                                                                                                        |
| G7  | **AICallLog has no retention/PII policy.** T12 covers `ActivityEvent` only; AI-side prompts/responses may contain user content.                                                                                                                                                           | GDPR/consent exposure; T2.6 fine-tuning harvest (epic-35) depends on it.                                                                       | **OB6** (epic-29): AICallLog retention + no-PII + own consent note.                                                                                                                                       |
| G8  | **Embedding store** — absent **by design** (S14 RAG gate).                                                                                                                                                                                                                                | Correct posture for 2026 (deterministic retrieval first); only add `ContentEmbedding` if the post-E.1 threshold is breached.                   | Not a gap — RAG gate decision retained.                                                                                                                                                                   |
| G9  | **No A/B / experiment-id capture** for SU6 nudges + feature flags.                                                                                                                                                                                                                        | SU6 says "rule + A/B"; E.0 adds per-user AI feature flags — but no experiment/variant telemetry exists.                                        | Amend T18: add `experimentId`/`variant` to event payloads (epic-38) + flag store (epic-29).                                                                                                               |
| G10 | **Weak-items read-path cost** for `/v1/recommendations/weak`.                                                                                                                                                                                                                             | Read-time scoring over lapses/accuracy across all items can get hot.                                                                           | Redis-cached or incrementally-scored weak-item index in epic-32.                                                                                                                                          |

## Gating model — sufficient with one decision

- **(a) LLM phase-scoping (AS4):** sufficient **once G3 (studied-definition) is decided** and P0-2/P0-1 land (guard 1/4). Retrieval filter + prompt constraint + decline+redirect is the right 2026 pattern.
- **(b) RAG-gate content leak:** sufficient **if** the retrieval scope reads the same single unlock source (`LEARN_REQUIRED_PHASE` + `LearnerState`) as the UI gates, under the §19 invariant (gate reads only shipped projections — extend the same discipline to retrieval). No new design needed.
- **(c) Agent contract (E.5):** `GET /v1/review/due`, `/v1/progress`, `/v1/recommendations/weak` are the right stable surfaces (SU8/V8) **if** G6 (machine token) and G10 (weak-item read path) land first.

## LLM/RAG-Readiness Scorecard

| Dimension                       | Verdict                                                        | Why                                                                                              |
| ------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Signal completeness             | 🟡 **PARTIAL**                                                 | G1 (lapses), G2 (responseMs), G3 (studied) must be decided; everything else is designed.         |
| Phase-scoping                   | 🟢 **SUFFICIENT**                                              | AS4 + Guardian whitelist; needs G3 predicate.                                                    |
| Agent contract                  | 🟡 **PARTIAL**                                                 | Right surfaces; G6 token + G10 caching missing.                                                  |
| Consent / retention             | 🟢 **SUFFICIENT (ActivityEvent)** · 🟡 **PARTIAL (AICallLog)** | T12 covers the event log; G7 covers AI-side.                                                     |
| Latency of read-time aggregates | 🟡 **PARTIAL**                                                 | Redis covers due/progress; G10 for weak-items; `pg_ivm` deferral (T18) acceptable at this scale. |
| Eval readiness                  | 🟡 **PARTIAL**                                                 | S15 minimal rides E.0/E.4; G5 capture harness must be made explicit.                             |

---

# Proposed New Decision IDs (for owner confirmation — PROPOSALS, not ratified)

**Status updates by §23 Final Validation (2026-08-14):** **RAG-1 (C16) → LOCKED** (FV14: trigger = E.2 golden set top-1 hit-rate < **85%** OR **≥30%** low-confidence/redirect turns; decision point before epic-31; pgvector (Neon) reservation = default if fires) · **AS12 (C15) → feature-approved** (unchanged) · **S15-amended (C17) → feature-approved** (unchanged). The OB1–OB6 / T19 / T20 / T18-amendment proposals below remain **PROPOSALS**.

**OB1–OB5** (new **observability** series, home **epic-39**):

- **OB1** — structured logging + levels + traceId
- **OB2** — access-log middleware
- **OB3** — health liveness/readiness split
- **OB4** — frontend ErrorBoundary + consent-gated error capture
- **OB5** — metrics endpoint + alerting incl. AI-cost thresholds

**OB6** (home **epic-29**) — AICallLog = OTel GenAI-semconv-aligned shape + own retention/no-PII policy + `GeminiClient` `usageMetadata` parsing + AI-call→user-outcome linkage.

**T19** (home **epic-26/28**) — `lapses` counter lands with `SrsCardState` (ts-fsrs `Card.lapses`); v0 weak-item lapse signal derived from `QuizAttemptAnswer` before SrsCardState/ActivityEvent ship.

**T20** (home **epic-38/35**) — conversation eval capture for T2.5.

**T18 amendment** (home **epic-38/29**) — `experimentId`/`variant` in event payloads + server-side flag store for SU6 A/B nudges.

No other new IDs needed; existing series (P/D/R/S/AS/SU/V/T/Q) untouched and not renumbered.

See **§23 — Final Validation & Business Decisions (2026-08-14)** for the full FV1–FV24 batch (additive; FV-series, no renumbering) — folded into this doc and [Business Model](../business-model.md) Appendix C.

---

# Open Questions for the Owner

**Closed / addressed by §23 (2026-08-14):**

- **Q6 (HSK timing)** → **closed by §23 (FV3/FV1):** lead with **"2025-syllabus aligned"** (HSK 3.0 rollout Jul 2026; L1–6 still HSK 2.0 through mid-2026); char total settled at **3,088** (FV1; 3,109 branch dropped).
- **Q2 (product analytics / funnel capture)** → **addressed by §23 (FV13, PROPOSED):** minimal **consent-gated guest→register→paid** funnel capture (G7) approved as a proposal (M18-compliant); owner decision still pending.
- **Q11 budget/vendor (B19/N1 de-gate)** → **closed by §23 (FV4/FV6/FV21):** vendor shortlist = iFlytek ISE / Azure zh-CN / FunASR SenseVoice; budget ≈$3k engineering + ≤$500 cloud.
- **RAG-1 threshold** → **locked by §23 (FV14):** E.2 golden set top-1 <85% OR ≥30% low-confidence/redirect turns; decision point before epic-31.

**Unchanged open (still owner decisions):** Q1 (epic-39 approval), Q3 (studied-item definition G3), Q4 (AICallLog retention window), Q5 (liveness probe cost).

1. **epic-39 approval** — new "observability-production-hardening" epic (recommended) vs fold into 29/38? Affects sequencing of the Tier-1 cost work.
2. **Product analytics before launch?** — the T18 stance defers funnels, but the guest→register conversion (override-1) is unmeasured. Do we add a minimal consent-gated funnel capture now (OB-ish, P9), or keep strict T18 and measure activation manually/qualitatively first? — **addressed by §23 (FV13, PROPOSED — owner decision pending):** minimal consent-gated guest→register→paid funnel capture (G7) approved as a proposal (M18-compliant).
3. **"Studied item" definition (G3)** — needed before epic-30 (S1 coaching scope) locks: studied := SrsCardState state ≠ New, OR successful quiz attempt, OR something else?
4. **AICallLog retention window** — mirror ActivityEvent's 24mo hard-delete (T12), or a different window for AI prompts/responses (cost/eval vs privacy tradeoff)? Feeds OB6 + epic-35 fine-tuning harvest.
5. **Liveness probe cost** — confirm changing `/api/v1/health` to not bill Gemini per probe (move Gemini check to a readiness endpoint or interval-based) is acceptable — it's a small behavior change to an existing live surface.
6. **HSK timing** — N3 marketing framing given the Jul-2026 "rollout in progress" status: lead with "2025-syllabus aligned" vs "HSK 3.0" (also ties to the 3,088 vs 3,109 settlement). — **closed by §23 (FV3/FV1):** lead with **"2025-syllabus aligned"**; char total settled at **3,088** (3,109 branch dropped).

---

**Bottom line:** the 71-feature inventory is **2026-fit** (no deprecated formats; HSK-2025 rebase and FSRS-6 pin both re-verified against primary sources). The §19 tracking design is a **sound, correct-shape AI substrate** — the five gaps (lapses, answer-time, studied-definition, eval capture, machine-token) are field/sequencing decisions, not architecture. Production observability is the **one genuinely under-built axis**.

_Persisted 2026-08-09 from the Architect's three-axis validation report (Axes 1–2)._
