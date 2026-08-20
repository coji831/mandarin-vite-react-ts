---
purpose: Locked business model — demo-guest + data-driven learning road
status: ratified
last-verified: 2026-08-17
type: business
---

# PinyinPal Business Model — Demo-Guest + Data-Driven Learning Road

**Status:** RATIFIED — owner-approved 2026-08-14
**Last Updated:** August 17, 2026
**Change policy:** RATIFIED rules change only on owner approval → new BM-<n> decision → Change Log row → Last Updated bump, all in one commit. OPEN (planning-reference) items editable with a Last Updated bump only.

## Change Log

| Date       | Change                                                            | Decision ID | Approval           |
| ---------- | ----------------------------------------------------------------- | ----------- | ------------------ |
| 2026-08-15 | Initial ratified version — demo-guest + data-driven learning road | BM-1        | Owner (2026-08-14) |

---

## 1. Purpose & Scope

This document is the **RATIFIED business model** for PinyinPal, owner-approved **2026-08-14** — the official, ratified source of truth. It was originally developed as a gitignored working spec (in `wip/`) that is NOT official documentation and may be deleted; do not treat it as authoritative or reference it. It is **fully self-contained**: every ratified rule below stands alone.

**In scope:** product positioning, tiers & access, pricing, funnel & conversion, cost model, unit economics, risk posture, the locked business rules (L1–L8, P11-AMEND), the retirements/re-framings, and the ratified-vs-open-vs-deferred register.

**Out of scope:** implementation and planning items (epic re-scoping, soft-readiness mechanics, `LearnerProfile` / "Next for you" build, P0-2 re-basing detail, T-series extensions) — these are **explicitly NOT business** and are deferred to later epic planning (see [Appendix B](#10-appendix-b--ratified-vs-open-vs-deferred)).

**Document classes in this area:**

- **Class 1 — this document.** Locked business model. Changes only via the BM-<n> gate (see Change policy).
- **Class 2 — supporting research** (freely editable, `Last Updated` + git only): [Research Findings 2026](research/research-findings-2026.md) (M1–M19) · [Feature Validation 2026](research/feature-validation-2026.md) (Axes 1–2) · [Feature Inventory](research/feature-inventory.md) (84-feature inventory).
- **Class 3 — knowledge-base notes** (future).

---

## 2. Product Positioning

**Owned HSK-aligned depth** (grammar/tone/characters — 2025 finalized-syllabus rebase) that casual-first Duolingo Chinese doesn't cover, with **conversation + ASR tone feedback as the premium AI surface** — exactly where the market puts the paywall (Duolingo Max, Speak, Praktika). **The demo of those premium surfaces IS the acquisition story**: guests can _feel_ tone-graded ASR, run a conversation session, and use AI generation before registering — converting at the premium surfaces.

- **Wedge:** "bridge casual + serious HSK," Mandarin-specific, 2025-syllabus aligned.
- **Framing:** a **deliberate departure toward the Speak/Praktika free-trial pattern** — a _bounded demo_, not "durable free full access" (V3 not violated).

---

## 3. Tiers & Access — RATIFIED matrix

The ratified access model (finalized §2.1-style; replaces the earlier Phase-1-lock + P11-locked cells):

| Capability                                                         | Guest — **demo quota** (session-local)             | Registered user                                | Future Pro (reference only, O1) |
| ------------------------------------------------------------------ | -------------------------------------------------- | ---------------------------------------------- | ------------------------------- |
| Learn — all content (foundations → chengyu, all 4 stages)          | ✅ browse/demo (no lock)                           | ✅ all                                         | ✅                              |
| Practices — all 10 quiz formats                                    | ✅ demo, session-local (bounded)                   | ✅ persisted attempts                          | ✅ advanced formats             |
| Review (SRS)                                                       | ✅ session-local, all item types (bounded)         | ✅ full persisted queue                        | ✅                              |
| AI generation (mnemonics · quiz-feedback · passage · Made-for-You) | 🔀 **demo quota** (5 / 3 / 1 / 1 per day)          | ✅ free-for-now (per-user daily caps, AS6/P14) | unlimited                       |
| ASR speaking (N1: A1 shadowing + A2 read-aloud)                    | 🔀 **demo quota** (3 + 3 tries/day)                | ✅ free scoring                                | unlimited                       |
| Conversation (E.2, text SSE)                                       | 🔀 **demo quota** (1 session ≤ 5 turns/day)        | ✅ free                                        | unlimited                       |
| TTS                                                                | ✅ cache-first free reads; generated audio quota'd | ✅                                             | ✅                              |
| **Persistence** (progress / SRS / streaks / HSK scores)            | ❌ session-local → **the registration incentive**  | ✅                                             | ✅                              |
| HSK exam-prep (N3)                                                 | ✅ free (deterministic content — no vendor cost)   | ✅ persisted scores                            | ✅                              |

Only remaining 🔒 is **persistence** — now the _primary_ register incentive alongside quota-lifting (replaces the old "Phase-2–4 locked" lever).

---

## 4. Pricing

**Free-for-now launch** (O1). **$9.99/mo / $79.99/yr + Pro tier = reference only, not ratified** (annual-leaning; ~$6.67/mo effective ≈ Praktika; undercuts the $84–168/yr AI-voice specialists; above the $44.99 education median, justified by the AI/voice differentiator). **No paywall at launch.**

**Pricing stays OPEN** until the future costing/monetization (V10) feature — unchanged from O1/O2.

---

## 5. Funnel & Conversion

**Primary funnel is now guest → register** via **"register to continue / lift the demo quota"** at value moments: post-ASR, post-conversation, post-quota-exhausted, post-rating (replaces the old "register to save progress" at locked-content — same client-side-trigger discipline).

- **Unmeasurable at launch** — G7 funnel capture deferred (O3); **accepted risk**.
- **V11 two-stage model stays a planning reference:** guest→register (freemium **2.1–4.5%** band — now with a stronger demo-driven pull) and register→Pro (hard-paywall **~10.7%** D35 — future).
- **Trial design** (21-day / annual-leaning / Day-0 value cliff) stays future reference (O2).

---

## 6. Cost Model — demo quota as a bounded marketing line

Worst-case guest spend/day at the ratified quotas = **penny-scale**; cost-per-guest-demo is now a **controllable line**, not a zero-cost assumption.

**Ratified quota numbers:** ASR **3+3** tries/day · AI generation **5/3/1/1** per day · Conversation **1 session ≤ 5 turns/day** · TTS **quota'd** (generated audio).

**Enforcement:** server-side per-guest counters (**deviceUserId + IP + browser fingerprint**, Redis short-TTL via Upstash, rolled per-day) + the **`AICallLog`** write path + a **global guest-spend circuit breaker** (epic-29 scope — noted, not planned). Per-IP caps as secondary ring; existing per-route rate limits stay. **Client-side quota is UX only — the server counter is the enforcement.**

**Registered users:** free-for-now (O1) with per-user daily caps (AS6/P14 5/day precedent) + a **unified cross-feature per-user budget via `AICallLog`** (LOCKED policy).

**Vendor economics:**

- **Gemini 3.x pinned** (2.5 family retires **Oct 16 2026** — FV20); batch **−50%**; caching **10%**.
- **ASR:** Azure **F0 free tier first**; iFlytek free trial then **$150/100k → $1,300/1M** (FV21); **FunASR self-host** cost floor (FV22).
- **Voice** at the **$0.12-hr planning cap** (FV12).

---

## 7. Unit Economics (planning references — unvalidated)

- **Conversion thesis shifts:** demo→register is the primary funnel; **cost-per-guest-demo is the new unit to watch**.
- **4.5% blended / $3.60 Rev-per-MAU-per-yr** stay **LOCKED planning references, unvalidated** (funnel unmeasured until O3 — accepted).
- **LTV unchanged planning (V11):** churn **8%/mo** → ~37% Y1 (sensitivity **10–12%** → 22–28% Y1; benchmark ~27–28%).
- **Voice cost** at the $0.12-hr cap (≈7× Azure raw STT headroom).

> These figures are flagged **unvalidated** — they feed planning, not ratification, until real funnel/costing data exists (see [Appendix B](#10-appendix-b--ratified-vs-open-vs-deferred)).

---

## 8. Risk Posture

- **Demo-spend abuse** bounded by quota + circuit breaker (L5).
- **Beginner overwhelm** mitigated by cold-start "Next for you" defaulting to the roadmap sequence (L6/L3).
- **P0-1 severity increases** (guests touch more surfaces — repo-level `undefined`-userId rejection is more urgent).
- **P0-2 re-based** to a data prerequisite for the learning road (not a progression blocker).

---

## 9. Appendix A — Business Rules LOCKED

### A.1 The L-series — LOCKED (owner-approved 2026-08-14)

| ID     | Decision                                                                                                                                    | Status     | Amends                                              | Business consequence                                                                                                                  |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **L1** | Access = guest **demo quota of ALL features** (bounded, session-local); persistence is the primary register incentive                       | **LOCKED** | D1, D4, override-1, O4/FV23                         | Guests can try any surface; the demo of premium features becomes the acquisition story; the fuzzy Phase-2 free-set question dissolves |
| **L2** | Progression = **soft readiness**; `PhaseGate` lock removed for registered users; `LearnerState` keeps data; gates → recommendations         | **LOCKED** | D8, D9 (lock semantics), D1/D4/D7 (registered side) | No hard walls; gate-threshold machinery becomes readiness heuristics; P3→4 no longer structurally unsatisfiable                       |
| **L3** | **"Next for you" sequencing engine** (learn-lane) with roadmap-theory priority scoring; rule/score-first                                    | **LOCKED** | NEW — epic-40                                       | Replaces the phase gate as the de-facto sequencing; beginner scaffold preserved as recommendation, not wall                           |
| **L4** | **`LearnerProfile` projection** (known-set/coverage/weakness/readiness) powers coach + sequencing                                           | **LOCKED** | Extends T6/`LearnerState`                           | AI coaching (AS4/C15) scopes by studied-set + readiness, not phase; feeds the data-driven learning loop                               |
| **L5** | **Cost-bearing demo quota** enforced via `AICallLog` + server-side counters + global guest circuit-breaker; = bounded marketing-budget line | **LOCKED** | **P11**, S11, AS4/AS5, P8/P10/P16/P18               | The one hard reversal: guests now incur _bounded_ vendor cost; spend is controllable (pennies/day)                                    |
| **L6** | Roadmap theory = **priority scoring layer, not a lock**; phase metadata retained for sequencing                                             | **LOCKED** | D6 (metadata registry)                              | 4-phase pedagogy survives as signals, not walls; `PHASE_CONFIGS` still fixed as metadata                                              |
| **L7** | N3/HSK-prep structured on **HSK levels**, independent of the learning road                                                                  | **LOCKED** | V9 (confirmed), FV3                                 | No phase dependency to break; N3 sells on HSK levels (300/500/…/5400)                                                                 |
| **L8** | P1 90/10 retained as **"foundations ready" readiness signal** (re-frames D8); skip/qualification quizzes dropped                            | **LOCKED** | D8 (re-framed)                                      | P1 flag kept as the onboarding/readiness hook; R4 register trigger keys off the readiness pass signal                                 |

### A.2 P11 amendment — explicit record

| Decision                                                                                                                                                                                                                                                                                                                          | Status                                          | Amends                                                                                                                                                                |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P11-AMEND** — guests **may incur BOUNDED vendor cost** under the demo quota: **"never" → "bounded demo quota"**. The demo quota is a deliberate, budgeted marketing expense (penny-scale/day), not an open tap; enforced by `AICallLog` + server-side per-guest counters + a global guest-spend circuit breaker (epic-29 scope) | **LOCKED** (owner-approved reversal of §22 P11) | P11 "guests never incur cost"; product-side S11; AS5 "guest generation locked" → "guest generation under quota"; P12–P15, P17 re-framed the same way (locked → quota) |

### A.3 Retirements & re-framings — explicit record

| Item                                                                                                                                                                | Disposition                  | Amends                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **FV23 / O4 retirement** — guest Phase-2 free-set ("exact subset still open") is **subsumed by the demo quota** and retired                                         | **LOCKED**                   | §6.3 item 1, §24 O4 (re-annotated), FV23; §6.3 open list updated (item removed)                                |
| **P8 / P18 re-framing** — ASR (N1) guest cell **"🔒 locked" → "🔀 demo quota"** (3× A1 + 3× A2 tries/day)                                                           | **LOCKED**                   | §2.1/§2.2 ASR rows, P8/P18, epic-36 scope                                                                      |
| **P10 / P16 re-framing** — Conversation (E.2) guest cell **"🔒 hidden" → "🔀 demo quota"** (1 session ≤5 turns/day); no longer hidden, no read-only fallback needed | **LOCKED**                   | §2.1/§2.2 conversation rows, P10/P16, S2/S11 (product-side), epic-31 scope                                     |
| **TTS guest stance** — cache-first free reads stay; generated audio **quota'd** (under L5, not locked)                                                              | **LOCKED** (business stance) | P11 flag; §6.3 TTS-surface item re-framed from "lock vs cap" → "quota mechanics" (cost-side detail OPEN, §6.3) |
| **Cross-feature per-user daily generation budget** — unified cap via `AICallLog` (5/day precedent P14) governs "free-for-users" cost control                        | **LOCKED** (policy)          | §6.3 cross-feature budget item; AS6/P14 precedent                                                              |

---

## 10. Appendix B — Ratified vs Open vs Deferred

### B.1 CLEARED / RATIFIED (owner-approved 2026-08-14)

- Access model — guest **demo quota of ALL features** (L1).
- Guest demo quota defaults accepted (ASR **3+3** · AI gen **5/3/1/1** · conv **1×≤5 turns** · TTS quota).
- **P11 amendment** — bounded guest spend replaces "never" (L5 / P11-AMEND).
- **Free-for-now launch** — no paywall (O1).
- Tiers — Guest / Registered (all features) / **Future Pro (reference only)**.
- Demo framing — Speak/Praktika-style bounded trial, documented (decision 9).
- N3 on HSK levels — independent of the learning road (L7).
- **FV23 retirement** — guest Phase-2 free-set subsumed (L1).
- **P8/P10/P16/P18 re-framing** — ASR/conversation guest cell → demo quota.
- Soft-readiness / P1-flag-kept (L2/L8).
- P0-2 re-based (decision 8).

### B.2 STILL OPEN (business — to confirm/close before or during future planning)

| Business open item                      | Nature                     | Why open                                                                                                      |
| --------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Quota numbers final sign-off**        | Confirm                    | Defaults accepted; owner final confirm at BR time (epic-25/26/29/31/36)                                       |
| **V10 pricing**                         | OPEN until costing feature | $9.99/$79.99 + Pro = reference only (O1); free-for-now holds                                                  |
| **G7 funnel measurement**               | OPEN until costing feature | Unmeasurable at launch (O3); accepted risk                                                                    |
| **Q11 ASR test run**                    | Business-validation track  | Design + budget + vendor set LOCKED (FV4–FV6); the run itself is pending (can start in parallel)              |
| **TTS guest surfaces**                  | Cost-side (P11 flag)       | Cache-first verification + quota mechanics for `POST /v1/tts` + passage-audio — stance LOCKED, mechanics open |
| **Global guest-spend budget figure**    | Cost-side                  | Set once real costing data exists (post-epic-29); the circuit-breaker cap value                               |
| **Cross-feature per-user daily budget** | Cost-side                  | Unified cap figure via `AICallLog` (policy LOCKED; number pending costing data)                               |

> **P11 amendment note (L5):** the earlier "guests never incur cost" framing is **superseded** — guests may incur **BOUNDED** vendor cost under the demo quota. The demo quota is a deliberate, budgeted **marketing line** (penny-scale/day), not an open tap; enforced by `AICallLog` + server-side per-guest counters + a global guest-spend circuit breaker (epic-29 scope — noted, not planned).

### B.3 Deferred to planning — NOT business (flagged here only)

These are implementation/planning items, deliberately excluded from the ratified business model; they move to later epic planning:

- **Epic re-scoping (25–40)** — including the new **epic-40** (L3/L4) and epic-29's guest-quota enforcement growth.
- **Soft-readiness implementation** — gate→recommendation mechanics, readiness-signal service.
- **`LearnerProfile` / "Next for you" build** — projection + sequencing service (L3/L4).
- **P0-2 re-basing detail** — `CharacterMastery` write-path sequencing as a learning-road prerequisite.
- **T-series extensions** — `CharacterMastery`/`LearnerState` new consumers, epic-38 substrate growth, T18-amendment usage.

> **Bottom line:** the business layer is now **CLEARED and RATIFIED**. The only hard reversal (P11) is explicitly owner-approved and bounded; the only unvalidated lever (funnel) is a documented accepted risk until the costing feature lands. The remaining business open items are confirmations/figure-settings that require no further design.

---

## 11. Appendix C — Decision Trail & Provenance

### C.1 The 10 pivot decisions — ALL APPROVED (2026-08-14)

| #   | Decision                                                               | Owner resolution                                                                                   | Status               |
| --- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------- |
| 1   | Adopt guest demo-quota model (vs content-lock)                         | **Approve** — demo of ALL features                                                                 | ✅ LOCKED            |
| 2   | Amend P11 — bounded guest spend                                        | **Approve** — bounded demo quota, not open tap                                                     | ✅ LOCKED            |
| 3   | Quota numbers (ASR 3+3 · AI gen 5/3/1/1 · conv 1×≤5 turns · TTS quota) | **Defaults accepted**; final sign-off = confirm item (business OPEN, Appendix B)                   | ✅ Accepted          |
| 4   | Phase-gate removal                                                     | **Soft-readiness only** — remove locks, keep signals                                               | ✅ LOCKED            |
| 5   | P1 90/10 quiz                                                          | **Keep** as free onboarding + "foundations ready" flag                                             | ✅ LOCKED            |
| 6   | "Next for you" (L3) + `LearnerProfile` (L4) placement                  | **New epic-40** (reuse epic-32 infra)                                                              | ✅ LOCKED (planning) |
| 7   | N3 on HSK levels (independent of learning road)                        | **Confirm** — no phase coupling                                                                    | ✅ LOCKED            |
| 8   | P0-2 re-based (data-integrity prerequisite, not progression blocker)   | **Accept** — keep `CharacterMastery` write path; drop only gate enforcement                        | ✅ LOCKED            |
| 9   | Demo-model framing (vs V3 competitor norm)                             | **Document** as deliberate Speak/Praktika-style free-trial pattern; not "durable free full access" | ✅ LOCKED            |
| 10  | FV23/O4 guest Phase-2 free-set                                         | **Retire** — subsumed by the demo quota                                                            | ✅ LOCKED            |

### C.2 Owner responses to §23 PROPOSED/DEFERRED (O1–O4)

| ID     | Decision (from §23)               | Owner response (verbatim → interpretation)                                                                                                                                                                          | Status                                      | Amends                                                                                                                           |
| ------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **O1** | **V10 pricing** (FV7)             | "pricing, free for now, keep other prices for ref later" → launch stays **free-for-now**; $9.99/mo / $79.99/yr + Pro tier = **reference only** (not ratified); no Pro paywall at launch                             | 🔀 **Deferred** (free-for-now)              | FV7 → reference-only; tiers updated; V10 amended                                                                                 |
| **O2** | **Trial design** (FV10)           | "also deferred until we have costing feature" → deferred until the costing/monetization (V10) feature exists; 21-day / annual-leaning / Day-0 guidance kept as future reference                                     | 🔀 **Deferred** (until V10 costing feature) | FV10 → reference-only                                                                                                            |
| **O3** | **G7 funnel capture** (FV13)      | "also deferred until we have costing feature" → no funnel measurement at launch; T18 "funnels deferred" stance holds until then                                                                                     | 🔀 **Deferred** (until V10 costing feature) | FV13 → reference-only; T18 stance holds at launch                                                                                |
| **O4** | **Guest Phase-2 free-set** (FV23) | "approve" → generous override-1 stance approved: **some Phase-2 practice free** for guests (in addition to unlimited Phase-1); **exact subset still to pin** — **retired by §25 (L1) — subsumed by the demo quota** | ✅ **Approved** (retired by L1)             | FV23 resolved-in-principle; exact subset open before epic-25/26 — re-annotated by §25, FV23 subsumed by demo quota (L1), retired |

### C.3 Clause → decision-ID map

| Business-model clause                                  | Decision IDs                                                                           |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Positioning (2025-syllabus rebase; premium AI surface) | V9, FV3, override-2, FV2 (300/500/…/5400; 11,000/10,896), FV1 (3,088)                  |
| Tiers & access matrix                                  | L1, L2, L7, L8, P11, D1, D4, override-1, O4/FV23 (retired), P8/P10/P16/P18 (re-framed) |
| Pricing (free-for-now; reference-only prices)          | O1, FV7 (V10), FV8                                                                     |
| Funnel & conversion                                    | O3, FV13 (G7), O2, FV10, FV9 (V11 two-stage), FV11 (churn), T18                        |
| Cost model (demo quota as marketing line)              | L5, P11-AMEND, FV20 (Gemini 3.x), FV21 (iFlytek), FV22 (Azure), FV12 ($0.12-hr)        |
| Unit economics (planning, unvalidated)                 | V11, FV9, FV11, M4                                                                     |
| Risk posture                                           | L5, L6/L3, P0-1, P0-2 (decision 8)                                                     |
| Data-driven learning road (sequencing, profile)        | L2, L3, L4, L6, L8 (epic-40)                                                           |

### C.4 Change Log

| Date       | Change                                                            | Decision ID | Approval           |
| ---------- | ----------------------------------------------------------------- | ----------- | ------------------ |
| 2026-08-15 | Initial ratified version — demo-guest + data-driven learning road | BM-1        | Owner (2026-08-14) |

---

## Related

- [Research Findings 2026](research/research-findings-2026.md) (M1–M19, market/competitor/cost evidence)
- [Feature Validation 2026](research/feature-validation-2026.md) (Axes 1–2, 2026 fact-check + LLM/RAG readiness)
- [Feature Inventory](research/feature-inventory.md) (84-feature inventory, registered-user view)
- [Business Index](README.md)
- [System Architecture](../architecture.md)
- [Project Documentation](../README.md)
