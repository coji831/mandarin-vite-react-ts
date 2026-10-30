---
purpose: Forty pinned anchors seeded idempotently into metadata.quizFormats with a real manifest entry, a resolve-before-write loader, and nine DB-backed verification tests
status: completed
last-verified: 2026-10-31
type: implementation
---

**Last Updated:** October 31, 2026

# Implementation 26-7: Curated Banks and Seed Verification

> **BR Reference:** `docs/business-requirements/epic-26-practice-calibration/story-26-7-curated-banks-seed-verification.md`
> **Epic Implementation:** [README.md](README.md)
> **Status:** Completed
> **Last Update:** October 31, 2026
> **Key Commit:** `a83dda28` (feat(epic-26): story-26-7 curated quiz banks with seed verification)

## Implementation Summary

Forty authored pins, a loader that refuses to half-seed, a manifest entry computed from the file bytes, and
nine tests that run against the real database.

- **`content/seed/phase2/quiz-formats.json`** — four banks, ten items each (cloze `clz_0001…`, sentence
  building `sbo_…`, dictation `dct_…`, tone judgment `tsj_…`). An item names an anchor
  (`exampleContentId` or `characterId`) plus the index the generator needs; **no answer text is stored**.
  Anchor ids were found by read-only queries against the real corpus, not invented.
- **`syncQuizFormats`** (in `apps/backend/prisma/sync-helpers.ts`) resolves **every** anchor before the
  first write and throws on a dangling id, then writes `metadata.quizFormats[]` in one transaction. The write
  is a canonical-JSON diff, so a steady-state re-run writes 0 rows, and an item removed from the file is
  pruned from its anchor's array.
- **`prisma/seed.ts` Step 33** loads the file after grammar and characters (so every anchor exists) and logs
  the write count; a missing file is a logged skip, not a failure.
- **The manifest entry is computed**: `content/seed/manifest.json` → `phase2["quiz-formats.json"]` =
  `{ entries: 40, sha256: "7244e453ae3a0d596ec4c1005e21a2ace88a6c54ac61581b544ff9d3429e30cb" }`, with
  `generatedAt` moved to `2026-10-30T15:49:30.234Z`. Both values were re-derived from the file, not typed.
- **`tests/integration/quiz-format-seed.test.ts`** — nine tests against a reachable seeded database.

**Not done, and stated rather than implied:** `prisma/seed.ts` was **not** executed against the development
database as part of this story. The loader is exercised by the integration suite, which invokes
`syncQuizFormats` directly and restores the real file at the end, so the DB ends in exactly the state a real
seed would produce.

## Technical Scope

Author the banks, seed them into the anchor rows' existing `metadata`, register the file in the manifest, and
prove the contract with a DB-backed suite.

**Files:**

- `content/seed/phase2/quiz-formats.json` — **NEW**: 40 items across four banks + the `_comment` carrying the
  selection-layer rule and the Q8 typed-answer authoring rule for epic 28.
- `apps/backend/prisma/sync-helpers.ts` — update: `syncQuizFormats(db, file, opts)`,
  `QuizFormatSeedResult`, `QuizFormatBankFile` / `QuizFormatBankItem` handling, the `QuizBankDb` seam.
- `apps/backend/prisma/seed.ts` — update: Step 33 (load, seed, log; skip when absent).
- `content/seed/manifest.json` — update: the `phase2` entry (40 / SHA-256) and a bumped `generatedAt`.
- `apps/backend/tests/integration/quiz-format-seed.test.ts` — **NEW**: 9 tests.

## Implementation Details

### Resolve-before-write

```typescript
// Group first — validate shape, ids and anchors while nothing has been written yet.
for (const [format, items] of Object.entries(banks)) {
  for (const item of items) {
    if (seenIds.has(item.id)) throw new Error(`quiz-formats.json: duplicate item id "${item.id}"`);
    const hasExample = typeof item.exampleContentId === "string";
    const hasCharacter = typeof item.characterId === "string";
    if (hasExample === hasCharacter) {
      throw new Error(`quiz-formats.json: item "${item.id}" must pin exactly one anchor …`);
    }
    // …normalised with `format` injected from the bank key
  }
}
// Then resolve every anchor in two queries, BEFORE any write.
```

The `format` field is **injected from the bank key** at seed time rather than authored per item, so a bank
cannot contain an item that claims to belong to a different format.

### The stored shape is the selection layer

An allowed-keys set (`id`, `format`, `exampleContentId`, `characterId`, `blankSegmentIndex`,
`targetSegmentIndex`, `ruleId`, `phase`) is asserted by test, so a future edit cannot start storing the
answer in the anchor's metadata and quietly re-introducing the duplication the design avoided.

### The manifest, verified rather than trusted

```
python: hashlib.sha256(open('content/seed/phase2/quiz-formats.json','rb').read())
        → 7244e453ae3a0d596ec4c1005e21a2ace88a6c54ac61581b544ff9d3429e30cb
manifest phase2["quiz-formats.json"]
        → { "entries": 40, "sha256": "7244e453…" }
```

The suite re-computes both and fails on a mismatch, because a count that is only stated in a JSON file is a
claim, not a verification.

## Architecture Integration

```
content/seed/phase2/quiz-formats.json ─┐
content/seed/manifest.json ────────────┼── prisma/seed.ts (Step 33)
                                        │      └─ syncQuizFormats (resolve → write) ──▶ metadata.quizFormats[]
                                        │                                                     │
tests/integration/quiz-format-seed.test.ts                                                quizFormatFilter()
   (same loader, real DB, restores the file)                                                    │
                                                                                      4 BE strategies
                                                                                      (preferred anchors)
```

Why not `scripts/verify/verify-seed-counts.ts`: it is a hardcoded expected-count map
(`apps/backend/scripts/verify/verify-seed-counts.ts`) that has never carried a Grammar row, so asserting 40
there would have put the claim in a file with no knowledge of the corpus or the file's hash. The verification
lives where the facts do — in the seed's own suite.

## Technical Challenges & Solutions

```
Problem:  A dangling anchor id must not leave a half-written bank behind, and the naive loader writes as it
          walks the file.
Solution: two phases — group + validate (pure), then resolve every anchor in two findMany calls, then write in
          one transaction. The dangling-id test asserts BOTH the throw and "writes nothing".
```

```
Problem:  Idempotency for a JSON array update is not free: a re-run can rewrite the same array and report a
          write, which makes "second run writes 0" untestable.
Solution: canonical-JSON comparison before the update (the same contract `syncGrammar` uses), so a
          steady-state run is a true no-op and the counter is meaningful. Pruning falls out of the same
          comparison.
```

```
Problem:  There is no manifest generator script in the repo, so the entry has to be produced by hand — which
          is exactly how a stale hash appears.
Solution: compute it from the file bytes at authoring time, move `generatedAt`, and make the suite re-derive
          both values. The hand step is automated by the test even though the writer is manual.
```

```
Problem:  The suite needs a database, and the repo should not fail in an environment without one.
Solution: `checkDatabase()` gates the suite — when no DB is reachable it reports skipped rather than green,
          so "9 passed" in this record always means "9 passed against a real database", never "9 skipped".
          At close the suite ran unskipped: 9/9.
```

## Testing Implementation

| Test (all in `quiz-format-seed.test.ts`)                    | What it proves                                             |
| ----------------------------------------------------------- | ---------------------------------------------------------- |
| resolves every authored anchor …                            | every pin resolves to a real row and lands on that row     |
| is idempotent — the second run writes 0 rows                | the canonical-JSON diff, as a count                        |
| a file with no banks is a no-op                             | the absent/empty path returns before any write             |
| keeps the selection-layer schema shape                      | anchors and indices only, never answers                    |
| fails loudly on a dangling anchor id                        | the throw, and that nothing was written                    |
| drops an item no longer authored, restores on the real file | pruning, and that the suite leaves the DB as it found it   |
| matches the manifest entry — count and hash                 | the manifest agrees with the file bytes                    |
| matches each bank's item count                              | 10 / 10 / 10 / 10 against the anchors carrying each format |
| serves the banked anchors through the real generators       | the read path, not just the write                          |

Measured at close:

| Command                                                                                           | Result                                         |
| ------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `npx vitest run tests/integration/quiz-format-seed.test.ts --config vitest.integration.config.ts` | **1 file / 9 tests pass** (unskipped, real DB) |
| Backend full unit suite                                                                           | 60 files / 689 tests pass                      |
| Backend type-check                                                                                | exit 0                                         |

### Doc Truth-Check

- [x] No HTTP endpoint added; the bank is consumed at seed time and by Prisma queries, never by a route.
- [x] Data source verified: Postgres via Prisma (`GrammarExample`, `Character`) — **not** static JSON at
      request time.
- [x] Counts re-derived: 40 items, 10 per bank, SHA-256 `7244e453…` recomputed from the file bytes.
- [x] Relative links resolve.
- [x] `last-verified` / Last Update = 2026-10-31.
