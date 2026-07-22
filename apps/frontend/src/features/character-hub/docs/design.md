# Character Hub — Design Spec

**Last Updated:** 2026-07-22

## Layout

```
NORTH: HubIdentityCard (glyph, pinyin, meaning, badges, etymology)
MIDDLE: West (HubRadicalSection) | Center (HubCharacterCard) | East (HubReadings)
SOUTH: Tabs (📖 Common Words | 📝 Mnemonic Story) → HubActions (bottom, always visible)
```

## Storybook References

- `?path=/story/features-characterhub-characterhub--loaded`
- `?path=/story/features-characterhub-characterhub--loading`
- `?path=/story/features-characterhub-characterhub--empty`
- `?path=/story/features-characterhub-characterhub--error`
- `?path=/story/features-characterhub-characterhub--mnemonicdisplay`
- `?path=/story/features-characterhub-characterhub--mnemonicempty`
- `?path=/story/features-characterhub-characterhub--mnemonicpictograph`

## Design Tokens Used

- Surface: `--surface-dark`, `--surface-dark-alt`
- Text: `--text-primary`, `--text-secondary`, `--text-tertiary`
- Spacing: `--space-sm` (component gaps), `--space-md` (card padding), `--space-lg` (section gaps)
- Border: `--surface-border`
- Primary: `--color-primary`, `--color-primary-bg`, `--color-primary-light`

## Components

| Component          | Zone   | Purpose                                                       | States                                                                                     |
| ------------------ | ------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| HubIdentityCard    | NORTH  | Character identity: glyph, pinyin, meaning, badges, etymology | Loading, loaded (with/without etymology)                                                   |
| HubRadicalSection  | WEST   | Phase-gated radical decomposition with navigation             | Loading, loaded, empty, error with retry                                                   |
| HubCharacterCard   | CENTER | Stroke animation player (mini mode)                           | Loading (skeleton), loaded                                                                 |
| HubReadings        | EAST   | All readings with pinyin, tone, audio, frequency              | Loading, loaded, empty                                                                     |
| HubActions         | SOUTH  | Save to Review / Mark Learned / 📖 Mnemonic Story buttons     | Default, loading, saved/marked, error with retry                                           |
| HubCommonWords     | SOUTH  | Common compound word chips                                    | Loading, loaded, empty                                                                     |
| HubMnemonicSection | SOUTH  | Mnemonic story display, generation, editing                   | 9 states: Loading, Cached, Empty, Generating, Display, Editing, Error, Timeout, Pictograph |

## Data Flow

- **CharacterHub.tsx** — controlled container; passes core props (character, pinyin, onClose) and optional `characterData` for Storybook
- Each section fetches detail data independently:
  - `HubIdentityCard`, `HubReadings`, `HubCommonWords` → `useCharacterDetail` hook → `characterService.loadCharacterData()`
  - `HubRadicalSection` → `useMergedRadicals()` hook → `radicalsService.loadAllRadicals()` + `loadRadicalsByCharacter()`
  - `HubMnemonicSection` → `characterService.getMnemonic()` / `generateMnemonic()` / `updateMnemonic()`; state managed via `mnemonicStore` (Zustand, 10-state machine)
- Reviews saved via `useReview().saveToReview()`
- Mnemonic state managed via `mnemonicStore` (Zustand): idle → loading → cached | empty → generating → display → editing | error | timeout | pictograph
- Character detail fetched from `GET /v1/characters/:glyph`

## Visual Acceptance Criteria

- [ ] Hub container has fixed width (670px, max 100%), data-resilient shell
- [ ] Skeleton states match final content dimensions exactly
- [ ] Loading → Data transition is smooth, no layout jump
- [ ] Empty states show contextual message, not blank or crash
- [ ] Error states show inline error with retry button
- [ ] All interactive elements have aria-labels
- [ ] Mnemonic section has fixed-height container (180px) with overflow-y auto
- [ ] All colors reference CSS variables — no hardcoded values
