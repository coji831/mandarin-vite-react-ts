# Story 21.21: Pictograph Warmup (Gallery + Mini-game)

**Last Update:** July 31, 2026

**Status:** Delivered

## Description

**As a** learner,
**I want to** start with a pictograph-focused warmup featuring an oracle bone evolution gallery and matching mini-game,
**So that** I build intuition for character origins before tackling complex characters.

## Business Value

Pictographs are the foundation of Chinese writing — the earliest characters were simple drawings of objects (日 sun, 月 moon, 山 mountain, 水 water). Yet the current Foundations page launches directly into tone practice without acknowledging this visual origin. This story adds a PictographGallery tab to the Foundations page: a visually engaging gallery of 12–20 common pictographs showing each character's etymology with original meaning descriptions. A "Pictograph Match" mini-game challenges learners to match oracle bone forms to modern characters, building visual pattern recognition. This is the capstone of the Mnemonic Track, reusing the classification-aware card layout from 21.20 and the badge design patterns from 21.15. Phase-gated: unlocked after the Tones section, required before the Phase 2 gate. Estimated effort is ~3-4 days.

## Acceptance Criteria

- [x] PictographGallery tab added to the Foundations page (alongside existing Tones, Strokes tabs) — tab is added **locally** in `FoundationsPage.tsx`, NOT by modifying `FOUNDATION_SECTIONS`
- [x] Gallery displays 12–20 common pictographs (日, 月, 山, 水, 火, 木, 田, 口, 目, 耳, 手, 足, 人, 大, 女, 子, 鸟, 鱼, 马, 牛)
- [x] Each card shows: modern glyph, original meaning/etymology description, classification badge (🖼️ Pictograph), and "Tap to view details" → opens MnemonicCard with pictograph layout (from 21.20). Oracle bone evolution images are a future enhancement — the `MnemonicCard` `ancientFormUrl` prop is ready for this when asset data becomes available.
- [x] Card layout reuses the `MnemonicCard` from Story 21.20 with `classification="pictograph"` — no new card component is created
- [x] "Pictograph Match" mini-game: player sees an oracle bone form description → chooses the correct modern character from 4 options (MCQ)
- [x] Mini-game has 10 questions per round, randomly selected from the gallery set
- [x] Mini-game results stored locally (no backend persistence for MVP). Future: optional `QuizAttempt` creation via generic endpoint.
- [x] Phase-gated: PictographGallery tab appears but shows as **locked/disabled** (greyed out with lock indicator) until the Tones section is completed via `useFoundationsProgress()`. This is tab-level gating, not route-level. Completing the Pictograph Match mini-game with ≥70% score is required for the Phase 2 gate.
- [x] Loading, empty, and error states handled for gallery and mini-game
- [x] Storybook stories: FoundationsPage stories cover the new tab (no feature-level stories — per Storybook‑Production alignment convention)
- [x] Design token compliance verified via `npm run design-audit`
- [x] Unit tests for mini-game question generation and scoring
- [x] 0 lint errors across all changed files

## Business Rules

1. **Pictograph Selection** — The 12–20 pictographs are selected from the character set where `classification = "pictograph"` (populated by Story 21.2). Selection prioritizes: (a) most pictographically obvious (easiest to see the visual connection), (b) most commonly used in HSK 1-2, (c) visual diversity (different object categories).

2. **Evolution Visualization (MVP: Text-Only)** — For MVP, each card shows the character's meaning and a text-based etymology description (e.g., "日 originally depicted the sun as a circle with a dot in the center"). The `MnemonicCard`'s `PictographLayout` already has an `ancientFormUrl` prop designed for oracle bone images, but asset data is not yet available. Oracle bone → bronze → modern evolution images are a future enhancement.

3. **Pictograph Match Mini-Game (Standalone Client-Side Exception)** — The game shows an oracle bone script description and 4 modern character options (1 correct, 3 distractors from same or similar classification). The learner selects the correct modern character. 10 questions per round, randomized from the gallery pool. **Architecture note**: This mini-game is a **standalone client-side exception** to the quiz strategy pattern. It uses hardcoded character data (not API-driven), has image+MCQ format (not pinyin-based), and does not use backend quiz strategies. Results are stored locally only for MVP.

4. **Phase Gating (Tab-Level, Not Route-Level)** — The PictographGallery tab appears in the Foundations page but is **locked/disabled** (greyed out with lock icon) until the learner completes the Tones section. Unlocking uses `useFoundationsProgress()` to check `progress?.sections?.tones?.completed`. This is NOT route-level gating — the tab is always rendered, just disabled. Completing the Pictograph Match mini-game with ≥70% score is required for the Phase 2 gate.

5. **Card Reuse** — The pictograph card in the gallery reuses the classification-aware card layout from Story 21.20 — `MnemonicCard` with `classification="pictograph"`. The badge pill (🖼️ Pictograph) from Story 21.15 is shown on each card. **No new card component is created** — existing components are configured for the pictograph gallery context.

6. **`FOUNDATION_SECTIONS` Boundary** — The PictographGallery tab is added **locally** in `FoundationsPage.tsx`, NOT by modifying the `FOUNDATION_SECTIONS` constant in `@mandarin/shared-constants`. The 4 existing sections (Pinyin, Tones, Strokes, Animations) represent Phase 1 required content with backend progress tracking. The pictographs tab is a supplementary UI extension with no backend section tracking.

## Related Issues

- Epic 21: Foundation Complete — Graded Readers & Character Practice — BR (`../README.md`) (epic parent)
- **Story 21.2: Character Content Generation** ([BR](story-21-2-character-content.md)) (dependency — pictograph classification available)
- **Story 21.15: Pictograph Classification Badges** ([BR](story-21-15-pictograph-classification-badges.md)) (dependency — badge component and golden border pattern)
- **Story 21.20: Classification-Aware Mnemonic UI** ([BR](story-21-20-classification-aware-mnemonic-ui.md)) (dependency — pictograph card layout)
- Epic 18: Character Foundations (coordination — Foundations page ownership in features/foundations/)
- **Note**: No backend changes required — no Prisma schema modifications, no new backend services, no backend quiz controller changes. All logic is client-side.

## Implementation Status

- **Status**: Delivered
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: 407d1f87
