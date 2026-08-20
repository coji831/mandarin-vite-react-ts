---
purpose: Design spec for the radicals browser, trees, and detail views (phase 2/3)
status: active
last-verified: 2026-07-08
type: design
---

# Feature: Radicals — Design Spec

**Last Updated:** 2026-07-08
**Status:** Reviewed

---

## Figma Reference

- **File:** (not yet linked — add Figma file URL here)
- **Frame:** Radicals Browser / Radical Trees / Radical Detail

---

## Layout

The radicals feature has three phases/views accessible via tabs:

| View                 | Purpose                                      | Route         |
| -------------------- | -------------------------------------------- | ------------- |
| **Browse (Phase 2)** | Grid of all radicals with search/filter/sort | Radicals page |
| **Trees (Phase 3)**  | Mastery-based tree viewer with chip picker   | Radicals page |
| **Detail**           | Full radical info + example characters       | Modal/overlay |

---

## Components

| Component           | Source                       | Notes                                                                           |
| ------------------- | ---------------------------- | ------------------------------------------------------------------------------- |
| `RadicalGrid`       | Custom in `components/`      | Responsive grid of cards, handles loading/error/empty states                    |
| `RadicalCard`       | Custom in `components/`      | Glyph, pinyin, meaning, stroke count, recommended badge                         |
| `FilterBar`         | Custom in `components/`      | Search input, stroke count dropdown, top-20 toggle, sort dropdown, reset button |
| `Dropdown`          | `shared/components/Dropdown` | Reused for stroke count and sort selectors                                      |
| `Phase2BrowseView`  | Custom in `components/`      | Composes FilterBar + RadicalGrid                                                |
| `Phase3TreeView`    | Custom in `components/`      | Search bar, chip picker, tree root node, tagline                                |
| `RadicalChipPicker` | Custom in `components/`      | Chip-style picker for mastered radicals                                         |
| `RadicalDetailCard` | Custom in `components/`      | Full detail view for a single radical                                           |
| `TreeRootNode`      | Custom in `components/`      | Expandable tree node with character list                                        |
| `BranchNode`        | Custom in `components/`      | Child node in the character composition tree                                    |
| `CharacterListNode` | Custom in `components/`      | List of example characters under a radical                                      |
| `ExampleCharGrid`   | Custom in `components/`      | Grid of example character cells                                                 |
| `ExampleCharCell`   | Custom in `components/`      | Individual character showing glyph, pinyin, meaning                             |
| `Button`            | `shared/components/Button`   | Used in error states (Retry button)                                             |

---

## Design Tokens Used

### Colors

| Token         | CSS Variable            | Usage                                   |
| ------------- | ----------------------- | --------------------------------------- |
| Primary       | `--color-primary`       | Accent highlights, interactive elements |
| Primary Dark  | `--color-primary-dark`  | Hover states                            |
| Primary Light | `--color-primary-light` | Background tints                        |
| Error         | `--color-error`         | Error messages, alert backgrounds       |
| Success       | `--color-success`       | Mastery indicators (★)                  |
| Warning       | `--color-warning`       | Recommended badges                      |
| —             | `--surface-dark`        | Card backgrounds                        |
| —             | `bg-surface-dark`       | Search bar background (utility class)   |
| —             | `--text-primary`        | Primary text                            |
| —             | `--text-secondary`      | Secondary text                          |
| —             | `--text-muted`          | Muted/hint text                         |

### Spacing

| Token        | Value | Usage                          |
| ------------ | ----- | ------------------------------ |
| `--space-xs` | 8px   | Small gaps in inline elements  |
| `--space-sm` | 12px  | Compact padding                |
| `--space-md` | 16px  | Standard gaps between elements |
| `--space-lg` | 24px  | Section padding                |
| `--space-xl` | 32px  | Large section padding          |

### Typography

| Class       | Size | Weight | Usage                        |
| ----------- | ---- | ------ | ---------------------------- |
| `.font-xs`  | 12px | 400    | Separator text, subtle hints |
| `.font-sm`  | 14px | 400    | Metadata, captions           |
| `.font-md`  | 16px | 500    | Body text, card pinyin       |
| `.font-lg`  | 18px | 500    | Empty state messages         |
| `.font-xl`  | 20px | 500    | Subheadings                  |
| `.font-2xl` | 24px | 600    | Section headings             |
| `.font-3xl` | 28px | 700    | Card titles                  |
| `.font-4xl` | 32px | 700    | Page headings                |
| `.font-5xl` | 40px | 700    | Hero / display text          |

### Layout Classes

| Class                                                       | Usage                        |
| ----------------------------------------------------------- | ---------------------------- |
| `.flex-col`                                                 | Column flexbox               |
| `.flex-center`                                              | Centered flex alignment      |
| `.flex-1`                                                   | Flex grow                    |
| `.flex-between`                                             | Space-between flex alignment |
| `.shrink-0`                                                 | Flex shrink 0                |
| `.flex-wrap`                                                | Wrapping flex                |
| `.gap-xs` / `.gap-sm` / `.gap-md` / `.gap-lg` / `.gap-xl`   | Flexbox gaps                 |
| `.p-sm` / `.p-md` / `.p-lg` / `.p-xl`                       | Padding                      |
| `.text-center`                                              | Centered text                |
| `.text-uppercase` / `.text-capitalize`                      | Text transform               |
| `Button variant="control"`                                  | Radical card trigger         |
| `Box` variants (`dark`, `header`, `chip`, etc.)             | Container sections           |
| `.alert-error`                                              | Error alert container        |
| `.bg-surface-dark` / `.bg-surface-dark-alt`                 | Surface backgrounds          |
| `.border-bottom-default`                                    | Bottom border                |
| `.border-1` / `.border-surface`                             | 1px solid surface-border     |
| `.radius-sm` / `.radius-md` / `.radius-lg` / `.radius-pill` | Border radius shortcuts      |
| `.lh-1` / `.lh-tight` / `.lh-normal`                        | Line height                  |
| `.fw-500` / `.fw-600` / `.fw-700`                           | Font weight                  |
| `.op-60` / `.op-80`                                         | Opacity                      |
| `.cursor-pointer` / `.cursor-not-allowed`                   | Cursor                       |
| `.transition-all` / `.transition-colors`                    | Transitions                  |
| `.inline-flex`                                              | Inline flex display          |

---

## States

Each component handles the following states:

| State                | Handling                                                                        |
| -------------------- | ------------------------------------------------------------------------------- |
| **Loading**          | Skeleton grid (8 placeholder cards) with "Loading radicals…" text               |
| **Error**            | Error message in alert-error container + Retry button (shared Button component) |
| **Empty**            | Descriptive message with hint (e.g., "No radicals match your filters.")         |
| **Normal**           | Full data display                                                               |
| **Active** (Phase 3) | Selected radical highlighted in chip picker + tree expanded below               |

---

## Epic-21 Additions

- **Story 21.11 — API-driven example characters:** `RadicalDetailCard` and `RadicalTreesTab` fetch example characters from `GET /v1/radicals/:id/characters` (`radicalsService.getRadicalCharacters()`), backed by the `CharacterRadical` + `Character` tables — no longer read from the radical JSON `hsk_characters` field (stripped from all 20 radical entries).
- **Story 21.15 — Classification badges:** `ExampleCharCell` renders a `ClassificationBadge` (🖼️/🔤/🧩/⚡) with a golden border (`--color-xp`) + etymology tooltip for pictographs; `classification`/`etymology` flow through from the API response.
- **Story 21.19 — Phonetic tree toggle:** `RadicalTreesTab` has a dual-tree toggle (Radical ↔ Phonetic); `PhoneticTreeView`/`PhoneticFamilyNode` render phonetic families with async classification enrichment via `phoneticTreeService`.

---

## Visual Acceptance Criteria

- [ ] Layout matches the three-phase structure (Browse / Trees / Detail)
- [ ] All colors reference CSS variables from `globals.css` (no hardcoded hex values)
- [ ] All reused components come from `shared/components/` barrel (Dropdown, Button)
- [ ] Responsive: grid adapts from 1 column (320px) to 4+ columns (1024px)
- [ ] WCAG AA contrast ratios on all text/background combinations
- [ ] ARIA labels present: `role="list"`, `role="listitem"`, `role="button"`, `role="switch"`, `aria-label` on interactive elements
- [ ] Skeleton loading states have `role="status"` and `aria-hidden="true"` on decorative elements
- [ ] Verified via Playwright browser screenshot
