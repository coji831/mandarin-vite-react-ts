---
purpose: "Epic 26 design contracts: per-format surfaces, data contracts, slicing, budget"
status: completed
last-verified: 2026-10-31
type: implementation
audience: agents
---

## 26.3 Per-format surfaces (Q6, Q7, Q9, Q10)

Shared rules for all four: one submit per question via the existing store signature `submitAnswer(primary: string, tone: number)`; optimistic local evaluation then the `FEEDBACK` phase; **the `QuizStrategy` interface and `AnswerResult` are unchanged** (the answer channel is the two-argument call — see §26.4.2); every view renders the 12 states of §26.1 item 3; the per-question commit sits at the **bottom of the task `Box`**, which is the `detail` archetype's CTA position.

### 26.3.1 Dispatch must be fixed first

`MULTIPLE_CHOICE_STRATEGIES` is declared **twice** (`QuizRouter.tsx:18`, `FeedbackView.tsx:34`) as `new Set(["radical-gate"])`. With four new formats, two of which are single-select, this duplication silently routes a cloze question through `QuestionView` (audio + pinyin input) — the format would render as the wrong exercise. Delta for 26-4: replace both sets with one exported `SELECT_ONE_STRATEGIES` (`radical-gate`, `cloze`, `tone-judgment`) in `engine/constants.ts`, and replace `QuizRouter`'s if-chain with a `QUESTION_VIEWS: Record<StrategyType, ComponentType>` map so a new format cannot be added without naming its view.

### 26.3.2 Q6 — Cloze (`cloze`)

- **Interaction model:** sentence with one blanked segment; **choose one of four** tokens. Keyboard: `RadioGroup` arrow keys + Tab + Enter/Space to commit; number keys `1–4` select. Touch: options are full-width rows ≥ `--size-touch` (28px), stacked below 768px.
- **Question surface shows:** the pattern's `name`/`structure` as a one-line context `Badge`; the sentence with the blank rendered as `Box variant="dashed"` (fixed inline width, wraps at 320px); an English gloss line; the option list. No audio.
- **Feedback / announcement:** on commit the blank fills with the chosen token inside `Box variant="pass"|"fail"`, the correct token appears inline on fail, and the announcement region says `"Correct. 我打人。"` / `"Incorrect. The answer is 把."` The explanation is the pattern's `explanation` (already authored).
- **Reuse vs new:** new feature-local `ClozeQuestionView`; primitives = `Box(dashed)`, `RadioGroup`, `Badge`, `Icon`. Nothing shared is invented.
- **12 states:** `default` blank dashed, options enabled · `hover` option tint · `focus-visible` ring on the focused option · `active` pressed option · `selected` option shows `aria-pressed`/checked + blank echoes the token · `disabled` options locked while submitting · `submitting` optimistic lock, commit spinner · `pass` blank filled, success edge · `fail` blank filled with the choice, correct token shown · `empty` bank has no items for this phase → `EmptyState` + one CTA · `error` generation failed → `ErrorScreen` + retry · `edge` over-long sentence wraps, 320px, rapid re-tap while locked.

### 26.3.3 Q7 — Sentence building (`sentence-building`)

- **Interaction model:** **tap-to-place, keyboard-first. Drag is not implemented and is not a fallback path** — the registry has no DragDrop/Sortable entry, and a pointer-only assembly step would fail 2.1.1/2.5.7. Tab through the word bank, Enter appends the token to the answer row; Tab into the answer row, Enter (or the token's ✕ `icon` button) removes it. Explicit `Move left` / `Move right` `icon` buttons on the focused answer token give ordering without drag. Commit = `primary` "Check" at the bottom of the card; `ghost` "Reset" clears the row.
- **Question surface shows:** the target meaning/gloss (never the answer sentence), the word bank as `Chip interactive` tokens (shuffled, stable order per question id), and the answer row as an `<ol>` whose items are chips with a remove control.
- **Feedback / announcement:** the answer row becomes `Box variant="pass"|"fail"`; on fail the canonical order renders underneath as a token row. Announcement: `"Added 我, position 1 of 4."` on each add, then `"Correct."` / `"Incorrect. The correct order is 我 打 人."`
- **Reuse vs new:** new feature-local `SentenceBuilderView`; primitives = `Chip(interactive, active)`, `Box(pass|fail|dashed)`, `Button(primary|ghost|icon)`, `Icon`. No new shared component (a sortable list is a _format_, not a system primitive — if epic 36 needs one, it lands there with an ADR, not here).
- **12 states:** `default` empty answer row + full bank · `hover` chip tint · `focus-visible` ring on the focused chip/answer item · `active` chip press · `selected` chip leaves the bank, appears in the row (`aria-pressed` true, bank copy disabled) · `disabled` commit disabled until ≥1 token, locked while submitting · `submitting` lock + spinner · `pass` row framed pass · `fail` row framed fail + canonical order · `empty` no bank items → `EmptyState` · `error` → `ErrorScreen` · `edge` 8-token sentence at 320px (bank wraps, row scrolls, no horizontal page scroll), rapid add/remove.

### 26.3.4 Q9 — Listening dictation (`listening-dictation`)

- **Interaction model:** audio plays on demand (never autoplays), learner **types** the transcription in the existing `AnswerInput`, Enter submits, `icon` "Replay" (with an accessible label including the replay count). Keyboard-only path: Tab to Replay → Tab to field → type → Enter. Touch ≥28px on Replay and the field.
- **Question surface shows:** `AudioPlayer` (existing, TTS from the row's glyph — the glyph is **never printed**; `promptGlyph: "hide"`), the instruction line, the replay affordance, the field. Tone digits are accepted (`ni3 hao3`), matching the existing audio strategy's normalisation.
- **Feedback / announcement:** pass/fail `Box` with typed answer vs expected (tone marks rendered from the corpus), the `displayPinyin` line, and announcement `"Correct. nǐ hǎo."` / `"Incorrect. It was nǐ hǎo, third tone then third tone."`
- **Reuse vs new:** new feature-local `DictationQuestionView`; **every** part is existing — `AudioPlayer`, `AnswerInput`, `Box`, `Button(icon)`. Deliberately thin: dictation is `QuestionView` minus the glyph plus a replay count, so if `QuestionView` can host a `replayCount` slot the view can be folded into it at implementation (engineer's call, recorded in the impl doc).
- **12 states:** `default` idle, replay available · `hover` replay tint · `focus-visible` ring on replay/field · `active` replay pressed (playing indicator) · `selected` typed text present, submit enabled · `disabled` field locked while submitting; submit disabled when empty · `submitting` lock + spinner · `pass` typed text framed pass · `fail` typed text framed fail + expected shown · `empty` bank empty → `EmptyState` · `error` TTS/network failure → inline error + Replay retry (not a page-level `ErrorScreen`; the question survives) · `edge` autoplay blocked (no autoplay attempted), 0.5× device, rapid Enter, 320px.

### 26.3.5 Q10 — Tone judgment (`tone-judgment`) — a distinct format, not an `audio-to-tone` sub-mode

- **What makes it distinct (the AC's requirement):** `audio-to-tone` is **perception from audio** — hear a syllable, name its tone. `tone-judgment` has **no audio at all**: the learner reads a **written** phrase in tone-marked pinyin, sees the sandhi rule it triggers, and must state the **surface** tone of one marked syllable — i.e. it exercises the _rule_, not the ear. Different stimulus (written, no TTS), different corpus anchor (`ToneRule` + grammar example), different phase (`1`), different failure mode (a learner who hears perfectly can still fail it). It is a Phase-1 _format_.
- **Interaction model:** `RadioGroup` with five options — neutral `0`, `1`, `2`, `3`, `4` — selected by arrow keys or number keys `0–4`, committed with Enter. Touch ≥28px per option. (Single-select primitive is shared with Q6/`radical-gate`; the format is not.)
- **Question surface shows:** the rule `Badge` (`rule-3rd-sandhi`); the phrase with the target syllable bracketed and visually weighted; the base (dictionary) tones of every syllable; the question "what tone does 你 surface as here?". The answer is never pre-revealed by the bracketed rendering.
- **Feedback / announcement:** `Box variant="pass"|"fail"`, the surface-tone sequence for the whole phrase revealed on both outcomes (it _is_ the teaching moment), plus the rule's `title`. Announcement: `"Correct. 你 becomes second tone before 好."` / `"Incorrect. It is second tone: ní hǎo."`
- **Reuse vs new:** new feature-local `ToneJudgmentView`; primitives = `RadioGroup`, `Badge`, `Box(pass|fail)`, `Chip` (non-interactive, per-syllable tone display). No audio components.
- **12 states:** `default` question + 5 options · `hover` option tint · `focus-visible` ring · `active` pressed · `selected` chosen tone shown in the bracketed slot · `disabled` locked while submitting · `submitting` spinner · `pass` whole-phrase surface tones revealed · `fail` same reveal + chosen vs correct · `empty` bank empty (no rule-anchored items) → `EmptyState` · `error` → `ErrorScreen` · `edge` 320px (five options stack), a phrase where base tone already equals surface tone (no change), rapid re-select.

### 26.3.6 Q8 — comprehension authoring rule (P2; applied when Q8 ships in epic 28)

Every comprehension (Q8) question set MUST carry **at least one typed answer** — a question the learner produces rather than selects — so the set tests production, not only recognition (P2). The rule constrains the authored set, not the format: the typed item reuses `AnswerInput` and the existing `submitAnswer(primary, tone)` channel. Epic 28 enforces it per set; Epic 26 only records it in the bank's `_comment` (`content/seed/phase2/quiz-formats.json`).

---

## 26.4 Data & contract notes (architect → engineer)

### 26.4.1 The four strategy ids

| Format                 | id                    | Phase | Corpus anchor                       | FE `StrategyType` | BE registry | `promptGlyph` |
| ---------------------- | --------------------- | ----- | ----------------------------------- | ----------------- | ----------- | ------------- |
| Q6 cloze               | `cloze`               | 3     | `GrammarExample` (+ its pattern)    | add               | add         | `show`        |
| Q7 sentence-building   | `sentence-building`   | 3     | `GrammarExample` (segments)         | add               | add         | `show`        |
| Q9 listening-dictation | `listening-dictation` | 2     | `Character` / `Word` (audio target) | add               | add         | `hide`        |
| Q10 tone-judgment      | `tone-judgment`       | 1     | `GrammarExample` + `ToneRule`       | add               | add         | `show`        |

Registration is three literals that must stay in step: FE `QUIZ_STRATEGIES` (`quizStrategyRegistry.ts:15-19`), FE `StrategyType` (`types/engine.ts:10`), BE `getStrategy`/`getRegisteredTypes` (`strategies/registry.ts:18-27,33-42`) — the BE file rebuilds the **same 5-key literal twice**; collapse it to one `const STRATEGY_MAP` and derive `getRegisteredTypes()` from it. Also widen BE `QuizAttemptType` (`types/quiz.ts:21`) — it is currently **not** the FE union (`comprehension`/`qualification` are BE-only); make BE the superset and note the mapping in the impl doc rather than pretending they match.

### 26.4.2 Answer payload — encoded onto the existing columns (no migration)

`QuizAttemptAnswer`'s five answer columns are already NOT NULL and the FE wire payload (`quizService.submitAnswer`) already sends **exactly** `{questionIndex, pinyinInput, selectedTone, correctPinyin, correctTone, category}`. So the encoding is a **value convention on existing columns**, not a schema change:

| Format                   | `pinyinInput`                                     | `selectedTone`                             | `correctPinyin`               | `correctTone`         | `category`          |
| ------------------------ | ------------------------------------------------- | ------------------------------------------ | ----------------------------- | --------------------- | ------------------- |
| Q6 `cloze`               | the filled token                                  | `0` (unused sentinel — column is NOT NULL) | expected token                | `0`                   | `cloze`             |
| Q7 `sentence-building`   | ordered tokens joined by a **single ASCII space** | `0`                                        | canonical order, same join    | `0`                   | `sentence-building` |
| Q9 `listening-dictation` | the transcription as typed (trimmed)              | `0`                                        | expected pinyin (tone-marked) | `0`                   | `dictation`         |
| Q10 `tone-judgment`      | the syllable judged                               | chosen tone `0–4`                          | correct syllable              | expected surface tone | `tone-judgment`     |

Consequences that must be written into the impl, not discovered later:

- `QuizAttempt.quizType` is an unconstrained `String` (`schema.prisma:276`) → the new ids persist with no migration and no enum.
- `selectedTone`/`correctTone` are NOT NULL → the `0` sentinel is the encoding for "not a tone answer"; `0` is already a legal value (neutral tone), so a reader must key off `category`/`quizType`, never off "tone = 0".
- `category` is NOT NULL and is set to the format id (`cloze`, `sentence-building`, `dictation`, `tone-judgment`). **Correction (code review, 2026-10-30):** `CategoryBreakdown` and the backend `computeCategoryBreakdown` model only `pinyin` / `tones` / `pairs` / `rules`, and the aggregator silently drops every other key — so the results screen must NOT render the breakdown for the four new formats. It is gated to `audio-to-pinyin-tone` (`QuizResults.CATEGORY_BREAKDOWN_STRATEGIES`); a per-category bar for the practice formats, if wanted, is its own change.
- `correct: Boolean` stays server-derived.
- `QuizAttempt.metadata Json?` is the free slot for format provenance (`{ format, bankVersion }`); widening the FE `metadata` type is FE-only (`Json?` already accepts it).
- **No `response Json?` column, no `StrategyType` Prisma enum, no `QuizAttemptAnswer` reshape.** If a future format needs a structured payload, that is its own epic with an ADR.

### 26.4.3 Curated banks — authored JSON, no new table

**No new table, no migration.** The bank is an authored JSON **selection layer** over the corpus that already exists, consumed at seed time; the corpus stays the single source of truth and the answers are _derived from the anchored row_, never duplicated into the bank. Justification in one sentence: `GrammarExample` already stores per-segment `{text, pinyin, gloss}` and `Character`/`Word` already store `pinyin` + glyph, which is every field Q6/Q7/Q9/Q10 needs, so a question table would duplicate the corpus and create a second place for pinyin to drift.

Persistence path is the **existing `metadata Json` column of the anchor row** — `GrammarExample.metadata` (cloze, sentence-building, tone-judgment) and `Character.metadata` (dictation, since `Word` has no metadata column and adding one is out of scope). Shape, following the grammar precedent (`content/seed/phase2/grammar-patterns.json` → `prisma/seed.ts:505-518` → manifest → `tests/integration/grammar-seed.test.ts`):

```jsonc
// content/seed/phase2/quiz-formats.json
{
  "_comment": "Epic 26 curated quiz banks — a SELECTION layer over the corpus. Each item names an anchor row that already exists; the answer is DERIVED from the anchor at read time (never duplicated here). Seeded into the anchor row's metadata.quizFormats[] by apps/backend/prisma/seed.ts. Authoring rule for Q8 comprehension (epic 28): >=1 typed answer per set (P2).",
  "banks": {
    "cloze": [
      {
        "id": "clz_0001",
        "exampleContentId": "gr_0001_ex1",
        "blankSegmentIndex": 1,
        "category": "cloze",
      },
    ],
    "sentence-building": [
      { "id": "sbo_0001", "exampleContentId": "gr_0001_ex2", "category": "sentence-building" },
    ],
    "listening-dictation": [
      { "id": "dct_0001", "characterId": "ch_25105", "phase": 2, "category": "dictation" },
    ],
    "tone-judgment": [
      {
        "id": "tsj_0001",
        "exampleContentId": "gr_0002_ex1",
        "targetSegmentIndex": 0,
        "ruleId": "rule-3rd-sandhi",
        "category": "tone-judgment",
      },
    ],
  },
}
```

Seed + verification duties (26-7):

1. `prisma/seed.ts` reads the file, **resolves every anchor** (`exampleContentId` → `GrammarExample`, `characterId` → `Character`) and fails loudly on a dangling id — the bank can never point at a row the corpus dropped.
2. Writes `metadata.quizFormats[]` on the anchor row; **idempotent** (second run writes 0 rows, same contract as `syncGrammar`).
3. `content/seed/manifest.json` gains one `phase2` entry (`entries` + SHA-256 of the file bytes, and a bumped `generatedAt`). **There is no manifest generator script in the repo** — this entry is part of the seed change, computed, not hand-waved. `scripts/verify/verify-seed-counts.ts:12-38` is a hardcoded expected-count map with no Grammar rows today, so verification is **not** a new count there: assert instead that (a) every anchor resolves, (b) the second seed is a no-op, (c) each bank's item count matches the manifest entry — as `tests/integration/quiz-format-seed.test.ts`, mirroring `grammar-seed.test.ts`.
4. Strategy read path: `generateQuestions()` selects anchors whose `metadata.quizFormats` contains the strategy id for the phase, deterministically ordered (the anchor's `sortOrder` then id) — same no-runtime-JSON-read rule the grammar seed states.

### 26.4.4 Route contract (and the silent-fallback trap)

`?type=` is validated through the strategy registry (`QuizPage.tsx:37-40`, `parse: (raw) => raw && getStrategy(raw) ? raw : null`). An **unregistered** id therefore renders the S1 `empty` entry with no error — a typo or a not-yet-registered format looks like "no quiz selected". Registering the FE strategy is the switch that makes the route a session; a story/e2e must assert `?type=cloze` mounts a session (not the entry), so this cannot regress silently in either direction.

### 26.4.5 Guest lane

- Identity is `useAuth()`; **no new gate**. `quizSessionStore.initialize` keeps calling `createQuizAttempt` unconditionally — the server's `OptionalAuthGuard` returns a mock and **writes no row** (`quiz-nest.controller.ts:104-117,203-205`). Keeping the call (rather than branching on auth in the client) is deliberate: it exercises the server contract that L1 relies on; the verification artifact records "0 `QuizAttempt`/`QuizAttemptAnswer` rows for a guest attempt".
- **Real defect to fix (26-3):** `QuizResults.tsx:67-72` reads `completionResult?.maxScore ?? questions.length` / `completionResult?.totalScore ?? score`. A guest's mock completion is `{totalScore: 0, maxScore: 0, passed: false}`, so a guest who scored 9/10 renders **`0/0 (0%)` — not passed**. Rule: for a guest (or whenever `maxScore <= 0`) the _local_ store values win —
  `totalQuestions = isGuest || !completionResult?.maxScore ? questions.length : completionResult.maxScore`,
  `correct = isGuest ? score : (completionResult?.totalScore ?? score)`,
  `passed = isGuest ? (passThreshold != null && pct >= passThreshold * 100) : (completionResult?.passed ?? …)`.
  A guest must never see a failure badge that a server stub invented.
- The value moment is the score card + the slot's single primary (§26.2.3). Server-side demo counters are epic 29 — **not** here.

---

## 26.5 Story slicing

Order justified by dependency, not by size: truth first (26-1) so nothing downstream renders a mislabelled phase; the A26 residual next (26-2) so the four formats are never built into the failing completion region; the guest lane third (26-3) because it is a defect fix in the region 26-2 just rebuilt; formats in two pairs (26-4, 26-5) to reuse the cloze/option primitives before the second pair; the BE contract (26-6) can run parallel from the start but lands before seeded banks are consumed; banks (26-7) last-but-one because they need the registered ids; docs/verification closes (26-8).

| Story  | Scope                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Rough AC      | Depends on                                        |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------- |
| `26-1` | **Engine truth.** `PHASE_CONFIGS[3]` added (with its format mapping); key-4 dedupe (Phase-4 entries gain the `tier: 2` discriminator + a test asserting phase 4's `quizzes` ≠ phase 2's); `useQuizCard` aggregates `p <= currentPhase`; `QuizCard` rebuilt: one labelled CTA **per** assessment, current/passed/later markers that keep a current marker after a pass, text alternative for the state; `useQuizCard` unit tests (zero exist today).                                     | AC1           | —                                                 |
| `26-2` | **Completion slot + one position-locked CTA (A26 residual).** `CompletionSlot` registry entry + component + story; `QuizResults` rebuilt onto it; session-wide `role="status"` announcement region (§26.2.4); results order = value → slot → review.                                                                                                                                                                                                                                    | AC1, AC6, A26 | `26-1` (labels/aggregation)                       |
| `26-3` | **Guest lane + value moment.** Guest branch of the slot (register owns the primary); the `0/0` results defect fixed by the guest rule (§26.4.5); no-row-for-guest evidence; copy review (no "sign up" wall, no false "saved").                                                                                                                                                                                                                                                          | AC2           | `26-2` (slot owns the primary)                    |
| `26-4` | **Q6 cloze + Q7 sentence-building.** `SELECT_ONE_STRATEGIES` centralised + `QUESTION_VIEWS` dispatch map; `ClozeQuestionView`; `SentenceBuilderView` (tap-to-place, no drag); feedback branches; 24 stories (12 states × 2).                                                                                                                                                                                                                                                            | AC3 (a)       | `26-1`; `26-7` for seeded data (fixtures unblock) |
| `26-5` | **Q9 listening-dictation + Q10 tone-judgment.** `DictationQuestionView`; `ToneJudgmentView` (written sandhi, no audio — distinct from `audio-to-tone`); 24 stories.                                                                                                                                                                                                                                                                                                                     | AC3 (b)       | `26-4` (shared dispatch + primitives); `26-7`     |
| `26-6` | **BE contract + persistence.** 4 strategies registered BE; `STRATEGY_MAP` de-duplicated; `QuizAttemptType` widened + FE/BE union documented; submit/complete accept the four ids and persist the §26.4.2 encoding; registered-user persistence test; `quizType String` unchanged.                                                                                                                                                                                                       | AC4           | `26-1` (ids)                                      |
| `26-7` | **Curated banks + seed verification.** `content/seed/phase2/quiz-formats.json`; seed writes `metadata.quizFormats[]` idempotently with anchor resolution; manifest entry (count + SHA-256 + `generatedAt`); `tests/integration/quiz-format-seed.test.ts`; Q8 ≥1-typed-answer authoring rule recorded for epic 28 (P2).                                                                                                                                                                  | AC5           | `26-4`, `26-5`, `26-6`                            |
| `26-8` | **Docs + verification artifact.** This spec's status flipped to implemented with the as-built deltas; `QuizPageFull.stories.tsx` inventory note (only `pages/**/*Full.stories.tsx` is collected — the 17 existing stories stay the page gate, format stories live beside their views); verification artifact with the 5 measurements (guest 0 rows, 12 states × 4 formats, seed counts, phase aggregation, announce-region evidence); CHANGELOG entry only if a path/rule/output moved. | AC6 + close   | all                                               |

---

## 26.6 Token budget

**Token freeze applies (`design-reasoning.md` §0 / ADR-005) and NO new token is needed.** Nothing in this epic requires a value that does not exist:

| Need                        | Resolves to                                                                  |
| --------------------------- | ---------------------------------------------------------------------------- |
| Page measure 620            | `--page-measure-detail` via `PageShell archetype="detail"`                   |
| Section rhythm / item gaps  | `PageStack` rhythm + `--space-md`/`--space-lg` (registry `gap-*` classes)    |
| Touch targets               | `--size-touch` (28px) — every option, chip, replay and remove control        |
| Blank/answer slot treatment | `Box variant="dashed"` — existing variant, no border token invented          |
| Reveal colours              | `--color-success` / `--color-error` through `Box variant="pass" \| "fail"`   |
| Tone/category pills         | `Badge`, `Chip` variant sets                                                 |
| Focus ring                  | `--focus-ring` (global `:focus-visible`)                                     |
| Visually hidden region      | `.sr-only` (`globals.css:1043`)                                              |
| Corner radii                | `--radius-sm/md/lg/pill` (currently 0 — the Night Bench register, unchanged) |

If implementation discovers a genuine gap, the path is the ADR route (`DESIGN.md` + `globals.css` + `design-audit` + gate #14/#15), and it is **not** part of this epic. New CSS is limited to component classes in `Quiz.css` (`.quiz-cloze__*`, `.quiz-sentence__*`, …): no `max-width`, no `margin: auto`, no `grid-template-columns` at page scope (`design-audit`: `page-scoped-layout-css` / `page-scoped-grid` / `missing-layout-token`).

---

## 26.7 Open decisions (human sign-off before 26-1 lands)

**Signed off 2026-10-30 — all three proposals accepted as written, recorded here so 26-1 can land:**
(1) the phase → format mapping below is the product-wide meaning of "a Phase N quiz"; (2) the guest's
completion slot is owned by the register CTA, and the pitch is never a second button; (3) dictation is
character-level in this epic, words deferred.

1. **Phase → format mapping.** Proposed: Phase 1 = `tone-judgment` (+ `audio-to-pinyin-tone`); Phase 2 = `listening-dictation` (+ `ime-simulator`, `radical-gate`); Phase 3 = `cloze` + `sentence-building`; Phase 4 = the Phase-2 formats at `tier: 2`. This is what makes `PHASE_CONFIGS[3]` non-empty and key-4 non-duplicate, and it decides what "a Phase 3 quiz" means product-wide. Alternative: keep Phase 4 on the reading/grammar formats and give Phase 3 the dictation.
2. **Guest primary ownership.** Making the register CTA the single primary on results reverses the current deliberate choice to demote it to a ghost. Accept = the value moment outranks "Back to Practices" for a guest with no review queue; reject = the guest's slot primary stays _Back to Practices_ and the pitch moves to the score card as content (never a second button).
3. **Dictation scope.** Characters (`Character.metadata`, no migration) vs words (`Word` has no metadata column, so words need a new table or a deferred migration). Proposed: characters now, words deferred — the smaller option, at the cost of dictation being character-level in this epic.
