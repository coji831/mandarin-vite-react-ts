# Story 15.11: Feature Extensions & Future Adaptability

## Description

**As a** developer,
**I want** to implement advanced quiz features and add architectural hooks for future enhancements,
**So that** the quiz system can handle multi-meaning words, provide better input methods, and support planned expansions without major refactoring.

## Business Value

Story 15.10 polished the core UX, but several functional limitations remain: multi-meaning words fail validation, pinyin input lacks IME-style conversion, and no way to retry mistakes. Additionally, future epics (Knowledge Hub, personalized learning) will require quiz system extensibility.

**Impact:**

- Supports complete HSK vocabulary (multi-meaning words like 花, 行 now work correctly)
- Reduces input friction for international learners (IME-style pinyin conversion)
- Enables targeted practice (review mistakes, redo quiz)
- Future-proofs quiz architecture (filter providers, distractor generators, feedback adapters)
- Improves code maintainability (common UI components, cleaner abstractions)

**User Pain Points Addressed:**

- Multi-meaning words marked wrong despite correct answer ("行 xíng" vs "行 háng")
- Pinyin input requires manual tone marks (difficult on non-Chinese keyboards)
- No way to review mistakes after quiz completion
- Inconsistent UI across app (quiz buttons vs dashboard buttons)

**Future Readiness:**

- Quiz filtering by HSK level, topic, interest (Epic 17: Knowledge Hub)
- Distractor generation for better multiple-choice questions
- Pre-generated feedback database option (reduce AI API costs)
- Multi-domain support (rename /mandarin → /learning for expansion)

## Acceptance Criteria

### Multi-Meaning/Reading Support (4 AC)

- [ ] Quiz displays all acceptable answers for multi-meaning words ("Acceptable: xíng, háng")
- [ ] Validation accepts any correct reading/meaning for words with alternatives
- [ ] Answer parsing handles CSV format variations (`白(形)`, `爸爸｜爸`, `花（名）`)
- [ ] Results page shows which variant user answered + all acceptable forms

### Pinyin Input Enhancement (2 AC)

- [x] Pinyin input auto-converts tone numbers to tone marks ("ma3" → "mǎ" in real-time)
- [x] Conversion follows IME vowel priority rules (a > e > o, special cases: iu/ui)

### Quiz Result Retention (2 AC)

- [ ] Last quiz results stored in localStorage with timestamp
- [ ] "Review Mistakes" button filters to incorrect questions only, "New Quiz" fetches fresh cards

### UI Component Migration (3 AC)

- [x] Quiz `Button` and `Input` common components created and integrated into `FeedbackSection`, `AnswerSection`, and `PinyinToneInput` (partial migration — hint variant and QuizProgressBar not done)
- [ ] Quiz inputs migrated to `@/components/ui/Input` (with pinyin conversion support)
- [ ] QuizProgressBar migrated to `@/components/ui/ProgressBar` (with step indicators)

### Future Architecture Hooks (4 AC)

- [x] `/learning` folder directory structure created (actual rename execution deferred)
- [ ] QuizFilterProvider interface created (HSK level, topic, interest filters - no UI implementation)
- [ ] DistractorGenerator interface defined (algorithm hook points, no implementation)
- [ ] FeedbackProvider abstraction added (supports AI or pre-generated feedback sources)

## Business Rules

1. **Multi-Meaning Validation**: CSV entries with semicolons or commas in English meanings treated as multiple acceptable answers; ANY match counts as correct; validation normalizes pinyin spaces before comparison.

2. **Character Variation Parsing**: Parenthetical annotations (`白(形)`, `花（名）`) stripped before display; pipe-separated alternatives (`爸爸｜爸`) split into array; ALL variants accepted during validation.

3. **Pinyin Auto-Conversion**: Tone numbers (1-4) convert to tone marks using vowel priority (a > e > o > i/u/ü); special cases: "iu" marks 'u', "ui" marks 'i'; conversion real-time on input change; fallback to raw input if conversion fails.

4. **Quiz Result Retention**: Results stored with timestamp, questions, answers, scores; expires after 24 hours or new quiz started; "Review Mistakes" filters questions with `correct: false`; "New Quiz" clears localStorage and fetches fresh due cards.

5. **UI Component Migration**: All migrated components maintain existing functionality; styling verified via visual regression tests; common components accept quiz-specific variants (e.g., Button variant="quiz-submit").

6. **Future Architecture**: Interfaces defined with TSDoc explaining intended future use; NO UI implementation for filters/distractors in this story; FeedbackProvider supports strategy pattern (AI or database lookup); folder rename deferred to separate migration story.

7. **Folder Rename Planning**: Document created with file list, import map, and step-by-step migration plan; actual rename NOT executed in this story (separate Epic 16 story for zero-downtime migration).

## Related Issues

- [**Story 15.10: Quiz UX Polish**](./story-15-10-quiz-ux-polish.md) (Prerequisite: UX foundation)
- [**Story 15.12: Documentation Finalization**](./story-15-12-documentation-finalization.md) (Follows this story)
- [**Epic 15 BR**](./README.md) (Parent epic)
- [**Epic 17: Knowledge Hub**](../epic-17-knowledge-hub/README.md) (Future consumer of filter/distractor interfaces)

## Implementation Status

- **Status**: In Progress
- **PR**: N/A
- **Merge Date**: N/A
- **Last Update**: March 15, 2026
