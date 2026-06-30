# Story 19.4: Radical Trees (Phase 3)

## Description

**As a** learner in Phase 3,
**I want to** explore radical trees showing mastered radicals with expandable character lists,
**So that** I can see how radicals compose into full characters.

## Business Value

Radical Trees provide the conceptual bridge from individual radical study to character composition understanding. Phase 2 mode (browse a radical to see all HSK characters containing it) helps beginners see radicals in context. Phase 3 mode (tree visualization of mastered radicals) gives advanced learners a powerful tool for understanding character decomposition patterns. This feature deepens character literacy beyond isolated radical memorization.

## Acceptance Criteria

- [ ] Radical Trees accessible as a sub-view from the radicals page for Phase 3 users (verify: Phase 3 user sees "Trees" toggle/button)
- [ ] Phase 2 mode: clicking a radical shows all HSK characters containing it in a list view (verify: click radical → character list renders)
- [ ] Phase 3 mode: tree visualization showing mastered radicals as root nodes with expandable character branches (verify: mastered radicals shown, expand/collapse works)
- [ ] Each character node in the tree is clickable → opens Character Detail Hub (verify: tap character → Hub opens)
- [ ] Tree supports smooth expand/collapse animation (verify: branches animate open/close)
- [ ] Phase 3 mode only shows radicals marked as mastered (via RadicalProgress API) (verify: only mastered radicals appear as root nodes)
- [ ] Character list per radical node shows pinyin and meaning subtext (verify: subtext renders below each character)

## Business Rules

1. Phase 3 mode gated by PhaseGate.currentPhase >= 3
2. Mastered radicals determined by RadicalProgress.memorized === true from the API
3. Radical-character mapping sourced from `content/radicals/radical-character-mapping.json`

## Related Issues

- Epic 19 / **Radicals & Character Composition** ([README.md](README.md)) (Parent epic)
- Story 19.2 / **Radical Detail Card** ([story-19-2-radical-detail-card.md](story-19-2-radical-detail-card.md)) (Depends on — uses example character data)
- Story 19.3 / **Backend RadicalProgress + SRS Review Integration** ([story-19-3-backend-radical-progress.md](story-19-3-backend-radical-progress.md)) (Depends on — needs progress API data)

## Implementation Status

- **Status**: Planned
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
