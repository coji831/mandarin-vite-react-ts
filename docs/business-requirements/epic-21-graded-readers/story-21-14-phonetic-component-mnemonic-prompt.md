# Story 21.14: Phonetic Component in Mnemonic Prompt

**Last Update:** July 24, 2026

## Description

**As a** learner,
**I want to** mnemonics leverage phonetic components and character classification data,
**So that** AI-generated memory aids are more accurate and tailored to how each character is actually constructed.

## Business Value

The current mnemonic AI prompt generates generic stories that often miss or misrepresent phonetic component relationships — a critical gap since ~80% of Chinese characters are phono-semantic compounds. Story 21.2 already populated `Character.classification` and `CharacterComponent` with phonetic component data. This story extends the AI prompt with this existing data at approximately zero additional token cost, significantly improving mnemonic quality. Pictographs are handled as a special case — since they are visual in origin, AI generation is skipped entirely and a static "visual memory" note is shown instead. Estimated effort is ~0.5-1 day for the smallest change in the merged scope.

## Acceptance Criteria

- [ ] AI mnemonic prompt template extended to include: `classification`, `phoneticComponentGlyph`, `phoneticComponentPinyin`, `phoneticComponentMeaning` for non-pictograph characters
- [ ] Pictograph characters (`classification = "pictograph"`) skip AI mnemonic generation — service returns a static "visual memory" note with etymology reference instead
- [ ] Existing non-pictograph mnemonic generation continues to work with improved prompt quality
- [ ] Unit tests verify pictograph skip logic and enhanced prompt construction
- [ ] No frontend changes required — backend-only prompt modification
- [ ] 0 lint errors across all changed files

## Business Rules

1. **Prompt Enhancement Scope** — Only the backend prompt template string is modified. The mnemonic generation service (`CachedAIFeedbackService` or equivalent) receives the additional fields as context in the prompt. No changes to the response format — the AI still returns a mnemonic story string.
2. **Pictograph Skip** — Characters classified as pictographs (classification = "pictograph") are not sent to the AI. Instead, the service returns a pre-formatted note: "This is a pictograph — its meaning comes from its visual form. Try to visualize [original meaning description] when you see this character." The etymology description comes from existing character data.
3. **Classification Data Source** — All data used in the prompt enhancement comes from tables already populated by Story 21.2: `Character.classification`, `CharacterComponent` (with `type = "phonetic"`), and associated reading data.
4. **No Frontend Changes** — This story is strictly backend prompt modification. The frontend mnemonic display card is unchanged — it continues to render whatever string the AI returns. Visual enhancement comes in Story 21.20.

## Related Issues

- Epic 21: Foundation Complete — Graded Readers & Character Practice — BR (`../README.md`) (epic parent)
- **Story 21.2: Character Content Generation** ([BR](story-21-2-character-content.md)) (dependency — classification + phoneticComponentId populated)
- **Story 21.20: Classification-Aware Mnemonic UI** ([BR](story-21-20-classification-aware-mnemonic-ui.md)) (downstream — consumes enhanced prompt output)

## Implementation Status

- **Status**: Planned
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
