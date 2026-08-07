---
name: "PinyinPal Design System — Amber Stone"
description: "Design tokens and component specifications for the PinyinPal Mandarin learning platform. Amber primary on warm slate backgrounds."
tokens:
  colors:
    primary:
      base: ["#B45309", "#92400E", "#D97706"]
      hover: "#D97706"
      bg: ["rgba(180,83,9,0.18)", "rgba(180,83,9,0.08)", "rgba(180,83,9,0.12)"]
      border: ["rgba(180,83,9,0.3)", "rgba(180,83,9,0.4)", "rgba(180,83,9,0.6)"]
    success:
      base: ["#34D399"]
      bg: ["rgba(52,211,153,0.15)"]
      border: ["rgba(52,211,153,0.3)"]
    error:
      base: ["#EF6B6B"]
      bg: ["rgba(239,107,107,0.15)"]
      border: ["rgba(239,107,107,0.3)"]
    warning:
      base: ["#F59E0B"]
      bg: ["rgba(245,158,11,0.15)"]
      border: ["rgba(245,158,11,0.3)"]
    info:
      default: "#FCD34D"
      blue: "#D4A843"
      purple: "#F59E0B"
    info-variants:
      default:
        bg: "rgba(252,211,77,0.15)"
        border: "rgba(252,211,77,0.3)"
      blue:
        bg: "rgba(212,168,67,0.15)"
        border: "rgba(212,168,67,0.3)"
      purple:
        bg: "rgba(245,158,11,0.15)"
        border: "rgba(245,158,11,0.3)"
    neutral:
      base: ["#78716C"]
      bg: ["rgba(120,113,108,0.15)"]
      border: ["rgba(120,113,108,0.3)"]
    surface:
      dark: ["#262321", "#1C1917", "#2D2A27"]
      border: "#3D3935"
      light:
        [
          "rgba(255,255,255,0.03)",
          "rgba(255,255,255,0.05)",
          "rgba(255,255,255,0.08)",
          "rgba(255,255,255,0.1)",
          "rgba(255,255,255,0.2)",
        ]
      overlay: "rgba(38,35,33,0.3)"
      hover: "rgba(61,57,53,0.5)"
    text:
      [
        "rgba(255,255,255,0.95)",
        "rgba(255,255,255,0.85)",
        "rgba(255,255,255,0.7)",
        "rgba(255,255,255,0.5)",
        "rgba(255,255,255,0.2)",
        "rgba(255,255,255,0.05)",
      ]
    overlay: ["rgba(0,0,0,0.7)"]
    xp:
      base: ["#FBBF24"]
      bg: ["rgba(251, 191, 36, 0.15)"]
      border: ["rgba(251, 191, 36, 0.3)"]
    blue:
      base: ["#3B82F6"]
      bg: ["rgba(59,130,246,0.15)"]
      border: ["rgba(59,130,246,0.3)"]
    green:
      base: ["#34D399"]
      bg: ["rgba(52,211,153,0.15)"]
      border: ["rgba(52,211,153,0.3)"]
    purple:
      base: ["#A78BFA"]
      bg: ["rgba(167,139,250,0.15)"]
      border: ["rgba(167,139,250,0.3)"]
    stroke-demo:
      ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7", "#dda0dd", "#f0a500", "#e8a87c"]
    tone-contour:
      bg: "#3a3a5e"
      axis: "#1a1a2e"
    # Pinyin tone colors (standard convention) — values from globals.css `--tone-1..5`.
    # Shared variants: Box `box-tone-1..5` (outline pill), Button `btn-tone-1..5` (2px outline selectable).
    tone-1:
      value: "rgba(255, 68, 68, 1)"
      box-variant: "box-tone-1"
      button-variant: "btn-tone-1"
    tone-2:
      value: "rgba(255, 140, 0, 1)"
      box-variant: "box-tone-2"
      button-variant: "btn-tone-2"
    tone-3:
      value: "rgba(76, 175, 80, 1)"
      box-variant: "box-tone-3"
      button-variant: "btn-tone-3"
    tone-4:
      value: "rgba(33, 150, 243, 1)"
      box-variant: "box-tone-4"
      button-variant: "btn-tone-4"
    tone-5:
      value: "rgba(158, 158, 158, 1)"
      box-variant: "box-tone-5"
      button-variant: "btn-tone-5"
  spacing: ["8px", "12px", "16px", "24px", "32px", "40px"]
  size:
    touch: "28px" # --size-touch: minimum touch-target dimension (WCAG 2.5.8)
  radii: ["4px", "8px", "12px", "20px"]
  shadows:
    sm: "0 2px 8px rgba(0,0,0,0.3)"
    md: "0 4px 12px rgba(245,158,11,0.2)"
    lg: "0 6px 20px rgba(245,158,11,0.25)"
    xp-glow: "0 0 8px rgba(251, 191, 36, 0.3)"
  transitions:
    fast: "0.2s ease"
    normal: "0.3s ease"
  typography:
    sizes: ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "40px", "48px"]
  gradients:
    primary: "linear-gradient(135deg, #B45309 0%, #92400E 100%)"
    success: "linear-gradient(90deg, #34D399 0%, #059669 100%)"
# Scope: catalogs shared presentational components AND registered feature/domain
# components (e.g. CharacterHub, HubMnemonicSection, tree nodes, ClusterCard,
# ConstituentCharacterChips). All listed components are registered in
# .github/component-registry.json and documented in their feature docs/design.md.
# Feature containers not registered here live in feature folders only. (Decision D1)
components:
  - name: "Button"
    file: "apps/frontend/src/shared/components/Button/Button.tsx"
    description: "Primary gradient button with hover lift + focus-visible ring. Supports keyboard (onKeyDown/onKeyUp) and aria-expanded for accessible toggles."
  - name: "Chip"
    file: "apps/frontend/src/shared/components/Chip/Chip.tsx"
    description: "Shared chip with interactive (<button>, aria-pressed on active, hover/focus-visible) and non-interactive (<span>, no toggle semantics) modes. Composes glyph/pinyin/label/icon/count slots. No-motion rule: hover/focus-visible styling only when interactive; transitions limited to colors (transition-colors) — no transform/animation."
  - name: "Input"
    file: "apps/frontend/src/shared/components/Input/Input.tsx"
    description: "Styled input with dark theme, focus ring, and error state"
  - name: "LoadingScreen"
    file: "apps/frontend/src/shared/components/LoadingScreen/LoadingScreen.tsx"
    description: "Full-page loading spinner with optional message"
  - name: "ErrorScreen"
    file: "apps/frontend/src/shared/components/ErrorScreen/ErrorScreen.tsx"
    description: "Full-page error display with retry action"
  - name: "GuestUpsell"
    file: "apps/frontend/src/shared/components/GuestUpsell/GuestUpsell.tsx"
    description: "Presentational sign-in upsell card for guest-gated features. Callers gate on useAuth().isAuthenticated; the card has no auth logic and its CTA navigates to the register page by default (override via `to`). Reused by ReviewPromptCard, HubMnemonicSection, and ReviewView."
  - name: "ProgressBar"
    file: "apps/frontend/src/shared/components/ProgressBar/ProgressBar.tsx"
    description: "Progress bar with completion celebration animation"
  - name: "FilterChip"
    file: "apps/frontend/src/shared/components/FilterChip/FilterChip.tsx"
    description: "Toggleable filter chip for content filtering; selected state shows a primary tint (bg + border + text) + aria-pressed."
  - name: "ToggleSwitch"
    file: "apps/frontend/src/shared/components/ToggleSwitch/ToggleSwitch.tsx"
    description: "Toggle switch for binary settings"
  - name: "ContentBrowser"
    file: "apps/frontend/src/shared/components/ContentBrowser/ContentBrowser.tsx"
    description: "Content browser for navigating learning materials. The active-filter count badge delegates to the shared Chip component (non-interactive, count slot)."
  - name: "Box"
    file: "apps/frontend/src/shared/components/Box/Box.tsx"
    description: "Generic layout container. Preferred over raw <div>. 20 variants, 7 padding sizes."
  - name: "Modal"
    file: "apps/frontend/src/shared/components/Modal/Modal.tsx"
    description: "Controlled overlay dialog with backdrop, close on Escape, size variants (sm/md/lg)."
  - name: "Card"
    file: "apps/frontend/src/shared/components/Card/Card.tsx"
    description: "Content card with title, subtitle, optional icon/badge/locked state. The optional badge delegates to the shared Badge component (variant primary)."
  - name: "Tabs"
    file: "apps/frontend/src/shared/components/Tabs/Tabs.tsx"
    description: "Tab navigation bar with panel content slot and optional lock states. Supports default and underline variants."
  - name: "Textarea"
    file: "apps/frontend/src/shared/components/Textarea/Textarea.tsx"
    description: "Controlled multiline text input with dark theme, focus ring, and character limit."
  - name: "Spinner"
    file: "apps/frontend/src/shared/components/Spinner/Spinner.tsx"
    description: "Loading spinner indicator. Sizes: sm/md/lg, customizable color."
  - name: "Skeleton"
    file: "apps/frontend/src/shared/components/Skeleton/Skeleton.tsx"
    description: "Content placeholder shimmer for loading states."
  - name: "Dropdown"
    file: "apps/frontend/src/shared/components/Dropdown/Dropdown.tsx"
    description: "Dropdown select menu with controlled value."
  - name: "Grid"
    file: "apps/frontend/src/shared/components/Grid/Grid.tsx"
    description: "CSS Grid layout container with auto-fill support."
  - name: "SearchInput"
    file: "apps/frontend/src/shared/components/SearchInput/SearchInput.tsx"
    description: "Search input with search icon and clear button."
  - name: "SideNav"
    file: "apps/frontend/src/shared/components/SideNav/SideNav.tsx"
    description: "Side navigation panel. Nav-only since Story 22.4 (auth lives in the AppTopBar UserMenu); phase-gated Learn group + desktop collapsed rail (icons only, no auth chrome)."
  - name: "UserMenu"
    file: "apps/frontend/src/shared/components/UserMenu/UserMenu.tsx"
    description: "Single account control (login/user-info/logout) — avatar trigger + popover (account header, Profile, Settings, Logout); guest state = Login/Register CTAs. Hosted in the AppTopBar so it is reachable at every breakpoint."
  - name: "AppTopBar"
    file: "apps/frontend/src/shared/components/AppTopBar/AppTopBar.tsx"
    description: "Slim global top bar hosting the UserMenu on the right; auth threaded in via props (AppLayout → AppTopBar → UserMenu), no feature import."
  - name: "TopNav"
    file: "apps/frontend/src/shared/components/TopNav/TopNav.tsx"
    description: "Top navigation bar with route-based NavLinks. Phase-gated lock support. (Orphaned since Story 22.4 — Learn tabs moved to the sidebar Learn group; kept pending cleanup follow-up.)"
  - name: "FilterControls"
    file: "apps/frontend/src/shared/components/FilterControls/FilterControls.tsx"
    description: "Filter bar with multiple FilterChips, search, and reset."
  - name: "RadioGroup"
    file: "apps/frontend/src/shared/components/RadioGroup/RadioGroup.tsx"
    description: "Radio button group for single-selection from options."
  - name: "TextLink"
    file: "apps/frontend/src/shared/components/TextLink/TextLink.tsx"
    description: "Inline button styled as a link. For form-switch actions where Router links won't work."
  - name: "CharacterStrokePlayer"
    file: "apps/frontend/src/shared/components/CharacterStroke/CharacterStrokePlayer.tsx"
    description: "Stroke animation player. Full mode for practice, mini mode for embedding."
  - name: "CharacterHub"
    file: "apps/frontend/src/features/character-hub/components/CharacterHub/CharacterHub.tsx"
    description: "Character Detail Hub overlay — modal with character info, stroke animation, audio, radicals, and actions. Feature container (calls hooks/services) — see features/character-hub/docs/design.md."
  - name: "HubMnemonicSection"
    file: "apps/frontend/src/features/character-hub/components/HubMnemonicSection/HubMnemonicSection.tsx"
    description: "Feature component — Phase-gated mnemonic story section for CharacterHub. Displays, generates, and edits AI-powered mnemonic stories. Feature container — see features/character-hub/docs/design.md."
  - name: "AnimationCanvas"
    file: "apps/frontend/src/shared/components/CharacterStroke/AnimationCanvas.tsx"
    description: "Canvas-based stroke order animation container."
  - name: "ClassificationBadge"
    file: "apps/frontend/src/shared/components/ClassificationBadge.tsx"
    description: "Pill badge for character classification types (pictograph, phono_semantic, etc.) with color-coded variants."
  - name: "MnemonicCard"
    file: "apps/frontend/src/shared/components/MnemonicCard/MnemonicCard.tsx"
    description: "Classification-aware mnemonic story card. Selects among 4 sub-layouts — PictographLayout (etymology + visualize), PhonoSemanticLayout (meaning/sound clue grid), CompoundIdeographLayout (component breakdown), SimpleIdeographLayout (concise + story) — based on character classification. Header shows ClassificationBadge; footer shows regeneration guidance. Loading/generating skeleton states included."
  - name: "Badge"
    file: "apps/frontend/src/shared/components/Badge/Badge.tsx"
    description: "Shared token pill for inline metadata labels (HSK level, tags, counts). Variants: primary (bg-primary-bg / text-primary), surface (bg-surface-hover / text-primary), accent (bg-primary-bg-medium / text-primary-light). Migrated from 3 feature-inlined HSK badge styles (readers, word-hub, phonetic-clusters)."
  - name: "TreeRootNode"
    file: "apps/frontend/src/features/radicals/components/TreeRootNode.tsx"
    description: "Radical tree root node — a mastered radical with expandable character branches. Tree EXCEPTION: chevron rotate(90deg) + grid-template-rows expand/collapse animation (see Radical/Phonetic Trees section). The character-count pill delegates to the shared Chip component (non-interactive, count slot)."
  - name: "BranchNode"
    file: "apps/frontend/src/features/radicals/components/BranchNode.tsx"
    description: "Character branch node — horizontal row with glyph, pinyin, meaning, audio button, and Hub link. Tree EXCEPTION: ::before vertical rail + corner connector tree lines (see Radical/Phonetic Trees section)."
  - name: "PhoneticFamilyNode"
    file: "apps/frontend/src/features/radicals/components/PhoneticFamilyNode.tsx"
    description: "Expandable phonetic family node — phonetic glyph, pinyin, meaning, character count, and expandable member list with ClassificationBadge. Tree EXCEPTION: arrow rotate(90deg) + border-left member rail (see Radical/Phonetic Trees section)."
  - name: "ClusterCard"
    file: "apps/frontend/src/features/phonetic-clusters/components/ClusterCard.tsx"
    description: "Phonetic cluster card — large pattern glyph, pinyin/description, pronunciation note, HSK badges (shared Badge accent variant), a member character grid using the shared Chip component (interactive, opens hub), and a member-count chip using the shared Chip component (non-interactive, count slot)."
  - name: "ConstituentCharacterChips"
    file: "apps/frontend/src/features/word-hub/components/ConstituentCharacterChips.tsx"
    description: "Character chips for a word's constituent characters (glyph + pinyin + meaning) — delegates to the shared Chip component (interactive, surface variant) and opens the Character Detail Hub via openHub."
---

**Last Updated:** 2026-08-02

## Changelog

- **2026-08-05** — Story 22.4 review fixes (N1/N4): `UserMenu`/`AppTopBar` are now auth-free (auth threaded via props from `AppLayout`); removed dead `SideNav` `onNavigate`/`mobile` props and `AppTopBar` `leading` slot; popover is a disclosure-style `role="list"` (N6).
- **2026-08-05** — Story 22.4: added `UserMenu` + `AppTopBar` to the `components:` list (single account control + slim top bar); updated `SideNav` (nav-only, phase-gated Learn group + collapsed rail) and flagged `TopNav` as orphaned (Learn tabs moved to the sidebar Learn group).
- **2026-08-02** — Removed `transition-transform` / `transition-width` from the `components:` list (they are CSS utilities in `animations.css`, not React components); the scope-note claim that all listed components are registered in `.github/component-registry.json` is accurate again.
- **2026-08-02** — Clarified catalog scope note: the `components:` list also includes registered feature/domain components (CharacterHub, HubMnemonicSection, TreeRootNode, BranchNode, PhoneticFamilyNode, ClusterCard, ConstituentCharacterChips) documented in their feature docs/design.md (Decision D1).
- **2026-08-02** — Added top-level **Global Motion Rule** (no animation/transition/transform/pseudo-element except shared component variants + the documented Radical/Phonetic Trees exception).
- **2026-08-01** — Added `CharacterHub` + `HubMnemonicSection` to the `components:` list (decision D3); clarified registry scope (catalogs shared presentational components only — decision D1).

---

## Utility Classes Added

| Class        | Purpose                          |
| ------------ | -------------------------------- |
| `.mt-xs`     | `margin-top: var(--space-xs)`    |
| `.mt-md`     | `margin-top: var(--space-md)`    |
| `.mb-xl`     | `margin-bottom: var(--space-xl)` |
| `.max-w-320` | `max-width: 320px`               |
| `.max-w-450` | `max-width: 450px`               |

---

## Global Motion Rule

**No animation, transition, transform, or pseudo-element motion in feature/component CSS** unless it is one of:

1. A **shared component variant** — interaction styles owned by shared components (`Button`, `Chip`, etc.) and their CSS.
2. The **single documented exception** — the Radical / Phonetic Trees expand/collapse animation (next section).

Concretely: never add `transition:`, `animation:`, `@keyframes`, `transform:`, or `::before`/`::after` motion to feature-local CSS. The only motion resources available are `--transition-fast` (0.2s ease) and `--transition-normal` (0.3s ease) plus the `transition-transform` / `transition-width` utilities in `animations.css` — reserved for shared variants and the tree exception.

---

## Radical / Phonetic Trees — Documented Animation Exception

The Radicals feature (`apps/frontend/src/features/radicals/`) renders mastery trees
(`Phase3TreeView`) and phonetic-family trees (`PhoneticTreeView`) from three
feature-local tree components:

| Component            | File                                | Role                                                        |
| -------------------- | ----------------------------------- | ----------------------------------------------------------- |
| `TreeRootNode`       | `components/TreeRootNode.tsx`       | Mastered radical root with expandable character branches    |
| `BranchNode`         | `components/BranchNode.tsx`         | Character row (glyph/pinyin/meaning) within a branch column |
| `PhoneticFamilyNode` | `components/PhoneticFamilyNode.tsx` | Expandable phonetic family (glyph/pinyin/meaning + members) |

### Why this is an EXCEPTION to the no-animation rule

Tree expand/collapse and hover affordances **require CSS transitions** to read as
tree structure. These are the single documented exception to the global
no-animation rule, scoped to the `.tree-root-node__*` and
`.phonetic-family-node__*` classes only. Everything else (tokens, spacing,
typography) still uses global utilities and DESIGN.md tokens.

### Special styling (component-local, token-based)

| Style                             | Where                                                                                                                                                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tree connector lines              | `BranchNode.css` — `.branch-node__connector` + `.branch-node--with-connector::before` (absolute `::before` rail, directional `border-left`/`border-bottom` in `var(--surface-border)`, corner radius `var(--radius-md)`) |
| Expand/collapse chevron           | `TreeRootNode.css` — `.tree-root-node__chevron--expanded { transform: rotate(90deg) }` with `transition-transform` utility                                                                                               |
| Expand/collapse arrow             | `PhoneticFamilyNode.css` — `.phonetic-family-node__arrow--expanded { transform: rotate(90deg) }` + `transition: transform var(--transition-fast)`                                                                        |
| Branch reveal animation           | `TreeRootNode.css` — `grid-template-rows: 0fr → 1fr` on `.tree-root-node__branches` / `--expanded`                                                                                                                       |
| Member rail                       | `PhoneticFamilyNode.css` — `.phonetic-family-node__members { border-left: 2px solid var(--surface-border) }`                                                                                                             |
| Token hover (header / member row) | `var(--color-primary-bg-light)` background + `var(--radius-md)` on hover (`.phonetic-family-node__header`, `__member-row`, `.branch-node`)                                                                               |
| Toggle hover color                | `TreeRootNode.css` — `.tree-root-node__toggle:hover { color: var(--color-primary-light) }`                                                                                                                               |

All tree components compose shared `Box`/`Button` primitives with utility classes;
the special styles above are the only component-local CSS and are token-driven.

---

## Token Pill Patterns — Single-Feature Local Styles (documented, not shared)

Two inline token styles are used in **exactly one feature** each. Per the
SHARED-ONLY-IF-CROSS-FEATURE rule they stay local (no shared component), but are
documented here as known patterns:

### Bookmark ★ / ☆ (readers library only)

`PassageCard.tsx` — bookmarked state renders `★` with `.text-warning`; the
add-bookmark affordance renders `☆` with `.text-tertiary op-50 hover-op-100`.
Semantics: toggle indicator, not a shared "star badge". The Radicals feature's `★`
is a different semantic (recommended / mastered marker) and is not reused.

### Completion ✓ (readers library only)

`PassageCard.tsx` — completed passages render `✓` with `.text-success` and
`aria-label="Completed"`. Other features' `text-success` (quiz pass/fail,
review results, foundations correct-answer) are conditional correctness states,
not the library completion indicator — not reused.

If a second feature ever needs a bookmark-star or completion-check indicator,
promote it to a shared `Badge`/icon variant at that time (update registry +
this file in the same commit).
