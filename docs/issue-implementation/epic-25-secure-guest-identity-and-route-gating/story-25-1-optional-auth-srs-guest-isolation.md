**Last Updated:** October 27, 2026

# Implementation 25-1: P0-1 Guest Isolation — Repository-Level SRS Rejection

> **BR Reference:** `docs/business-requirements/epic-25-secure-guest-identity-and-route-gating/story-25-1-optional-auth-srs-guest-isolation.md`
> **Epic Implementation:** [README.md](README.md)
> **Status:** Completed
> **Last Update:** October 27, 2026
> **Key Commit:** `17fdbcdb` (test(story-25-1): pin P0-1 guest isolation with an executable inventory)

## Implementation Summary

Story 25-1 is a **verification + pinning** story, not a re-fix: the 2026-10-27 audit found the P0-1
cross-tenant SRS leak already closed at two layers (repository structural rejection + `RequireAuthGuard`
on the whole review surface). What was missing was (a) a recorded audit list and (b) a regression that
uses **real seeded rows for two users** instead of a mocked Prisma client. This story ships both, plus an
_executable_ inventory that fails the build the moment a new `OptionalAuthGuard` route or a new
optional-`userId` signature appears without a reviewed disposition.

**No production code changed.** The two deliverables are test-tier (one unit-tier static scan, one
DB-backed integration harness) and this document. Every audited claim below was re-verified against the
source before it was written down; the only correction required was a one-line number in the
investigation (`MnemonicsService.ts:54` → `:55`, see "Findings that corrected the brief").

## Technical Scope

Audit + pin the guest-read surface of the NestJS shell:

- enumerate every handler decorated with `@UseGuards(OptionalAuthGuard)` (15 across 6 controllers) and
  record what a `req.userId === undefined` caller actually receives;
- enumerate every optional-`userId` declaration that accepts an absent identity — **17 declarations**:
  11 implementation parameters across `repositories/`, `services/` and `strategies/`, plus the 6 type
  contracts that restate them — and record why each one cannot widen a query into another user's rows;
- prove, against a real database with real seeded SRS rows for two users, that the review read path
  returns **401 at the boundary** and **`[]` / `0` at the data boundary** for a guest.

**Files:**

- `apps/backend/src/nest/guards/__tests__/optional-auth-coverage.test.ts` — **NEW**: unit-tier static
  scanner. Walks every `*.controller.ts` under `src/modules/**` **and** `src/nest/**` (discovery is by
  filename, not path) and every non-test `.ts` file under `src/modules/**` (every layer, not just
  `repositories/` + `services/`), then asserts the discovered sets EQUAL the reviewed tables in the
  file; a plain-text sweep backstops the parameter scan so a shape it cannot parse fails instead of
  slipping through; also asserts every `prisma.srsCardState` query lives in `review/` and that no review
  handler mounts `OptionalAuthGuard`.
- `apps/backend/tests/integration/nest/review-guest-isolation.test.ts` — **NEW**: DB-backed two-user
  seeded leak regression (real Prisma, real routes, real `RequireAuthGuard`).
- `docs/issue-implementation/epic-25-secure-guest-identity-and-route-gating/story-25-1-optional-auth-srs-guest-isolation.md`
  — **NEW**: this document (audited read table + dispositions + decisions).

## Implementation Details

### The audited read table — every `optionalAuth` route

Paths are the `ROUTE_PATTERNS` form (the shell mounts them under `/api`). "Guard line" is the source
line that makes a user-scoped read unreachable for a guest, where one applies. Controller line numbers
are the guest short-circuit (`if (!userId)`) unless stated otherwise.

| Route (verb + path)                       | Controller handler      | Service → repository reached                                                                     | Behaviour for `req.userId === undefined`                                                                | Guard line / disposition                                                                                                      |
| ----------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `GET /v1/mnemonics/:character`            | `getMnemonic`           | `MnemonicsService.getMnemonic` → `MnemonicsRepository.findAnyByCharacter`, `getCharacterByGlyph` | skips step 1 (user-edited): shared cache → shared AI story → pictograph note, else `{ mnemonic: null }` | `MnemonicsService.ts:55` — `if (userId) {` keeps `MnemonicsRepository.findByCharacterAndUser` unreachable for a guest         |
| `GET /v1/progression/foundation-progress` | `getFoundationProgress` | none                                                                                             | `[]`                                                                                                    | n/a — guest short-circuit `progression-nest.controller.ts:89`                                                                 |
| `GET /v1/progression/phase-gate`          | `getPhaseGate`          | none                                                                                             | `createGuestPhaseGate()` → `{ currentPhase: 1, isGuest: true }`                                         | n/a — guest short-circuit `progression-nest.controller.ts:151`                                                                |
| `GET /v1/progression/gates`               | `getGates`              | none                                                                                             | three gates, all `passed: false` + `reason: "GUEST"` (projected from `createGuestPhaseGate()` — 25-2)   | n/a — guest short-circuit `progression-nest.controller.ts:181`                                                                |
| `GET /v1/progression/radical-progress`    | `getRadicalProgress`    | none                                                                                             | `[]`                                                                                                    | n/a — guest short-circuit `progression-nest.controller.ts:240`                                                                |
| `POST /v1/tts`                            | `getTtsAudio`           | `AudioService.getTtsUrl` → `AudioSynthesizer` / `AudioPathCache` (GCS)                           | identical to authed: cache-first `{ audioUrl, cached }` (guest cache MISS still synthesizes — epic-29)  | n/a — `req.userId` is read (`void req.userId`) and never threaded into a query                                                |
| `POST /v1/quiz/attempts`                  | `createQuizAttempt`     | none                                                                                             | session-local mock attempt (201, `userId: null`, no persistence)                                        | n/a — guest short-circuit `quiz-nest.controller.ts:109`                                                                       |
| `POST /v1/quiz/attempts/:id/answers`      | `submitAnswer`          | none                                                                                             | session-local mock answer (correctness computed in-controller)                                          | n/a — guest short-circuit `quiz-nest.controller.ts:160`                                                                       |
| `PUT /v1/quiz/attempts/:id/complete`      | `completeQuizAttempt`   | none                                                                                             | `{ totalScore: 0, maxScore: 0, passed: false, accuracy: 0 }`                                            | n/a — guest short-circuit `quiz-nest.controller.ts:202`                                                                       |
| `GET /v1/quiz/questions`                  | `getQuestions`          | `QuizService.generateQuestions` → registered strategy                                            | public question pool (shuffled)                                                                         | n/a — no userId parameter exists on the path                                                                                  |
| `GET /v1/quiz/config`                     | `getConfig`             | `QuizService.getQuizConfig` (static)                                                             | public strategy metadata                                                                                | n/a — no userId parameter exists on the path                                                                                  |
| `GET /v1/quiz/sandhi-drill/questions`     | `getQuestions`          | `SandhiDrillService.generateQuestions` → `Word`                                                  | public drill pool                                                                                       | n/a — no userId parameter exists on the path                                                                                  |
| `GET /v1/readers/passages`                | `listPassages`          | `ReadersService.listPassages` → `ReadersRepository.findPassages(hskLevel)`                       | `hskLevel`-filtered list; the own-generated exclusion is a no-op for a guest                            | n/a — `listPassages(userId?)` is `guest-safe-no-user-scope` (query has no identity predicate; see table 2 + adjacent finding) |
| `GET /v1/readers/passages/:id`            | `getPassage`            | `ReadersService.getPassage` → `findPassageById` + `incrementAccessCount`                         | passage + segments + HSK profile; `knownWordIds === undefined` (no per-word known status)               | n/a — `ReadersService.ts:139` (`userId ? … : undefined`)                                                                      |
| `POST /v1/readers/passages/:id/audio`     | `getPassageAudio`       | `ReadersService.getPassageAudio` → `ReadersAudioService`                                         | identical to authed: per-sentence GCS/TTS URLs (cache-first)                                            | n/a — no userId parameter exists on the path                                                                                  |

**No route above reaches `srsCardState`.** The only source file that references `prisma.srsCardState` is
`modules/review/repositories/ReviewRepository.ts`, and all three review handlers mount
`@UseGuards(RequireAuthGuard)` (`review-nest.controller.ts:67, 109, 152`). The inventory test asserts
both facts structurally, so neither can drift silently.

### Optional-`userId` signatures and their dispositions

Dispositions:

- `structural-reject` — the callee returns empty/`0` BEFORE any Prisma call.
- `guarded-unreachable:<file:line>` — an absent identity never reaches the callee (a guard line or an
  `if (userId)` wrap above it).
- `guest-safe-no-user-scope:<file:line>` — guest-reachable, and the `undefined` path either skips the
  identity-scoped step or feeds a query with **no identity predicate**: `userId` can steer a result but
  never widens a query into another user's rows. (This third class is what the measured code actually
  contains; see "Technical decisions".)

| Declaration (file:line)                                                     | Shape                         | Disposition                                                                   | Evidence (asserted by the test)                                                                                                                                       |
| --------------------------------------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `review/repositories/ReviewRepository.ts:83` `findByUserAndTypes`           | `userId: string \| undefined` | `structural-reject`                                                           | `:86-88` — `if (userId === undefined) { return []; }` before `prisma.srsCardState.findMany`                                                                           |
| `review/repositories/ReviewRepository.ts:165` `countDue`                    | `userId: string \| undefined` | `structural-reject`                                                           | `:166-168` — `if (userId === undefined) { return 0; }` before `prisma.srsCardState.count`                                                                             |
| `review/types/review.ts:39` `findByUserAndTypes` (contract)                 | `userId: string \| undefined` | `structural-reject`                                                           | same member declared as a contract; the implementation's `:86` — `if (userId === undefined) {` — carries the behaviour                                                |
| `review/types/review.ts:54` `countDue` (contract)                           | `userId: string \| undefined` | `structural-reject`                                                           | same member declared as a contract; the implementation's `:166` — `if (userId === undefined) {` — carries the behaviour                                               |
| `mnemonics/repositories/MnemonicsRepository.ts:24` `findByCharacterAndUser` | `userId: string \| null`      | `guarded-unreachable:mnemonics/services/MnemonicsService.ts:55`               | `MnemonicsService.ts:55` — `if (userId) {`; when `null` the method **drops the filter** (the P0-1 shape), so the wrap is the only thing keeping it off the guest path |
| `mnemonics/repositories/MnemonicsRepository.ts:71` `upsert`                 | `userId: string \| null`      | `guarded-unreachable:mnemonics/nest/mnemonics-nest.controller.ts:120`         | write path; only callers are `generateMnemonic`/`updateMnemonic`, reached through `@UseGuards(RequireAuthGuard)` (POST `:120`, PUT `:174`)                            |
| `mnemonics/types/mnemonics.ts:108` `findByCharacterAndUser` (contract)      | `userId: string \| null`      | `guarded-unreachable:mnemonics/services/MnemonicsService.ts:55`               | contract mirror of the row above — same wrap, same unreachability                                                                                                     |
| `mnemonics/types/mnemonics.ts:119` `upsert` (contract)                      | `userId: string \| null`      | `guarded-unreachable:mnemonics/nest/mnemonics-nest.controller.ts:120`         | contract mirror of the write path — only reached through `RequireAuthGuard`                                                                                           |
| `mnemonics/types/mnemonics.ts:133` `getMnemonic` (contract)                 | `userId?: string`             | `guest-safe-no-user-scope:mnemonics/services/MnemonicsService.ts:55`          | contract mirror of the service row below — same `if (userId) {` skip                                                                                                  |
| `mnemonics/services/MnemonicsService.ts:53` `getMnemonic`                   | `userId?: string`             | `guest-safe-no-user-scope:mnemonics/services/MnemonicsService.ts:55`          | `MnemonicsService.ts:55` — the undefined case skips the identity-scoped step entirely                                                                                 |
| `readers/services/ReadersService.ts:70` `listPassages`                      | `userId?: string`             | `guest-safe-no-user-scope:readers/repositories/ReadersRepository.ts:21`       | `ReadersRepository.ts:21-33` — `findPassages(hskLevel?)` has no identity predicate                                                                                    |
| `readers/services/ReadersService.ts:89` `getPassage`                        | `userId?: string`             | `guest-safe-no-user-scope:readers/services/ReadersService.ts:139`             | `ReadersService.ts:139` — `const knownWordIds = userId ? … : undefined`                                                                                               |
| `quiz/strategies/AudioToPinyinAndToneStrategy.ts:30` `generateQuestions`    | `_userId?: string`            | `guest-safe-no-user-scope:quiz/strategies/AudioToPinyinAndToneStrategy.ts:31` | parameter is **never read** (`_userId`); the only read in the body is `prisma.pinyinSyllable.findMany({` — shared content, no identity predicate                      |
| `quiz/strategies/ImeSimulatorStrategy.ts:24` `generateQuestions`            | `_userId?: string`            | `guest-safe-no-user-scope:quiz/strategies/ImeSimulatorStrategy.ts:28`         | parameter is **never read** (`_userId`); the only read is `prisma.radical.findMany({` (recommended radicals — shared content)                                         |
| `quiz/strategies/QualificationQuizStrategy.ts:79` `generateQuestions`       | `userId?: string`             | `guest-safe-no-user-scope:quiz/strategies/QualificationQuizStrategy.ts:85`    | parameter unused (documented "Unused; kept for interface compatibility"); the read is `prisma.character.findMany({` filtered by `hskLevel` only                       |
| `quiz/strategies/ComprehensionQuizStrategy.ts:274` `generateQuestions`      | `userId?: string`             | `guest-safe-no-user-scope:quiz/strategies/ComprehensionQuizStrategy.ts:281`   | parameter unused; there is no query at all — the only input is `const content = passage.content as PassageContent;`                                                   |
| `quiz/types/quiz.ts:15` `generateQuestions` (contract)                      | `userId?: string`             | `guest-safe-no-user-scope:quiz/services/QuizService.ts:274`                   | contract of every strategy above, cited at its ONE dispatch site: `await strategy.generateQuestions(/*userId*/);` — the identity is never supplied at all             |

**Two occurrences are excluded structurally, not by name.** The inventory also sweeps the same files for
the raw shape, and every hit must be either a table row above or one of these two documented
non-parameters (`OPTIONAL_USER_ID_EXCLUSIONS`, each asserted line-by-line):

| Occurrence (file:line)                              | Why it is not a call-facing parameter                                                                                                                                 |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mnemonics/repositories/MnemonicsRepository.ts:185` | field of the inline record shape `toRecord(raw: { …, userId: string \| null; … })` — a Prisma row mapping; excluded by the brace-depth rule, never passed by a caller |
| `mnemonics/types/mnemonics.ts:70`                   | `MnemonicStoryRecord` interface property — the row shape a repository returns; it sits outside every parameter list, so no call site can supply or drop it            |

**Contract rows are in the table on purpose.** `review/types/review.ts:39,54`, `mnemonics/types/mnemonics.ts:108,119,133`
and `quiz/types/quiz.ts:15` restate shapes that an implementation carries. An interface cannot leak on its
own — but it is what the NEXT implementation will be written against, and the earlier version of this
inventory simply did not look at `types/` at all, so a reviewer could not tell "known and dismissed" from
"never seen". Each contract row therefore cites the live line of the implementation (or dispatch site)
that carries the behaviour, and the test asserts that citation: if the implementation moves or changes,
the row fails.

**Strategies were the real hole.** `quiz/strategies/*` holds four optional-`userId` signatures
(`AudioToPinyinAndToneStrategy.ts:30`, `ImeSimulatorStrategy.ts:24`, `QualificationQuizStrategy.ts:79`,
`ComprehensionQuizStrategy.ts:274`) and the previous scan (`repositories/` + `services/` only) never read
them. They are `guest-safe-no-user-scope` for a structural reason worth naming: none of the four reads its
parameter, and `QuizService.generateQuestions` calls `strategy.generateQuestions(/*userId*/)` with no
identity at all — so there is no identity to drop into a `where`. Two of them spell the parameter
`_userId`, which is why the inventory's shape regex accepts the underscore spelling: "declared but unused"
is one edit away from "used", and that edit must not be silent.

### No production behaviour changed

Verified by re-reading every file above and re-running the guards: the repository rejection, the guard
mounts, and every guest short-circuit are exactly as the 2026-10-27 audit recorded. There was **no gap
to fix**, so nothing outside the test tier and this document modified behaviour. If a future audit finds
one, the fix belongs in the **repository** (`return []` / `return 0` before Prisma) — never in a
controller, because the next route can forget the controller check (BR Business Rule 1).

### Code-review follow-ups (2026-10-27)

Four review findings are landed on top of the original story. None of them changes a request path, a
query, or a response shape:

- **F2 (MEDIUM) — the inventory was porous.** The signature scan now reads every non-test `.ts` under
  `src/modules/**` (so `strategies/` and `types/` are in scope: +10 rows, 7 → 17), controllers are
  discovered by FILENAME across `src/modules/**` + `src/nest/**`, and the controller scanner binds
  decorator runs by proximity instead of requiring one decorator per line. A plain-text sweep backstops
  the parameter patterns, and two scanner self-tests + a per-file route count keep the scanner honest.
  The underscore spelling (`_userId?: string`) is recognised too — it was invisible before, and the two
  `_userId` strategies in `quiz/strategies/` are exactly the kind of "unused today" declaration that must
  not be able to start being used silently.
- **F6 (LOW) — a comment that stated false behaviour.** `readers-nest.controller.ts` claimed a guest lists
  **shared** passages. Corrected to the shipped behaviour (every user's generated passages) with a pointer
  to the carry-forward below. **Comment only; the query is untouched.**
- **F11 (LOW) — barrel pollution.** `modules/progression/index.ts` no longer re-exports
  `buildGuestGateStatus` / `GuestGateIdentity` / `GuestGateStatus`: the controller and the tests import the
  factory directly and no other module consumes it, and `backend.md` §2 makes `index.ts` the cross-module
  public contract. The interfaces stay beside the factory.
- **F13 (LOW) — a tautological test.** The `/gates` agreement case compared the controller's output with
  `buildGuestGateStatus(...)` — the function the controller calls. Replaced with a hand-written Phase-4
  expectation driven by a stubbed `createGuestPhaseGate()` (the Phase-1 locked shape was already asserted
  by hand-written literal in the sibling test).

## Architecture Integration

```
src/nest/guards/__tests__/optional-auth-coverage.test.ts   (guard tier — cross-module inventory)
        ↓ statically reads
src/{modules,nest}/**/*.controller.ts   ← every @UseGuards(OptionalAuthGuard) handler (by filename)
src/modules/**/*.ts (non-test)          ← every optional-userId declaration, every layer
        ↓ asserted against
modules/review/repositories/ReviewRepository.ts (the only srsCardState owner)
        ↓ pinned end-to-end by
tests/integration/nest/review-guest-isolation.test.ts (real DB, two users, real guards)
```

The inventory sits at the **guard tier** (`src/nest/guards/__tests__/`) because the contract it protects
is the guard's: "what may a caller with `req.userId === undefined` reach?" It spans six feature modules,
so it cannot live inside any one of them without cross-importing (forbidden by the modulith rules), and
`src/nest/` is where the guards it audits already live. It is a pure filesystem scan — no Nest bootstrap,
no DB — so it runs in the unit tier with the rest of the guard tests.

## Technical Decisions

**Why an executable inventory rather than a prose list.** The audit is a statement about the _current_
set of routes; a prose list freezes it in the past and silently rots the first time someone adds a route.
The test re-derives the set from source on every run and fails on any difference in either direction
(unlisted route OR a stale row), with a message that names the fix: "a new OptionalAuthGuard route must
be added to the OPTIONAL_AUTH_ROUTES table in this file, with its guest behaviour…". Each disposition
also cites a live `file:line` whose text is asserted, so a moved guard fails the test instead of quietly
becoming a lie.

**Why the seeded test needs the positive control.** A regression that only asserts "guest sees nothing"
passes trivially when the seed failed, the route is 404, or the DB is empty — exactly the hole in the
existing coverage (`ReviewRepository.test.ts` mocks Prisma and asserts `not.toHaveBeenCalled`, so no row
ever exists). The test therefore asserts, in one sequence: A's read shows A's `studyCount: 7` and a
`0` for B's tone; B's read shows B's `9` and a `0` for A's tone; and only then that the guest gets
`401`/`[]`/`0`. If the scoping were broken, the positive control fails first.

**Why the inventory lives at the guard tier, not inside a feature module.** The inventory spans
`audio`, `mnemonics`, `progression`, `quiz`, `readers` (+ `review` as the negative case). Putting it in
any one module would make that module read another module's source — the cross-import the modulith
forbids. `src/nest/guards/` already owns the guard contract and the guard tests, so the inventory sits
with its subject.

**Why a third disposition kind (`guest-safe-no-user-scope`).** The BR offers two honest outcomes for an
optional-`userId` read: structurally rejected, or unreachable-for-guests. Two measured declarations fit
neither and cannot be forced into one without writing a falsehood: `MnemonicsService.getMnemonic` **is**
guest-reachable and **does** take an optional `userId` (it narrows the lookup, never widens it), and
`ReadersService.listPassages`/`getPassage` are guest-reachable with an optional `userId` that only
selects extra per-user detail. Labelling them `guarded-unreachable` would be wrong. The third kind is
narrow on purpose — it requires the cited line to prove the `undefined` path skips the identity-scoped
step or feeds a query with no identity predicate.

## Technical Challenges & Solutions

```
Problem (1): A naive regex over "userId: string | null" also matches the inline record shape
        `private toRecord(raw: { …, userId: string | null; … })` in MnemonicsRepository —
        a declaration of a Prisma row, not a call-facing parameter. Listing it would add
        noise to the reviewed table and invite a wrong disposition.
Solution (1): Scan parameter lists only (`name( … )`, `function name( … )` or
        `const name = ( … ) =>`) and keep a paren/brace depth counter: a `userId` match is a
        parameter only at depth 0 of the parameter list. Nested object-type members are
        excluded structurally, and a unit assertion re-checks that every cited line really
        declares the shape.

Problem (2): An inventory is only as wide as its file glob. Scanning `repositories/` +
        `services/` silently skipped four LIVE optional-`userId` signatures in
        `quiz/strategies/` and every contract in `types/`, and gating controllers on a
        hard `nest/` path made a controller added elsewhere invisible.
Solution (2): Scan every non-test `.ts` under `src/modules/**` and discover controllers by
        FILENAME across `src/modules/**` + `src/nest/**`. Anything the broadened scan finds
        is either classified in the tables or listed in `OPTIONAL_USER_ID_EXCLUSIONS` with
        its structural reason.

Problem (3): A pattern scan can only be as complete as its patterns — an exotic declaration
        form would be skipped, and skipping is indistinguishable from "nothing there".
Solution (3): A plain-text sweep over the same files reports EVERY optional-`userId`
        occurrence; each must match a table row or an exclusion. A self-test proves the
        sweep catches a shape the parameter patterns cannot (`onLoad?: (userId?: string) => void`),
        so the backstop is not vacuous.

Problem (4): `scanController` matched a route decorator only when it sat alone on its line, so
        `@Get("x") @UseGuards(OptionalAuthGuard)` classified as unguarded.
Solution (4): The scanner walks decorator runs by proximity (trivia between them, same line or
        stacked, arguments wrapped across lines) and binds the whole run to the next method
        declaration. Two self-tests drive fixture strings through the same parsing function,
        and one assertion counts route decorators per file against the handlers discovered —
        a silently dropped handler fails.
```

### Findings that corrected the brief

- **`MnemonicsService.ts:54` is the comment, not the guard.** The investigation (and the BR) cite
  `MnemonicsService.ts:54`; the actual `if (userId) {` is **`:55`** (line 54 is the `// Step 1:` comment).
  The guard line recorded in this story and asserted by the inventory test is `:55`.
- **Review rejection lines recorded exactly.** The epic README cites `ReviewRepository.ts:86-88` /
  `:166-168` for the two rejections (the parameter declarations are at `:83` / `:165`); both ranges match
  the code, so the table above cites the declaration line and the rejection range.

### Adjacent finding (out of scope — recorded, not changed; **carry-forward**)

`GET /v1/readers/passages` was documented as "a guest lists **shared** passages"
(`readers-nest.controller.ts:117-119`), but the implementation lists **all** passages and only removes
the caller's own: `ReadersService.listPassages` filters `p.generatedById !== userId` when a `userId`
exists (`ReadersService.ts:75`) and `ReadersRepository.findPassages` applies no `generatedById`
predicate (`ReadersRepository.ts:21-33`). A guest therefore sees passages generated by other users.
This is **not** SRS state and is outside Story 25-1's scope (no production change made); it is recorded
here so the epic owner can decide whether it belongs to a later story. It does not weaken the audit: no
identity-scoped SRS row is exposed, which is what the dispositions assert.

**Carry-forward (owner: Readers module / next readers-track story, not this PR).** The behaviour needs
an owner, so the plan is recorded here rather than left as a lie in a comment: add the missing predicate
to `ReadersRepository.findPassages` (e.g. `generatedById: null` for the shared set, or an explicit
`isPublic`-style column) and surface "own generated" only to the caller who owns it. Until then the
controller comment now states the shipped behaviour — every user's generated passages are listed for a
guest — and points back at this section. **No query was changed in this story.**

## Doc Truth-Check

- [x] Endpoints match `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` (path + verb copied verbatim)
- [x] Feature/module/component names verified against `apps/backend/src/modules/`
- [x] Data source (static JSON vs Postgres/API) matches the backing service/repository code
- [x] All relative markdown links resolve
- [x] Last Updated / Last Update date is current (same commit as the edit)

## Testing Implementation

> **Extracted pattern:** the scanner/table design, the disposition vocabulary and the positive-control rule
> are written up as a reusable guide — [`docs/guides/testing/executable-audits.md`](../../guides/testing/executable-audits.md).
> This section keeps the story-specific counts; the how-to lives there.

**Unit tier — `apps/backend/src/nest/guards/__tests__/optional-auth-coverage.test.ts`** (11 tests, ~0.5 s,
no DB, no Nest bootstrap):

1. discovered `OptionalAuthGuard` handlers **equal** the 15-row `OPTIONAL_AUTH_ROUTES` table;
2. discovered optional-`userId` declarations **equal** the 17-row `OPTIONAL_USER_ID_SIGNATURES` table
   (11 implementation parameters + 6 contract mirrors, across `repositories/`, `services/`,
   `strategies/` and `types/`);
3. the text sweep's every occurrence is accounted for by row 2 or by `OPTIONAL_USER_ID_EXCLUSIONS`
   (2 documented record shapes), with a non-vacuity guard on the sweep's own count;
4. every exclusion row still holds its literal text, states a structural reason, and is genuinely NOT
   discovered by the parameter scan;
5. every declared shape and every disposition citation resolves to a live source line containing the
   asserted snippet (a moved guard fails, it does not silently pass);
6. every route row documents a guest behaviour and a reached dependency;
7. route self-consistency: the number of handlers discovered per controller set equals the number of
   route decorators written in those files (a silently dropped handler fails);
8. scanner self-test — decorator placement: same-line, stacked, wrapped arguments, multi-line signature,
   and a route decorator inside a comment (ignored), all through the same parsing function;
9. scanner self-test — declaration forms: method, `function`, and arrow binding are found; a nested
   record shape and a commented-out signature are not;
10. sweep self-test — a function-typed property (`onLoad?: (userId?: string) => void`) that the
    parameter patterns cannot parse IS reported by the sweep;
11. `prisma.srsCardState` appears in exactly one file (`review/repositories/ReviewRepository.ts`) and no
    `review/` handler mounts `OptionalAuthGuard`.

**Integration tier — `apps/backend/tests/integration/nest/review-guest-isolation.test.ts`** (1 test,
DB-backed, `checkDatabase` skip when no DB). One test, three steps, in order:

1. seed `tone-syllable:1` (studyCount 7) for user A and `tone-syllable:2` (studyCount 9) for user B, both
   already due;
2. positive control — `GET /api/v1/review/items?source=all&type=tone` as A reports `7` on tone 1 and `0`
   on tone 2 (and vice-versa for B), and each user's `/v1/review/due-count` is `1`;
3. guest isolation — anonymous `GET /v1/review/items` and `/v1/review/due-count` are `401 AUTH_REQUIRED`,
   and direct `ReviewRepository.findByUserAndTypes(undefined, …)` → `[]`, `countDue(undefined, …)` → `0`,
   next to a repository-level positive control proving the same rows ARE returned for `userIdA`.

**Commands**

```bash
cd apps/backend
npx vitest run src/nest/guards/__tests__/optional-auth-coverage.test.ts --config vitest.config.ts
npx vitest run tests/integration/nest/review-guest-isolation.test.ts --config vitest.integration.config.ts
npx vitest run tests/integration/nest/review-parity.test.ts --config vitest.integration.config.ts
npm run typecheck --workspace=@mandarin/backend
```
