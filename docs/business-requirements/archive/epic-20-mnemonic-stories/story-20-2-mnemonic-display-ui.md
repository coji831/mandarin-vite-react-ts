# Story 20.2: Mnemonic Display UI

## Description

**As a** learner,
**I want to** see mnemonic stories embedded in the Character Detail Hub,
**So that** I can use storytelling to remember characters without navigating to a separate page.

## Business Value

Mnemonics are the most requested feature for character memorization. Embedding in the CharacterHub (not a separate page) keeps the learning flow uninterrupted and prevents mobile overflow. The 9-state design (Loading, Cached, Empty, Generating, Display, Editing, Error, Timeout, Pictograph) ensures a polished experience for every interaction path, and phase gating (Phase 2+ only) aligns with the progressive unlock system.

## Acceptance Criteria

- [x] 📖 "View Story" button appears in HubActions for characters with decomposition data
- [x] Clicking 📖 opens HubMnemonicSection within CharacterHub (no separate page)
- [x] All 9 states implemented: Loading, Cached, Empty, Generating, Display, Editing, Error, Timeout, Pictograph
- [x] Auto-save on generation — story saves when generated, no explicit save during generation flow
- [x] User can edit story (✏️) via Textarea and save (💾)
- [x] User can regenerate (🔄) with confirmation "This will replace your story" for edited stories
- [x] Simple pictographs show info message instead of generate button
- [x] Works on mobile (320px+) without overflow
- [x] All interactive elements have ARIA labels per accessibility table
- [x] Phase 2+ users see mnemonics; Phase 1 users see nothing

## Business Rules

1. No standalone mnemonics page — embedded in CharacterHub
2. 📖 button in HubActions (NOT ExampleCharCell — prevents mobile overflow)
3. 📖 button contextually closes RadicalDetailCard first via callback (never stack modals)
4. Regenerate shows confirmation dialog for edited stories before proceeding
5. Textarea component is new — must be added to shared components + component registry
6. Pictograph 📖 button is `aria-disabled="true"` with tooltip (not hidden)

## Related Issues

- **Epic 20: Mnemonic Stories** _(link to `../README.md`)_ (Parent epic)
- **Story 20.3: Character Decomposition Data** _(link to `story-20-3-character-decomposition-data.md`)_ (Prerequisite)
- **Story 20.1: Mnemonic Generation Backend** _(link to `story-20-1-mnemonic-generation-backend.md`)_ (Prerequisite)

## Implementation Status

- **Status**: Completed
- **PR**: epic-20-mnemonic-stories
- **Merge Date**: July 21, 2026
- **Key Commit**: Story 20.2 commit (see implementation doc)
