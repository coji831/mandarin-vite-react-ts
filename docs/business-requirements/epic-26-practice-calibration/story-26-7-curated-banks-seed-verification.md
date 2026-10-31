---
purpose: Forty pinned anchors across four curated quiz banks, seeded idempotently into metadata.quizFormats with a manifest entry and nine seed-verification tests
status: completed
last-verified: 2026-10-31
type: story
---

# Story 26.7: Curated Banks and Seed Verification

**Last Updated:** October 31, 2026

## Description

**As the** product owner,
**I want** the four formats anchored to real corpus rows and verified at seed time,
**So that** a question can never outlive the content it was built from.

## Business Value

"Curated bank" could mean a new question table. It should not. `GrammarExample` already stores each
sentence segment as `{text, pinyin, gloss}`, and `Character` already stores its glyph and readings —
every field Q6, Q7, Q9 and Q10 needs. A question table would duplicate that corpus and create a second
place for pinyin to drift, so the bank is authored as a **selection layer**: an item names an anchor row
plus the index the generator needs, and the answer is derived from the anchor at read time. The file
holds no answer text at all, which is also what makes the review-ability claim true — a reviewer can see
that `clz_0001` points at `gr_0001_ex1` blanking segment 2, and nothing else.

The seed contract is the part that has to fail loudly. `syncQuizFormats` (in `prisma/sync-helpers.ts`,
called from `prisma/seed.ts`) resolves **every** anchor before it writes anything, then writes
`metadata.quizFormats[]` in one transaction. A dangling id throws before a single row changes, so a bank
cannot silently point at content the corpus dropped. The write is a canonical-JSON diff, so a second run
writes **0** rows — the same idempotency contract the grammar seed already holds.

The manifest is computed, not hand-waved. `content/seed/manifest.json` gains a `phase2` entry for
`quiz-formats.json` with the file's real item count and SHA-256, and the `generatedAt` stamp moves. The
seed suite then asserts that the manifest agrees with the file, because "the counts are right" is a claim
that rots the moment someone edits the JSON.

## Acceptance Criteria

- [x] `content/seed/phase2/quiz-formats.json` authors 40 items across the four banks, 10 in each, with
      unique ids and exactly one anchor per item. _Verified: 10 + 10 + 10 + 10 = 40 by direct count; the
      loader rejects a duplicate id and an item that names zero or two anchors._
- [x] Anchor ids are real corpus rows, not invented ones. _Verified: `quiz-format-seed.test.ts` "resolves
      every authored anchor and stores its item on that row" runs against a seeded database and fails on any
      id that does not resolve._
- [x] The seed is idempotent: a second run writes 0 rows. _Verified: `quiz-format-seed.test.ts` "is
      idempotent — the second run writes 0 rows"._
- [x] A dangling anchor id throws before anything is written. _Verified: `quiz-format-seed.test.ts`
      "fails loudly on a dangling anchor id and writes nothing"._
- [x] An item dropped from the file is pruned from the anchor's array, and restoring the real file
      restores it. _Verified: `quiz-format-seed.test.ts` "drops an item that is no longer authored, and
      restores on the real file"._
- [x] The stored item keeps the selection-layer shape — anchors and indices only, never answers.
      _Verified: `quiz-format-seed.test.ts` "keeps the selection-layer schema shape — anchors and indices
      only, never answers"; `quizFormatBank.ts` declares the allowed fields._
- [x] The manifest entry matches the file: 40 entries and the file's SHA-256, with `generatedAt` bumped.
      _Verified: `manifest.json` → `phase2["quiz-formats.json"]` = `{ entries: 40, sha256:
7244e453ae3a0d596ec4c1005e21a2ace88a6c54ac61581b544ff9d3429e30cb }`, recomputed from the file bytes;
      `quiz-format-seed.test.ts` "matches the manifest entry — item count and file hash"._
- [x] Per-bank counts are asserted against the anchors that actually carry each format. _Verified:
      `quiz-format-seed.test.ts` "matches each bank's item count against the anchors carrying it"._
- [x] The generators serve banked anchors through the real read path, and still fail open to the
      generated corpus when the bank is absent or empty. _Verified: `quiz-format-seed.test.ts` "serves the
      banked anchors through the real generators (read path)"; each strategy's header documents the fallback.
- [x] No new table, no migration, no Prisma schema change; the Q8 typed-answer authoring rule is recorded
      for epic 28. _Verified: the story commit touches `prisma/seed.ts`, `prisma/sync-helpers.ts`, the two
      content files and the test only; `_comment` in `quiz-formats.json` states the Q8 rule, and the design
      spec carries it at §26.3.6._

## Business Rules

1. **The corpus is the source of truth.** A bank item never stores an answer.
2. **Resolve before write.** A dangling anchor fails the whole seed, not one item.
3. **Idempotent by diff.** A steady-state re-run writes 0 rows.
4. **Counts are computed.** The manifest's `entries` and `sha256` are derived from the file bytes.
5. **Dictation is character-level in this epic.** `Word` has no `metadata` column; word-level dictation is
   deferred rather than force-fitted.

## Related Issues

- **Epic 26: Practice Calibration** _(link to [`../epic-26-practice-calibration/README.md`](../epic-26-practice-calibration/README.md))_ (Parent)
- **Story 26.4 and 26.5** _(link to [`story-26-5-q9-dictation-q10-tone-judgment.md`](story-26-5-q9-dictation-q10-tone-judgment.md))_ (Predecessors — the surfaces that read this bank)
- **Story 26.6: Backend Format Contract** _(link to [`story-26-6-backend-format-contract.md`](story-26-6-backend-format-contract.md))_ (Predecessor — the strategies that prefer banked anchors)
- **Story 24.1 / grammar seed** (`content/seed/phase2/grammar-patterns.json` → `syncGrammar` → `tests/integration/grammar-seed.test.ts`) (Precedent — the shape this seed follows)
- **Epic 28: Review & SRS Integrity + Comprehension** (Successor — enforces the Q8 typed-answer rule)

## Implementation Status

- **Status**: Completed
- **PR**: not yet opened (epic branch `epic-26-practice-calibration` unmerged)
- **Merge Date**: pending
- **Key Commit**: `a83dda28` (feat(epic-26): story-26-7 curated quiz banks with seed verification)
