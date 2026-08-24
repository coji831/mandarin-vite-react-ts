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
      border-subtle: "rgba(255,255,255,0.08)" # hairline for elevated surfaces (cards, modal, popovers); --surface-border stays for structural dividers
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
      # Text role tiers (Q4 ADR): [primary, secondary, tertiary, muted, subtle, ghost]
      #   primary/secondary = body text (≥4.5:1) · muted = information-bearing meta (≥4.5:1)
      #   subtle/ghost = decorative-only + large (never placeholder text — SC 1.4.3 requires ≥4.5:1)
      #   muted = 0.6 white on --surface-dark (#262321) ≈ 6.5:1 — meets ≥4.5:1
      [
        "rgba(255,255,255,0.95)",
        "rgba(255,255,255,0.85)",
        "rgba(255,255,255,0.7)",
        "rgba(255,255,255,0.6)",
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
    elevated-1: "0 1px 2px rgba(0,0,0,0.3)" # neutral — resting Browse cards (crisp 1px edge)
    elevated-2: "0 4px 12px rgba(0,0,0,0.35)" # neutral — popovers / dropdowns / box-elevated / card-raised
    elevated-3: "0 12px 32px rgba(0,0,0,0.45)" # neutral — modal surface / future toasts
  transitions:
    fast: "0.2s ease"
    normal: "0.3s ease"
    slow: "0.4s ease" # toggle-switch knob slide — deliberately slower, visible flip affordance
  z-index: # --z-* ladder — stacking order (ascending): content < chrome < popover < modal < toast
    content: 1 # base content layer
    chrome: 10 # app chrome (top bar / side nav)
    popover: 100 # popovers / dropdowns / menus
    modal: 200 # modal overlays
    toast: 300 # toasts (highest)
  typography:
    sizes: ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "40px", "48px"]
    display-tiers-fluid: # --font-3xl..6xl → Utopia-style clamp() (Q5 ADR) — names stable, values fluid
      font-3xl: "clamp(1.75rem, 1.25rem + 1vw, 2rem)" # 28px → 32px
      font-4xl: "clamp(2rem, 1.5rem + 1.25vw, 2.5rem)" # 32px → 40px
      font-5xl: "clamp(2.5rem, 1.75rem + 1.75vw, 3rem)" # 40px → 48px
      font-6xl: "clamp(3rem, 2.25rem + 2vw, 3.75rem)" # 48px → 60px
    line-heights: # --lh-* ladder (Q5) — wired into .lh-* utilities
      lh-1: "1" # legacy leading-none tier
      lh-tight: "1.15"
      lh-normal: "1.5" # body default
      lh-relaxed: "1.6" # long-form prose
      lh-display: "1.08" # display headings
      line-height-display: "var(--lh-display)" # alias
      lh-1-3: "1.3" # legacy tier (HubIdentityCard meaning)
      lh-1-4: "1.4" # legacy tier (ReviewCard full answer)
    font-weights: # --fw-* ladder — wired into .fw-* utilities
      fw-400: "400" # body / default
      fw-500: "500" # medium emphasis
      fw-600: "600" # semibold — buttons, badges, labels
      fw-700: "700" # bold — display emphasis
      fw-800: "800" # extrabold — hero display
    tracking-tight: "-0.02em" # display headings (Latin only — never on hanzi glyphs)
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
    description: "Side navigation panel. Nav-only (auth lives in the AppTopBar UserMenu); phase-gated Learn group + desktop collapsed rail (icons only, no auth chrome)."
  - name: "UserMenu"
    file: "apps/frontend/src/shared/components/UserMenu/UserMenu.tsx"
    description: "Single account control (login/user-info/logout) — avatar trigger + popover (account header, Profile, Settings, Logout); guest state = Login/Register CTAs. Hosted in the AppTopBar so it is reachable at every breakpoint."
  - name: "AppTopBar"
    file: "apps/frontend/src/shared/components/AppTopBar/AppTopBar.tsx"
    description: "Slim global top bar hosting the UserMenu on the right; auth threaded in via props (AppLayout → AppTopBar → UserMenu), no feature import."
  - name: "PageHeader"
    file: "apps/frontend/src/shared/components/PageHeader/PageHeader.tsx"
    description: "Precision-minimal page header (hub-launcher). Renders the page's single <h1> with optional eyebrow, description, and a top-right CTA slot (≤1 primary Button). No border, no background."
  - name: "TopNav"
    file: "apps/frontend/src/shared/components/TopNav/TopNav.tsx"
    description: "Top navigation bar with route-based NavLinks. Phase-gated lock support. (Orphaned — Learn tabs moved to the sidebar Learn group; kept pending cleanup follow-up.)"
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

**Last Updated:** 2026-08-24

## Changelog

- **2026-08-21** — Audit-rule promotion: `utility-duplicate` moved from advisory to **machine-enforced error** in `tools/design-audit.mjs` — local/feature CSS may NOT repeat a global utility class (use `className` instead); shared-component CSS is exempt, and a preceding comment documents an intentional custom override. 252 existing findings queued for later epics (see note under § Utility Classes Added).

- **2026-08-20** — Audit-rule promotion: `z-index-raw` + `elevation-no-hairline` moved from advisory to **machine-enforced errors** in `tools/design-audit.mjs`; noted in § Z-Index Ladder and § Elevation Usage Ladder & Amber Restriction.

- **2026-08-18** — Wave-3 (Icon FE + dashboard demo reconciliation): § Icon System status → **implemented** (shared `Icon` component + `lucide-react ^1.32.0` in `apps/frontend/package.json`); Typography Role Map `h1`/`h2` rows aligned to shipped usage (`h1 = font-2xl/3xl`, `4xl/5xl` reserved hero; `h2 = font-lg/xl`); Global Motion Rule now lists both documented exceptions (Radical/Phonetic Trees + Dashboard quick-tile hover-lift) and adds `--transition-slow` (0.4s — ToggleSwitch) to the motion-resources list.

- **2026-08-18** — Wave 1b-1 (design-system docs layer; owner-voted 2026-08-18): added § Color Roles (semantic role model + text-role tiers + ≤1-saturated-fill budget), § Typography Role Map (display→micro, ADR-009), § Z-Index Ladder, § Icon System (ADR-010 contract), § Spacing & Nesting; documented the new `.lh-*` / `.fw-*` / `.font-3xl..6xl` utilities; formalized the elevation-no-hairline rule; ratified ADR-007–010 (see `docs/guides/design/design-reasoning.md` + `.github/decision-log.json`).

- **2026-08-05** — Story 22.4 review fixes (N1/N4): `UserMenu`/`AppTopBar` are now auth-free (auth threaded via props from `AppLayout`); removed dead `SideNav` `onNavigate`/`mobile` props and `AppTopBar` `leading` slot; popover is a disclosure-style `role="list"` (N6).
- **2026-08-05** — Story 22.4: added `UserMenu` + `AppTopBar` to the `components:` list (single account control + slim top bar); updated `SideNav` (nav-only, phase-gated Learn group + collapsed rail) and flagged `TopNav` as orphaned (Learn tabs moved to the sidebar Learn group).
- **2026-08-02** — Removed `transition-transform` / `transition-width` from the `components:` list (they are CSS utilities in `animations.css`, not React components); the scope-note claim that all listed components are registered in `.github/component-registry.json` is accurate again.
- **2026-08-02** — Clarified catalog scope note: the `components:` list also includes registered feature/domain components (CharacterHub, HubMnemonicSection, TreeRootNode, BranchNode, PhoneticFamilyNode, ClusterCard, ConstituentCharacterChips) documented in their feature docs/design.md (Decision D1).
- **2026-08-02** — Added top-level **Global Motion Rule** (no animation/transition/transform/pseudo-element except shared component variants + the documented Radical/Phonetic Trees exception).
- **2026-08-01** — Added `CharacterHub` + `HubMnemonicSection` to the `components:` list (decision D3); clarified registry scope (catalogs shared presentational components only — decision D1).

---

## Color Roles

PinyinPal uses a **semantic role model** (Carbon-inspired): a color is assigned a _role_ before it is assigned a value, and every role declares which surfaces it may pair with. The role taxonomy:

| Role               | Tokens                                                                     | Allowed on                                           |
| ------------------ | -------------------------------------------------------------------------- | ---------------------------------------------------- |
| **Surface**        | `--surface-dark`, `--surface-light-*`, `--surface-hover`, `--overlay-dark` | background layers                                    |
| **Border**         | `--surface-border` (structural), `--surface-border-subtle` (hairline)      | dividers / elevated-surface edges                    |
| **Text**           | `--text-primary/secondary/muted/subtle/ghost` (role tiers below)           | text on sanctioned surfaces                          |
| **Brand-Accent**   | `--color-primary-*`, `--gradient-primary` (amber)                          | CTAs, active states, emphasis — sparingly            |
| **Status**         | `--success`/`--error`/`--warning`/`--info`/`--neutral` (+ `--tone-1..5`)   | status indicators only — never decoration            |
| **XP-Celebration** | `--xp-*` + `--shadow-xp-glow`                                              | completion/celebration only (see Global Motion Rule) |

### Text-role tiers (ADR-008 / Q4)

Contrast is a **token-pair** property: each text role declares a minimum contrast against `--surface-dark` (#262321), not a bare opacity.

| Tier        | Token              | Value                    | Contrast role                                                      |
| ----------- | ------------------ | ------------------------ | ------------------------------------------------------------------ |
| `primary`   | `--text-primary`   | `rgba(255,255,255,0.95)` | body text — **≥4.5:1**                                             |
| `secondary` | `--text-secondary` | `rgba(255,255,255,0.85)` | body text — **≥4.5:1**                                             |
| `muted`     | `--text-muted`     | `rgba(255,255,255,0.6)`  | information-bearing meta — **≥4.5:1** (≈6.5:1 on `--surface-dark`) |
| `subtle`    | `--text-subtle`    | `rgba(255,255,255,0.2)`  | **decorative-only + large** — never placeholder text               |
| `ghost`     | `--text-ghost`     | `rgba(255,255,255,0.05)` | **decorative-only + large** — never placeholder text               |

Rules:

- **`primary`/`secondary`/`muted` are the only tiers for information-bearing text** (WCAG 2.2 SC 1.4.3 — small text ≥4.5:1).
- **`subtle`/`ghost` are decorative-only** and exempt _by role_ — they must never carry meaning. **Placeholder text must use `muted` (≥4.5:1)** — SC 1.4.3 explicitly covers placeholders.
- **Allowed-pair discipline:** text roles pair only with sanctioned surfaces; status colors signal status, never decoration; a token's role determines its usage, not its hue.

### Saturation budget — ≤1 filled saturated element per viewport (ADR-007/010 / Q10)

The amber budget (Elevation section, A.3) extends to **all saturated fills** (amber, blue, green, purple, status fills): **at most one filled, saturated element per viewport**. Advisory + rubric criterion today (hardens later). Saturated _borders_ and _text accents_ are exempt; emphasis comes from the neutral elevation ladder + a single concentrated accent, never from stacking saturated fills.

## Typography Role Map

One shared role map (consolidating the per-feature type tables in `radicals`/`review`/`quiz` `docs/design.md` — ADR-009). Every type role maps to a `--font-*` size + a `--lh-*` line-height + a `--fw-*` weight; **no raw `font-size`/`line-height`/`font-weight` literals** in component CSS.

| Role      | Size                           | Line-height    | Weight         | Notes                                                                                                                                                                            |
| --------- | ------------------------------ | -------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| display   | `--font-6xl` (fluid `clamp()`) | `--lh-display` | `--fw-800`     | hero — `--tracking-tight` on Latin only                                                                                                                                          |
| h1        | `--font-2xl/3xl`               | `--lh-display` | `--fw-600/700` | page title (shipped: `font-3xl fw-700` PageHeader; `font-2xl fw-600` PhoneticClusters/Profile/Settings) — `--tracking-tight` on Latin only; `4xl/5xl` reserved for hero surfaces |
| h2        | `--font-lg` / `--font-xl`      | `--lh-tight`   | `--fw-600/700` | section heading (e.g. Dashboard sections `font-lg fw-600`)                                                                                                                       |
| h3        | `--font-2xl`                   | `--lh-tight`   | `--fw-600`     | group heading                                                                                                                                                                    |
| body      | `--font-md`                    | `--lh-normal`  | `--fw-400`     | default (matches `:root`)                                                                                                                                                        |
| meta      | `--font-sm` / `--font-xs`      | `--lh-normal`  | `--fw-400/500` | information-bearing — `--text-muted`                                                                                                                                             |
| micro     | `--font-xs`                    | `--lh-normal`  | `--fw-400`     | caption — `--text-subtle` (decorative-only)                                                                                                                                      |
| long-form | `--font-md`                    | `--lh-relaxed` | `--fw-400`     | prose passages                                                                                                                                                                   |

Notes:

- **Fluid display tiers** (`--font-3xl..6xl`, `clamp()`) — names are stable, values scale with the viewport (Utopia-style). `h1` uses `--font-2xl/3xl`; `4xl/5xl` are reserved for hero surfaces; body/meta/micro use the fixed `--font-xs..2xl` steps.
- **`--lh-display` / `--line-height-display`** (1.08) are the display-heading line-height (alias). Legacy tiers `--lh-1` (1) / `--lh-1-3` (1.3) / `--lh-1-4` (1.4) are retained for existing surfaces only — not for new work.
- **`--fw-*` semantics (ADR-009):** `fw-800` = hero display · `fw-700` = display emphasis · `fw-600` = semibold (buttons, badges, labels) · `fw-500` = medium · `fw-400` = body/default.
- **`--tracking-tight`** (−0.02em) applies to Latin display headings only — never on hanzi glyphs.

## Z-Index Ladder

Stacking order is a **named ladder**, never raw values:

| Layer   | Token         | Value | Used for                        |
| ------- | ------------- | ----- | ------------------------------- |
| content | `--z-content` | 1     | base content layer              |
| chrome  | `--z-chrome`  | 10    | app chrome (top bar / side nav) |
| popover | `--z-popover` | 100   | popovers / dropdowns / menus    |
| modal   | `--z-modal`   | 200   | modal overlays                  |
| toast   | `--z-toast`   | 300   | toasts (highest)                |

**Rule:** raw `z-index` is **forbidden** in component CSS — use the `--z-*` ladder only. Pair the ladder with stacking-context discipline (`min-width: 0` on flex/grid children, explicit `isolation` where layers meet).

> **Machine-enforced (error):** `z-index-raw` in `tools/design-audit.mjs` reports any raw `z-index` literal as an **error** — the ladder is enforced by the audit, not just convention.

## Icon System

**Status:** Implemented — the shared `Icon` component and its `lucide-react` dependency (`^1.32.0` in `apps/frontend/package.json`) are in the repo; emoji remains the interim icon set only on surfaces not yet covered by `Icon`.

The icon system is a **Lucide-wrapped `Icon` shared component** (`apps/frontend/src/shared/components/Icon/`). Contract:

| Property   | Contract                                                                        |
| ---------- | ------------------------------------------------------------------------------- |
| Source     | Lucide (ISC license, tree-shakable); record the icon source in DESIGN.md/README |
| Rendering  | `currentColor` — inherits surrounding text color, never a hardcoded fill        |
| Stroke     | 1.5px stroke (Lucide default)                                                   |
| Size       | 16–24px                                                                         |
| Decorative | `aria-hidden="true"` — purely visual, no meaning                                |
| Meaningful | `role="img"` + accessible `title` — carries meaning (WCAG 2.2)                  |

**Emoji rule (ADR-010 / Q8):** emoji is **forbidden** as an icon once a surface is covered by the `Icon` component (nav, recurring actions). Migrate surface-by-surface; a surface is covered → its emoji usage must be replaced in the same change.

## Spacing & Nesting

Spacing runs on the 8px grid (`--space-xs` 8 · `--space-sm` 12 · `--space-md` 16 · `--space-lg` 24 · `--space-xl` 32 · `--space-2xl` 40). **Proximity = hierarchy:** spacing tightens as you nest deeper — the outer shell is the roomiest, the innermost chip the tightest.

| Level         | Padding       | Example                        |
| ------------- | ------------- | ------------------------------ |
| Outer shell   | `p-xl` (32px) | page/section container         |
| Inner section | `p-lg` (24px) | grouped block within the shell |
| Card          | `p-md` (16px) | `Card` / `Box` surfaces        |
| Chip          | `p-xs` (8px)  | `Chip`, `Badge`, inline tokens |

Rules:

- **Nesting tightens:** a child's padding/gap must be ≤ its parent's — a child may never be roomier than its parent.
- **Child gap must not exceed parent gap** (nesting-inversion advisory).
- **12px half-step (`--space-sm`) is sanctioned for dense controls only** (compact rows, filter bars, inline clusters) — not a general spacing step.
- Prefer `.gap-*` / `.p-*` / `.px-*` / `.py-*` utilities over inline `gap:`/`padding:` (design-audit enforces token usage).

---

## Elevation Usage Ladder & Amber Restriction

**Policy (A.2/A.3 — precision-minimal refinement):** the amber `--shadow-md/lg` + `--shadow-xp-glow` are used **only** for (a) hover-lift feedback and (b) XP-completion celebration. All **resting** elevation uses the new neutral family:

| Surface                                                                                  | Elevation                                    | Hairline?                    |
| ---------------------------------------------------------------------------------------- | -------------------------------------------- | ---------------------------- |
| Browse cards (Box `dark`/`card`, quick-access tiles, focal cards)                        | `--shadow-elevated-1`                        | ✅ `--surface-border-subtle` |
| UserMenu popover, Dropdown menu, WordPopover, `box-elevated`, `card-raised`              | `--shadow-elevated-2`                        | ✅                           |
| Modal surface, future toasts                                                             | `--shadow-elevated-3`                        | ✅                           |
| Focus-task surfaces (Review/Quiz task cards)                                             | **none** (flat — ADR-004)                    | ✅ `--surface-border-subtle` |
| Hover-lift (Card/`content-card`/quick tiles/rating/audio/`.hover-lift`/`.hover-lift-md`) | amber `--shadow-md/lg`                       | —                            |
| XP completion (`.progress-fill[100%]`, `ExampleCharCell`)                                | amber `--shadow-md` / `--shadow-xp-glow`     | —                            |
| `--shadow-sm`                                                                            | neutral (retained — compat; `hover-lift-sm`) | —                            |

**Amber-restriction rule (machine-enforced):** every **resting** amber-shadow usage is forbidden; only hover/XP states may carry the amber family. The complete redefinition list (Phase A) is recorded in `docs/guides/design/design-reasoning.md` ADR-007.

> **Machine-enforced (error):** `resting-amber-shadow` in `tools/design-audit.mjs` reports the amber `--shadow-md/lg`/`--shadow-xp-glow` family in any rule that isn't a `:hover` / `.hover-lift*` / XP-completion class as an **error** — the Amber Restriction is enforced by the audit, not just policy.

**Elevation-no-hairline rule (ADR-007):** every elevated surface in the rows above (Browse cards, popovers/dropdowns, modal/toasts) **must carry `--surface-border-subtle`** — an elevation token without its hairline border is a violation. Focus-task flat surfaces (ADR-004) also carry the hairline to separate the task card from the canvas.

> **Machine-enforced (error):** `elevation-no-hairline` in `tools/design-audit.mjs` reports an elevated surface without `--surface-border-subtle` in the same rule as an **error** — the hairline rule is enforced by the audit, not just convention.

## Utility Classes Added

| Class                                                                                        | Purpose                                                                                                     |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `.mt-xs`                                                                                     | `margin-top: var(--space-xs)`                                                                               |
| `.mt-md`                                                                                     | `margin-top: var(--space-md)`                                                                               |
| `.mb-xl`                                                                                     | `margin-bottom: var(--space-xl)`                                                                            |
| `.max-w-320`                                                                                 | `max-width: 320px`                                                                                          |
| `.max-w-450`                                                                                 | `max-width: 450px`                                                                                          |
| `.shadow-elevated-1`                                                                         | `box-shadow: var(--shadow-elevated-1)`                                                                      |
| `.shadow-elevated-2`                                                                         | `box-shadow: var(--shadow-elevated-2)`                                                                      |
| `.shadow-elevated-3`                                                                         | `box-shadow: var(--shadow-elevated-3)`                                                                      |
| `.border-surface-subtle`                                                                     | `border-color: var(--surface-border-subtle)`                                                                |
| `.tracking-tight`                                                                            | `letter-spacing: var(--tracking-tight)`                                                                     |
| `.lh-1` / `.lh-tight` / `.lh-normal` / `.lh-1-3` / `.lh-1-4` / `.lh-relaxed` / `.lh-display` | `line-height: var(--lh-*)` ladder (ADR-009)                                                                 |
| `.fw-400` … `.fw-800`                                                                        | `font-weight: var(--fw-*)` ladder — 400 body / 500 medium / 600 semibold / 700 display / 800 hero (ADR-009) |
| `.font-3xl` … `.font-6xl`                                                                    | `font-size: var(--font-*)` fluid display tiers (`clamp()`) — ADR-009                                        |

> **Machine-enforced (error):** `utility-duplicate` in `tools/design-audit.mjs` reports any local CSS property that repeats one of the global utility classes above as an **error** — prefer the global `className`, don't re-declare tokens in local CSS. Two sanctioned escapes: (1) **shared-component CSS** (`shared/components/`) bundles multi-property variant classes and is exempt; (2) a **custom case** may carry a preceding comment explaining why the local override is needed.

---

## Global Motion Rule

**No animation, transition, transform, or pseudo-element motion in feature/component CSS** unless it is one of:

1. A **shared component variant** — interaction styles owned by shared components (`Button`, `Chip`, etc.) and their CSS.
2. The **two documented exceptions** — (a) the Radical / Phonetic Trees expand/collapse animation (next section) and (b) the Dashboard quick-tile hover-lift (`.dashboard-quick-btn.btn-tag:hover` — `translateY(-2px)` + amber `--shadow-md`, spec D.6; being migrated to the shared `.hover-lift` utility).

Concretely: never add `transition:`, `animation:`, `@keyframes`, `transform:`, or `::before`/`::after` motion to feature-local CSS. The only motion resources available are `--transition-fast` (0.2s ease), `--transition-normal` (0.3s ease), and `--transition-slow` (0.4s ease — ToggleSwitch knob slide) plus the `transition-transform` / `transition-width` utilities in `animations.css` — reserved for shared variants and the two documented exceptions below.

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
tree structure. These are one of the two documented exceptions to the global
no-animation rule (the other is the Dashboard quick-tile hover-lift above),
scoped to the `.tree-root-node__*` and `.phonetic-family-node__*` classes only.
Everything else (tokens, spacing, typography) still uses global utilities and
DESIGN.md tokens.

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
