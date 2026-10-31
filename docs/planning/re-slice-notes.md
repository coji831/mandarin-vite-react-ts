---
purpose: "How the 25-40 plan differs from the earlier slice, and why each change was made"
status: historical
last-verified: 2026-10-31
type: planning
---

# Re-slice Notes (vs the earlier slice)

| Epic | Change vs current §5                                                                                                                                                            | Rationale (one line)                                                                                                                       |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 25   | Re-bounded: guest CTA/copy + upgrade prompts moved **out → 26**; TTS surface verification kept as a small story; explicit non-goals.                                            | 25 was 5 concerns bundled; now "guest identity + security + cost-surface governance" only — closes fast as the first gate.                 |
| 26   | Re-bounded: quiz-failure→review + interleaving + guest session-local review moved **out → 28** (review-side); keeps engine fixes + guest lane + 4 Phase-B formats as **M1/M2**. | Keeps 26 practice-only; review work belongs with SRS integrity. Recommended split: M2 (formats) → own epic if it grows.                    |
| 27   | Re-bounded: **M1** (thresholds/phonemes/radicals) + **M2** (HSK rebase) explicit; 37 now depends on **M2 only**.                                                                | The rebase is the largest data program — gating it separately makes both 27 and 37 closable. Recommended split: M2 → own epic if it grows. |
| 28   | **Re-sliced**: absorbs review calibration (from 26) as M1 alongside P0-2/SrsCardState/CharacterMastery; comprehension + P3→4 = M2; added the reserved pgvector column.          | "Review + SRS + comprehension" is one coherent vertical; keeps 26 practice-only and preserves the deliberate Q8↔P0-2 coupling (D9).        |
| 29   | Re-bounded: **M1** (gateway/log/prompts/flags) + **M2** (cost governance + T20/OB6 outcome linkage + golden set); explicit soft dep on 39 (P1/P2) + P7.                         | Cost governance is the L5 hard-reversal — gating it separately makes 29 closable; structured logs must precede AICallLog interpretation.   |
| 30   | Minor: `modules/retrieval` (C14) made an explicit AC; added 27 dep (PhaseScope metadata).                                                                                       | Codifies §6.1 addition; fixes a missing dependency.                                                                                        |
| 31   | Minor: RAG-1/FV14 **decision recorded before close** is now an AC; added 38 dep (conversation-sample capture).                                                                  | Prevents an un-decisionable epic close (FV14 is a hard decision point).                                                                    |
| 32   | Minor: T19 signal home clarified (QuizAttemptAnswer + `review_rating(source)` pre-FSRS); added 28 dep (lapses land with SrsCardState).                                          | Removes ambiguity on the weak-item signal; corrects the dependency set.                                                                    |
| 33   | **M1 (E.4)** + **M2 (E.5/G6)** made explicit.                                                                                                                                   | E.5 is self-contained (3 GETs + token infra); splitting cleanly bounds the epic. Recommended split: M2 → own epic if it grows.             |
| 34   | Clarified M1/M2 (`srs-core` + parity test vs fitting); explicit 38 dep; 28 ships schema/enum only.                                                                              | Removes the double-build risk (schema in 28, engine in 34) and makes the parity test a hard CI gate.                                       |
| 35   | Boundary unchanged; restated the satellite split + two-track TTL harvest as ACs.                                                                                                | Codifies §6.1 + the OB6 retention gate (open Q4).                                                                                          |
| 36   | Guest cell **re-framed locked → demo quota 3+3** (P8/P18); Q11 evidence made a blocking AC.                                                                                     | Reflects the §25.4 re-framing; the Q11 gate can't be closed silently.                                                                      |
| 37   | Boundary unchanged; depends on 27-M2 only.                                                                                                                                      | L7 (HSK levels, no learning-road coupling) held; rebase-consistency made testable.                                                         |
| 38   | Re-bounded: T20 leg-1 capture + P6 events + `responseMs` + T18 amendment are explicit ACs; coordinates with 28 (rides the migration).                                           | Codifies §6.1/P6; makes the substrate's dependencies (29/31/34/35) explicit.                                                               |
| 39   | **Formalized as an epic** (was a recommendation): P1–P6 (P7→29, P5-AI-cost→29) + P10; P9/G7 deferred per O3.                                                                    | Closes the observability gap as a parallel track without folding into 29/38 (concern separation).                                          |
| 40   | Formalized (L3/L4 + soft-readiness UI); depends on 28/38/27/32; FSRS-weighted after 34.                                                                                         | Makes the L2/L3/L4 planning item a first-class, closable epic reusing 32's infra.                                                          |

**No renumbering and no merges** — all 16 anchor numbers (and every decision-log reference to them) stay valid. Re-slicing = re-bounding + milestone-gating the four widest epics.

---

---

Back to the index: [Epic Plan 25-40](./epics-25-40.md)
