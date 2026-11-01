---
description: "Use when changing answer grading, tone comparison, or pinyin normalization in quiz or review code. Covers neutral tone 0 and 5, mark and digit insensitive pinyin comparison, per-strategy correctPinyin forms, and never regressing a correct answer."
applyTo: "**/quiz/engine/strategies/*.ts,**/quiz/types/engine.ts,**/quiz/services/QuizService.ts,**/quiz/nest/quiz-nest.controller.ts,**/quiz/components/results/CategoryBreakdown.tsx,**/modules/quiz/strategies/*.ts,**/modules/review/services/ReviewService.ts,**/features/review/engine/strategies/*.ts,**/shared-utils/src/**/*.ts"
---

# Quiz Grading Normalization

## Grading Normalization (Tone & Pinyin)

All quiz grading funnels through the shared normalization helpers in
`packages/shared-utils/src/pinyin/pinyinNormalization.ts`. Backend
`QuizService.submitAnswer` and the backend strategies' `validateAnswer` use them;
frontend strategies follow the same conventions for the `correctPinyin` field.

1. **Neutral tone `0` ≡ `5`** — `areTonesEquivalent(a, b)` maps `5` → `0`
   (`normalizeTone(5) === 0`). The UI neutral-tone button sends tone `0`, but
   lexical data / `PinyinSyllable` may store neutral as `5` — treat them equal.
   - ✅ DO grade tones with `areTonesEquivalent(selectedTone, correctTone)`.
   - ❌ DON'T compare tone numbers with `===`.
2. **Pinyin comparison** — `normalizePinyinForComparison(pinyin)` lowercases,
   trims, NFKC-normalizes, strips tone marks, and drops a trailing digit `0-5`.
   So `"xiang"`, `"xiang4"`, and `"xiàng"` all compare equal.
   - ✅ DO compare with `normalizePinyinForComparison(a) === normalizePinyinForComparison(b)`.
   - ❌ DON'T compare raw strings, or do a bare `toLowerCase()`, when
     tone-marked / digit-suffixed input is possible.
3. **`correctPinyin` is the USER-INPUT form, per strategy** — it is not always
   a pinyin string:
   - `audio-to-pinyin-tone` → typed pinyin (digitless).
   - `ime-simulator` → the character **glyph** (`question.character`); the
     "pinyin" param carries the typed glyph, not pinyin.
   - `radical-gate` → the correct **option ID**; the "pinyin" param carries the
     selected option ID.
   - ❌ DON'T assume `correctPinyin` is a pinyin string for every strategy.
4. **Previously-correct answers stay correct** — normalization is conservative:
   any answer that graded correct under a strict comparison still grades correct
   after normalization (e.g. typed "xiang" when the key is "xiang"; tone `0`
   vs stored `5` both neutral). A "fix" to grading must never mark a
   previously-passing answer wrong.
