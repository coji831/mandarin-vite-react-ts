# Story 21.15: Pictograph Classification Badges

**Last Update:** July 24, 2026

## Description

**As a** learner,
**I want to** instantly recognize character type (pictograph, phono-semantic, compound ideograph, simple ideograph) through visual badges,
**So that** I intuitively understand how each character works at a glance.

## Business Value

The Radical Detail Card currently displays example characters without any indication of character type — learners see a grid of characters but cannot tell which are pictographs (visual origin), phono-semantic (sound+meaning), compound ideographs (meaning+meaning), or simple ideographs (abstract meaning). Story 21.2 populated `Character.classification` for all characters, making this data available. Adding visual classification badges (🖼️/🔤/🧩/⚡) to the example character grid turns an undifferentiated list into a pedagogical tool — learners instantly recognize patterns. Pictographs get special treatment (golden border + tooltip) to draw attention to the small set of foundational characters. Estimated effort is ~1 day for a pure frontend change with no backend work.

## Acceptance Criteria

- [ ] Classification badges (🖼️ Pictograph, 🔤 Phono-semantic, 🧩 Compound ideograph, ⚡ Simple ideograph) displayed on each example character in the Radical Detail Card grid
- [ ] Pictograph characters shown with golden border styling + tooltip explaining oracle bone origin
- [ ] Etymology preview shown on hover for pictograph characters
- [ ] Classification data sourced from existing `Character.classification` field (populated by 21.2) — no new API calls
- [ ] Badge component is reusable (can be used outside Radical Detail Card in future)
- [ ] Loading, empty, and error states handled for the character grid section
- [ ] Storybook stories created covering all classification badge variants
- [ ] Design token compliance verified via `npm run design-audit`
- [ ] 0 lint errors across all changed files

## Business Rules

1. **Badge Emoji + Label** — Each badge shows an emoji icon + short text label. The label matches the classification value: 🖼️ Pictograph, 🔤 Phono-semantic, 🧩 Compound ideograph, ⚡ Simple ideograph.
2. **Pictograph Golden Border** — Characters with classification "pictograph" receive a golden border (using `var(--color-gold)` or nearest design token) with a subtle glow effect. The tooltip text explains the oracle bone origin: "This character originated as a pictograph — a visual representation of the object it depicts."
3. **Classification Source** — Badges use the `classification` field from character data already available in the frontend (from content JSON or API). No additional API calls needed for this story.
4. **Reusable Component** — The badge component is created in `shared/components/` (or appropriate location) so it can be reused by Story 21.18 (IME Hints score by type) and Story 21.20 (Mnemonic UI badge pill).
5. **Accessibility** — Badges include `aria-label` describing the classification type. Golden border is not the only visual indicator — the badge emoji+text provides accessible identification.

## Related Issues

- Epic 21: Foundation Complete — Graded Readers & Character Practice — BR (`../README.md`) (epic parent)
- **Story 21.2: Character Content Generation** ([BR](story-21-2-character-content.md)) (dependency — Character.classification populated)
- **Story 21.18: IME Simulator Phonetic Hints** ([BR](story-21-18-ime-simulator-phonetic-hints.md)) (consumer — reuses badge component for score breakdown)
- **Story 21.19: Radical Trees — Phonetic Tree Toggle** ([BR](story-21-19-radical-trees-phonetic-tree-toggle.md)) (consumer — uses classification data)
- **Story 21.20: Classification-Aware Mnemonic UI** ([BR](story-21-20-classification-aware-mnemonic-ui.md)) (consumer — reuses badge pill pattern)

## Implementation Status

- **Status**: Planned
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
