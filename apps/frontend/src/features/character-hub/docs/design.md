# Character Hub — Design Spec

**Last Updated:** 2026-07-21

## Storybook References

- CharacterHub: `?path=/story/features-characterhub-characterhub--default`

## Design Tokens Used

- Surface: `--surface-dark`, `--surface-dark-alt`
- Text: `--text-primary`, `--text-secondary`, `--text-tertiary`
- Spacing: `--space-sm` (component gaps), `--space-md` (card padding), `--space-lg` (section gaps)
- Border: `--surface-border`
- Primary: `--color-primary`, `--color-primary-bg`, `--color-primary-light`

## Components

| Component          | Purpose                                       | States                                                                                     |
| ------------------ | --------------------------------------------- | ------------------------------------------------------------------------------------------ |
| HubCharacterCard   | West zone — character display + stroke player | Loading, loaded, error                                                                     |
| HubInfoLine        | Character info (pinyin, HSK level)            | Loaded                                                                                     |
| HubActions         | Action buttons (favorite, practice)           | Default, active                                                                            |
| HubRadicalSection  | Radical breakdown                             | Loading, loaded, empty                                                                     |
| HubEtymology       | Etymology description                         | Loaded, empty                                                                              |
| HubReadings        | Reading list with audio                       | Loading, loaded, empty                                                                     |
| HubCommonWords     | Common word chips                             | Loading, loaded, empty                                                                     |
| HubMnemonicSection | Mnemonic story display, generation, editing   | 9 states: Loading, Cached, Empty, Generating, Display, Editing, Error, Timeout, Pictograph |

## Visual Acceptance Criteria

- [ ] Hub container has fixed dimensions (data-resilient shell)
- [ ] Skeleton states match final content dimensions exactly
- [ ] Loading → Data transition is smooth, no layout jump
- [ ] Empty states show "No data" message, not blank
- [ ] Error states show inline error with retry
- [ ] All interactive elements have aria-labels
- [ ] Mnemonic section has fixed-height container (180px) with overflow-y auto
- [ ] 📖 "View Story" button in HubActions (phase-gated, Phase 2+)

- Character data fetched from backend API via `characterHubService`
- Reviews saved via `useReview().saveToReview()`

---

## Design Tokens Used

### Colors

| Token   | CSS Variable       | Usage                     |
| ------- | ------------------ | ------------------------- |
| Primary | `--color-primary`  | Interactive elements      |
| —       | `--text-primary`   | Character glyph, headings |
| —       | `--text-secondary` | Pinyin, meaning labels    |
| —       | `--text-muted`     | Meta info, hints          |
| —       | `--surface-dark`   | Card background           |

### Spacing

| Token        | Value | Usage           |
| ------------ | ----- | --------------- |
| `--space-sm` | 8px   | Element gaps    |
| `--space-md` | 16px  | Section gaps    |
| `--space-lg` | 24px  | Card padding    |
| `--space-xl` | 32px  | Section padding |

### Typography

| Element         | Class                        | Size      |
| --------------- | ---------------------------- | --------- |
| Character glyph | `.hub-character-card__glyph` | 48px+     |
| Pinyin          | `.font-md`                   | 14px      |
| Meaning         | `.font-sm`                   | 12px      |
| Section titles  | `.font-sm fw-600`            | 12px bold |

---

## Visual Acceptance Criteria

- [ ] Header shows large character glyph + pinyin + meaning + audio button
- [ ] Info line shows stroke count, radical, HSK level
- [ ] Radical section shows component radicals with navigation links
- [ ] "Save to Review" button with loading/saved states
- [ ] All colors reference CSS variables
- [ ] WCAG AA contrast ratios
- [ ] ARIA labels on interactive elements (audio, save, radical links)
- [ ] Verified via Playwright browser screenshot
