# Story 21.3: Reading UI + LexicalHub Phase 1

## Description

**As a** learner,
**I want to** browse passages by HSK level, read with inline word lookup via LexicalHub, and see word-level detail in a unified hub,
**So that** I can understand new vocabulary in context.

## Business Value

This story delivers the core learner-facing reading experience. It replaces the `ContentPlaceholderPage` at `/learn/readers` with a full reading interface, complete with inline word lookup and the first phase of the unified LexicalHub system. This is where learners interact with the graded readers feature and gain the primary value of the epic.

## Acceptance Criteria

- [ ] Library view with HSK level pills and passage card grid (3-col desktop, 2-col tablet, 1-col mobile)
- [ ] Reading view with sentence-by-sentence layout, pinyin below each sentence
- [ ] Inline WordPopover on tap: compact card with glyph, pinyin, meaning
- [ ] WordPopover has "Open in Word Hub" button that opens LexicalHub in word mode (with character breakdown)
- [ ] All states covered: loading (skeleton), empty (CTA), error (retry), populated
- [ ] Storybook stories for every component with MSW handlers for all 6 HSK levels
- [ ] No hardcoded values — all styling uses CSS design tokens
- [ ] hubStore generalized from `{character, pinyin}` to `{entityType, entityId, context, navigationStack}`
- [ ] `useEntityHub` hook created (backward-compatible with existing `useCharacterHub`)
- [ ] LexicalHubRouter component created and mounted in AppLayout Modal
- [ ] WordHubContent component: word-level pinyin, definitions (polysemy), HSK badge, constituent characters as clickable chips
- [ ] CharacterHubContent moved into lexical-hub/ feature folder
- [ ] Navigation stack enables back button: word→character→radical
- [ ] Inline word popover → "View Details" → opens LexicalHub in word mode
- [ ] No regressions: existing CharacterHub usage across all features continues to work
- [ ] Phase 3 gating is respected — users cannot access readers before completing Phase 2

## Business Rules

1. **Storybook-first mandate** — All new components must have Storybook stories covering loading, empty, error, and populated states before logic implementation.
2. **LexicalHub replaces CharacterHub** — A single unified hub in AppLayout replaces the character-only modal. The hubStore supports entityType, entityId, context, and navigationStack.
3. **Backward compatibility** — `useEntityHub().openHub(glyph, pinyin)` still works for all existing CharacterHub callers. No regressions.
4. **In-modal navigation** — Back button pops navigation stack. Clicking a related entity replaces content in-place — no modal stacking.
5. **Shared components** — HubEntityCard, HubProgressActions, HubEntityRelationList are reused across all entity types.
6. **Inline WordPopover** — Compact card with glyph, pinyin, meaning. Has "Open in Word Hub" button. Audio pauses when popover is open.

## Related Issues

- Epic 21: Graded Readers — BR (`../README.md`) (epic parent)
- **Story 21.1: Data Lifecycle** ([BR](story-21-1-data-lifecycle.md)) (dependency)
- **Story 21.2: Passage Generation Backend** ([BR](story-21-2-passage-generation.md)) (dependency)
- **Story 21.4: Audio Sync** ([BR](story-21-4-audio-sync.md)) (depends on this story)
- **Story 21.5: Reading Progress** ([BR](story-21-5-reading-progress.md)) (depends on this story)

## Implementation Status

- **Status**: Planned
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
