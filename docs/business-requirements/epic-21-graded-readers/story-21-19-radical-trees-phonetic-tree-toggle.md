# Story 21.19: Radical Trees — Phonetic Tree Toggle

**Last Update:** July 24, 2026

## Description

**As a** learner,
**I want to** browse characters by shared phonetic elements with a dual-tree toggle (Radical↔Phonetic),
**So that** I can discover pronunciation patterns and see which characters share the same sound component.

## Business Value

The Radical Trees feature (Epic 19) currently shows only semantic radical relationships — characters grouped by shared meaning component. This is valuable for understanding meaning patterns, but ~80% of Chinese characters are phono-semantic, meaning their pronunciation is the primary organizational axis. Adding a Phonetic Tree toggle lets learners switch between "organized by meaning" (Radical Tree) and "organized by sound" (Phonetic Tree), providing a complete structural view of characters. The phonetic tree shows phonetic component families (e.g., 青/qīng → 清/qīng, 情/qíng, 请/qǐng, 晴/qíng) with tone variation within families. Phase 2 preview shows the top 10 phonetic families; Phase 3 expands to ~100+ families. Estimated effort is ~4-5 days — the largest single new story.

## Acceptance Criteria

- [ ] Radical Trees feature has a dual-tree toggle switch: "Radical Tree" (semantic, existing) ↔ "Phonetic Tree" (sound-based, new)
- [ ] Phonetic Tree view shows characters grouped by shared phonetic component (e.g., root = 青/qīng, children = 清/情/请/晴/qíng with tone markings)
- [ ] Each phonetic family node shows: phonetic component glyph, pinyin, meaning, number of characters in family
- [ ] Phase 2 preview mode: top 10 phonetic families by character count displayed
- [ ] Phase 3 support: full expansion to ~100+ phonetic families (gated by PhaseGate model)
- [ ] Characters Module API (Story 21.10) used for phonetic component data; Phonetic Clusters API (Story 21.6) for cluster membership
- [ ] Classification badges (from Story 21.15) displayed on character nodes
- [ ] Clicking a character node opens CharacterHub/LexicalHub for character detail
- [ ] Loading, empty, and error states handled for both tree views
- [ ] Storybook stories created for Phonetic Tree view, toggle interaction, Phase 2 vs Phase 3 gating
- [ ] Unit tests for phonetic tree data generation and clustering logic
- [ ] 0 lint errors across all changed files

## Business Rules

1. **Dual-Tree Toggle** — A toggle switch at the top of the Radical Trees view lets the user switch between "Radical Tree" (existing semantic view) and "Phonetic Tree" (new sound-based view). The toggle is a standard UI toggle with clear labels. The active view is persisted in the user's UI preferences.
2. **Phonetic Tree Layout** — Root = the phonetic component glyph (e.g., 青). Children = characters containing that phonetic component, arranged in a tree layout. Each child node shows the character, its pinyin with tone, and a brief meaning. Children within a family are grouped by tone (same-tone characters together) so learners can see which characters share both component and tone.
3. **Phase Gating** — Phase 2 users see a preview of the top 10 phonetic families (by number of member characters). Phase 3+ users see the full expansion (~100+ families). The PhaseGate model is consulted to determine which tier to display.
4. **Data Sources** — Phonetic cluster membership comes from the DB-driven Phonetic Clusters infrastructure (Story 21.6). Character detail data comes from the Characters Module API (Story 21.10). No new data generation is needed — all data is already populated.
5. **ClusterProgress Model** — May require a `ClusterProgress` model or extension of `RadicalProgress` to track user progress per phonetic cluster. The decision is deferred to implementation time based on existing progress tracking architecture.

## Related Issues

- Epic 21: Foundation Complete — Graded Readers & Character Practice — BR (`../README.md`) (epic parent)
- **Story 21.6: Phonetic Clusters** ([BR](story-21-6-phonetic-clusters.md)) (dependency — DB-driven phonetic cluster API)
- **Story 21.10: Characters Backend Module** ([BR](story-21-10-characters-module.md)) (dependency — character detail API)
- **Story 21.15: Pictograph Classification Badges** ([BR](story-21-15-pictograph-classification-badges.md)) (dependency — classification badge component)
- Epic 19: Radicals & Character Details (coordination — Radical Trees feature ownership in features/radicals/)

## Implementation Status

- **Status**: Planned
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
