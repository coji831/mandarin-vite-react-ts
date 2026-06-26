---
name: "PinyinPal Design System"
description: "Design tokens and component specifications for the PinyinPal Mandarin learning platform"
tokens:
  colors:
    primary: ["#667eea", "#764ba2", "#a5b4fc"]
    success: ["#10b981"]
    error: ["#ef4444"]
    warning: ["#fbbf24"]
    info: ["#66dcff", "#3b82f6", "#a855f7"]
    neutral: ["#9ca3af"]
    surface: ["#232a3a", "#1a1d2e", "#1e293b", "#38405a"]
    text:
      [
        "rgba(255,255,255,0.95)",
        "rgba(255,255,255,0.85)",
        "rgba(255,255,255,0.7)",
        "rgba(255,255,255,0.5)",
      ]
    overlay: ["rgba(0,0,0,0.7)"]
    xp: ["#fbbf24"]
  spacing: ["0.5rem", "0.75rem", "1rem", "1.5rem", "2rem", "2.5rem"]
  radii: ["4px", "8px", "12px", "20px"]
  shadows:
    sm: "0 2px 8px rgba(0,0,0,0.2)"
    md: "0 4px 12px rgba(102,126,234,0.3)"
    lg: "0 6px 16px rgba(102,126,234,0.4)"
  transitions:
    fast: "0.2s ease"
    normal: "0.3s ease"
  typography:
    sizes:
      ["0.75rem", "0.875rem", "1rem", "1.125rem", "1.25rem", "1.5rem", "1.75rem", "2rem", "2.5rem"]
  gradients:
    primary: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    success: "linear-gradient(90deg, #10b981 0%, #34d399 100%)"
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
    file: "apps/frontend/src/shared/components/ToggleSwitch.tsx"
    description: "Toggle switch for binary settings"
  - name: "ContentBrowser"
    file: "apps/frontend/src/shared/components/ContentBrowser/ContentBrowser.tsx"
    description: "Content browser for navigating learning materials"
---
