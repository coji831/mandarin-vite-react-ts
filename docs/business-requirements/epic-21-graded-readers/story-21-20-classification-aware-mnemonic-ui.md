# Story 21.20: Classification-Aware Mnemonic UI

**Last Update:** July 24, 2026

## Description

**As a** learner,
**I want to** see mnemonics tailored to character type with four distinct card layouts (pictograph, phono-semantic, compound ideograph, simple ideograph),
**So that** memory aids match the character's actual construction logic.

## Business Value

The current mnemonic display card shows a uniform layout for all characters regardless of type — a single text block with the AI-generated story. This ignores the fundamental structural differences between character types. Pictographs (visual origin) benefit from etymological imagery, not stories. Phono-semantic compounds need to show meaning clue vs. sound clue separation. Compound ideographs need component breakdown. Simple ideographs need concise direct explanation. This story creates four distinct card layouts, each optimized for its character type, with a classification pill badge in the card header and regeneration guidance that suggests focus areas based on type. Estimated effort is ~2-3 days.

## Acceptance Criteria

- [ ] Mnemonic display card has 4 distinct layouts based on `Character.classification`:
  - **Pictograph**: etymology image/description + "Try visualizing" note (no AI story by default)
  - **Phono-semantic**: two-column "Meaning clue / Sound clue" layout with story below
  - **Compound ideograph**: "Meaning A + Meaning B → Combined meaning" breakdown with story
  - **Simple ideograph**: concise direct explanation with optional AI story
- [ ] Classification pill badge displayed in card header (reuses badge component from Story 21.15)
- [ ] Regeneration guidance text suggests focus area based on classification (e.g., "Focus on the sound component" for phono-semantic)
- [ ] Pictograph layout shows oracle bone / ancient form reference when available
- [ ] All four layouts covered in Storybook stories with loading, populated, and error states
- [ ] Story 21.14 prompt enhancement is consumed — mnemonic text reflects classification-aware AI prompts
- [ ] Design token compliance verified via `npm run design-audit`
- [ ] Unit tests for layout selection logic
- [ ] 0 lint errors across all changed files

## Business Rules

1. **Layout Selection** — The layout is selected automatically based on `Character.classification`. The mnemonic card component receives the classification as a prop and renders the corresponding layout. If classification is unknown/null, a default layout (similar to current) is shown.
2. **Pictograph Layout** — Shows: (a) character glyph (large), (b) oracle bone / ancient form illustration if available, (c) original meaning description, (d) "Try visualizing" note with a concrete image suggestion. No AI mnemonic story by default — the visual nature of pictographs makes stories less effective.
3. **Phono-Semantic Layout** — Two-column layout: left column = "Meaning clue" (semantic radical + meaning), right column = "Sound clue" (phonetic component + pinyin + meaning). The AI-generated story appears below the two columns, now enriched by the enhanced prompt from Story 21.14.
4. **Compound Ideograph Layout** — Shows: "Meaning A: [component1 meaning] + Meaning B: [component2 meaning] → Combined: [character meaning]". Each component is shown with its glyph and meaning. The story below explains how the components combine.
5. **Simple Ideograph Layout** — Shows: a concise direct explanation of the abstract meaning, followed by the AI-generated story. Minimal layout — no columns or component breakdown, since simple ideographs are not compositional.
6. **Regeneration Guidance** — Below the mnemonic, a "Generate new mnemonic" button shows contextual guidance: "Tip: Ask for a story that [focus area]." The focus area varies by classification (pictograph: "emphasizes visual imagery"; phono-semantic: "connects the sound to the meaning"; compound: "explains how the parts combine").

## Related Issues

- Epic 21: Foundation Complete — Graded Readers & Character Practice — BR (`../README.md`) (epic parent)
- **Story 21.14: Phonetic Component in Mnemonic Prompt** ([BR](story-21-14-phonetic-component-mnemonic-prompt.md)) (dependency — enhanced prompt output consumed by this UI)
- **Story 21.15: Pictograph Classification Badges** ([BR](story-21-15-pictograph-classification-badges.md)) (dependency — badge pill component)
- **Story 21.21: Pictograph Warmup (Gallery + Mini-game)** ([BR](story-21-21-pictograph-warmup-gallery-mini-game.md)) (downstream — reuses pictograph card layout)

## Implementation Status

- **Status**: Planned
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
