# Story 21.21: Pictograph Warmup (Gallery + Mini-game)

**Last Update:** July 24, 2026

## Description

**As a** learner,
**I want to** start with a pictograph-focused warmup featuring an oracle bone evolution gallery and matching mini-game,
**So that** I build intuition for character origins before tackling complex characters.

## Business Value

Pictographs are the foundation of Chinese writing — the earliest characters were simple drawings of objects (日 sun, 月 moon, 山 mountain, 水 water). Yet the current Foundations page launches directly into tone practice without acknowledging this visual origin. This story adds a PictographGallery tab to the Foundations page: a visually engaging gallery of 12–20 common pictographs showing each character's evolution from oracle bone script → bronze script → modern form. A "Pictograph Match" mini-game challenges learners to match oracle bone forms to modern characters, building visual pattern recognition. This is the capstone of the Mnemonic Track, reusing the classification-aware card layout from 21.20 and the badge design patterns from 21.15. Phase-gated: unlocked after the Tones section, required before the Phase 2 gate. Estimated effort is ~3-4 days.

## Acceptance Criteria

- [ ] PictographGallery tab added to the Foundations page (alongside existing Tones, Strokes tabs)
- [ ] Gallery displays 12–20 common pictographs (日, 月, 山, 水, 火, 木, 田, 口, 目, 耳, 手, 足, 人, 大, 女, 子, 鸟, 鱼, 马, 牛)
- [ ] Each card shows: modern glyph, original meaning, oracle bone script evolution image (oracle bone → bronze → modern), stroke animation
- [ ] Card layout reuses the pictograph layout from Story 21.20 (classification-aware mnemonic card)
- [ ] "Pictograph Match" mini-game: player sees an oracle bone form → chooses the correct modern character from 4 options (MCQ)
- [ ] Mini-game has 10 questions per round, randomly selected from the gallery set
- [ ] Mini-game results stored as `QuizAttempt.quizType = "pictograph-match"` with score and time per question
- [ ] Phase-gated: PictographGallery unlocked after completing Tones section; required to pass Phase 2 gate
- [ ] Loading, empty, and error states handled for gallery and mini-game
- [ ] Storybook stories created for PictographGallery and PictographMatchGame components
- [ ] Design token compliance verified via `npm run design-audit`
- [ ] Unit tests for mini-game question generation and scoring
- [ ] 0 lint errors across all changed files

## Business Rules

1. **Pictograph Selection** — The 12–20 pictographs are selected from the character set where `classification = "pictograph"` (populated by Story 21.2). Selection prioritizes: (a) most pictographically obvious (easiest to see the visual connection), (b) most commonly used in HSK 1-2, (c) visual diversity (different object categories).
2. **Evolution Visualization** — Each card shows the character's evolution through 3 stages: oracle bone script (∼1200 BCE), bronze script (∼800 BCE), and modern form. For characters where intermediate forms are not available, the card shows at minimum the oracle bone and modern forms with a note about the evolution.
3. **Pictograph Match Mini-Game** — The game shows an oracle bone script drawing and 4 modern character options (1 correct, 3 distractors from same or similar classification). The learner selects the correct modern character. 10 questions per round, randomized from the gallery pool.
4. **Phase Gating** — The PictographGallery tab is locked until the learner completes the Tones section (existing phase requirement). Completing the Pictograph Match mini-game with ≥70% score is required for the Phase 2 gate. The phase gate check includes this requirement.
5. **Card Reuse** — The pictograph card in the gallery reuses the classification-aware card layout from Story 21.20. The badge pill (🖼️ Pictograph) from Story 21.15 is shown on each card. No new card component is created — existing components are configured for the pictograph gallery context.

## Related Issues

- Epic 21: Foundation Complete — Graded Readers & Character Practice — BR (`../README.md`) (epic parent)
- **Story 21.2: Character Content Generation** ([BR](story-21-2-character-content.md)) (dependency — pictograph classification available)
- **Story 21.15: Pictograph Classification Badges** ([BR](story-21-15-pictograph-classification-badges.md)) (dependency — badge component and golden border pattern)
- **Story 21.20: Classification-Aware Mnemonic UI** ([BR](story-21-20-classification-aware-mnemonic-ui.md)) (dependency — pictograph card layout)
- Epic 18: Character Foundations (coordination — Foundations page ownership in features/foundations/)

## Implementation Status

- **Status**: Planned
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
