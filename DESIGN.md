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
  spacing: ["8px", "12px", "16px", "24px", "32px", "40px"]
  radii: ["4px", "8px", "12px", "20px"]
  shadows:
    sm: "0 2px 8px rgba(0,0,0,0.3)"
    md: "0 4px 12px rgba(245,158,11,0.2)"
    lg: "0 6px 20px rgba(245,158,11,0.25)"
  transitions:
    fast: "0.2s ease"
    normal: "0.3s ease"
  typography:
    sizes: ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "40px"]
  gradients:
    primary: "linear-gradient(135deg, #B45309 0%, #92400E 100%)"
    success: "linear-gradient(90deg, #34D399 0%, #059669 100%)"
components:
  - name: "Button"
    file: "apps/frontend/src/shared/components/Button/Button.tsx"
    description: "Primary gradient button with hover lift + focus-visible ring"
  - name: "Input"
    file: "apps/frontend/src/shared/components/Input/Input.tsx"
    description: "Styled input with dark theme, focus ring, and error state"
  - name: "LoadingScreen"
    file: "apps/frontend/src/shared/components/LoadingScreen/LoadingScreen.tsx"
    description: "Full-page loading spinner with optional message"
  - name: "ErrorScreen"
    file: "apps/frontend/src/shared/components/ErrorScreen/ErrorScreen.tsx"
    description: "Full-page error display with retry action"
  - name: "ProgressBar"
    file: "apps/frontend/src/shared/components/ProgressBar/ProgressBar.tsx"
    description: "Progress bar with completion celebration animation"
  - name: "FilterChip"
    file: "apps/frontend/src/shared/components/FilterChip/FilterChip.tsx"
    description: "Toggleable filter chip for content filtering"
  - name: "ToggleSwitch"
    file: "apps/frontend/src/shared/components/ToggleSwitch/ToggleSwitch.tsx"
    description: "Toggle switch for binary settings"
  - name: "ContentBrowser"
    file: "apps/frontend/src/shared/components/ContentBrowser/ContentBrowser.tsx"
    description: "Content browser for navigating learning materials"
  - name: "Box"
    file: "apps/frontend/src/shared/components/Box/Box.tsx"
    description: "Generic layout container. Preferred over raw <div>. 20 variants, 7 padding sizes."
  - name: "Modal"
    file: "apps/frontend/src/shared/components/Modal/Modal.tsx"
    description: "Controlled overlay dialog with backdrop, close on Escape, size variants (sm/md/lg)."
  - name: "Card"
    file: "apps/frontend/src/shared/components/Card/Card.tsx"
    description: "Content card with title, subtitle, optional icon/badge/locked state."
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
    description: "Side navigation panel with active state tracking."
  - name: "TopNav"
    file: "apps/frontend/src/shared/components/TopNav/TopNav.tsx"
    description: "Top navigation bar with route-based NavLinks. Phase-gated lock support."
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
  - name: "AnimationCanvas"
    file: "apps/frontend/src/shared/components/CharacterStroke/AnimationCanvas.tsx"
    description: "Canvas-based stroke order animation container."
  - name: "ClassificationBadge"
    file: "apps/frontend/src/shared/components/ClassificationBadge.tsx"
    description: "Pill badge for character classification types (pictograph, phono_semantic, etc.) with color-coded variants."
  - name: "transition-transform"
    file: "apps/frontend/src/styles/animations.css"
    description: "Transition utility for transform property using var(--transition-fast)."
  - name: "transition-width"
    file: "apps/frontend/src/styles/animations.css"
    description: "Transition utility for width property with 0.3s ease."
---

## Utility Classes Added

| Class        | Purpose                          |
| ------------ | -------------------------------- |
| `.mt-xs`     | `margin-top: var(--space-xs)`    |
| `.mt-md`     | `margin-top: var(--space-md)`    |
| `.mb-xl`     | `margin-bottom: var(--space-xl)` |
| `.max-w-320` | `max-width: 320px`               |
| `.max-w-450` | `max-width: 450px`               |
