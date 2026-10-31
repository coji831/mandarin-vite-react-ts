---
purpose: "Gate & Data Calibration incl. HSK 2025-Rebase"
status: ratified
last-verified: 2026-10-31
type: planning
---

# Epic 27 — Gate & Data Calibration incl. HSK 2025-Rebase _(Phase C)_

**Goal:** Calibrate the gate/threshold + readiness data, fix the pinyin phoneme/teaching layer, define the radical expansion path, and land the HSK 2025-rebase data program without regressing the P0s/guards.

**Boundary — IN:**

- **M1 — thresholds + phonemes + radicals:** P1 90%/10Q into `GATE_THRESHOLDS` (documented calibration, D8); 500-char readiness data path; pinyin phoneme layer 18+32 → 21+38 = 59 (+c/s/z, +er/üan/ün/ueng/ê/apical-i; drop `io`); radical 20→50→100 content-validated expansion path + Core-300 derived top-300 by `frequencyRank` (add `@@index([frequencyRank])` on `Character`; supplementary, not mandatory — D15/V5).
- **M2 — HSK 2025-rebase (override-2):** `hsk-word-counts.js` band-end mis-sum fix (17,034 bug); `HSK_SYLLABUS` flag; 10,943 word reconciliation (149 multi-level tags preserved via `WordHskLevel @@id([wordId, hskLevel])` junction fix — R10); char-total settlement **3,088** (FV1; 3,109 branch dropped); L1–6 cumulative labels 300/500/1000/2000/3600/5400 + UI labels; reader known-word-ratio data. Guard: must not regress the P0s/guards.

**Boundary — NON-GOALS (OUT):** gate→recommendation soft-readiness mechanics + readiness UI → epic-40; HSK exam-prep app → epic-37 (consumes M2 only); Core-50 radical expansion = supplementary (not mandatory); `srs-core`/FSRS → 34; demo-quota → 29.

**Rough AC (6):**

1. BE: `GATE_THRESHOLDS` contains P1 90%/10Q; 500-char readiness is computable only from a shipped projection — §19 invariant (no gate reads a writer-less projection).
2. Data: `getCumulativeWordCount(6)` returns the true cumulative (~5,456/manifest) — regression test; displayed counts reconcile to 10,943 (or the rebased total).
3. Content: `PinyinPhoneme` = 21+38 (59), `io` removed; seed + manifest + verify-seed-counts pass.
4. Data: `Character` gains `@@index([frequencyRank])`; Core-300 derives from top-300 by `frequencyRank` (verified query).
5. Data: `WordHskLevel` junction `@@id([wordId, hskLevel])` preserves multi-level tags (no lossy dedup); vestigial `hskVersion` removed.
6. HSK rebase: syllabus labels 300/500/…/5400 + char total 3,088 landed without regressing existing quizzes/reviews (full regression suite).

**UI scope:** `UI: none` (data/substrate). _(Gate-threshold/readiness display lands with epic-40's soft-readiness UI.)_

**Dependencies:** needs 25. **Lands after Epic 24 (serial)** — 24-9 ports radicals/foundations on **current** content (27 re-touches data on Nest later). Parallel: 26, 38, 39. **M2 is the only dependency of 37; M1 feeds 28 (P3→4) and 40 (readiness data).**

**Close criteria:** data-focused BR/impl + content seed verification; Tier 1 + Tier 2 (full suite, backend type-check, backend-audit); verification artifact recording the 3,088 settlement + rebase reconciliation. **Recommended split:** promote M2 (HSK rebase) to its own epic if it grows — it is the largest single data program in the plan.

---

---

Back to the index: [Epic Plan 25-40](../epics-25-40.md) | sequencing: [Sequencing Summary](../epics-25-40.md#sequencing-summary)
