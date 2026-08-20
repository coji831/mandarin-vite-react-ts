#!/usr/bin/env node

/**
 * design-audit.mjs
 *
 * Static design token compliance scanner for PinyinPal.
 * Checks .tsx and .css files for common design violations.
 *
 * ARCHITECTURE (CSS split):
 *   - globals.css    → tokens (:root vars) + single-property utility classes
 *   - components.css → multi-property component patterns (btn-*, input-base, etc.)
 *   - animations.css → @keyframes + animation/transition utility classes
 *
 * The utility-duplicate check dynamically reads globals.css at runtime
 * to build its property→class map — no hardcoded patterns needed.
 * Shared component CSS (shared/components/) is exempt — those files define
 * intentionally multi-property variant classes (e.g., box-dark, btn-primary)
 * that bundle background + border + radius + shadow together by design.
 *
 * Inline-style gate (replaces the old single-line `inline-style` warning):
 *   - `inline-style-magic-value` (error) — static magic values in `style={{}}`
 *     (px/rem/em, bare numbers, quoted lengths, clamp/calc/min/max/repeat with a
 *     px arg), detected with brace-depth block matching + comment stripping.
 *   - `inline-style-static` (warning) — a `style={{}}` block with zero dynamic
 *     content (e.g. `display: "flex"`, `overflow: "hidden"`).
 *   - Dynamic/var-driven values (identifiers, `${...}`, `%` strings, `var(--`,
 *     `--`-prefixed keys) pass. Spread entries (`...style`) are skipped.
 *
 * Class hygiene (used-but-undefined-class):
 *   Pre-existing undefined classes are frozen in
 *   tools/design-audit.class-baseline.json keyed by `class|file`. A class|file
 *   pair NOT in the baseline is an ERROR (a new typo); a baselined pair is a
 *   warning (legacy debt). Regenerate the baseline only with
 *   `--regenerate-baseline`; guard regrowth in CI with `--check-baseline-shrink`.
 *
 * Wave-1 P0 rules (2026-08-18 — voted UIUX fundamentals decision set Q3/Q4/Q5 +
 * Part-1 #2/#3/#4/#5). Errors where marked; advisories otherwise. The error rules
 * intentionally surface PRE-EXISTING violations on existing code — Wave 2 owns the
 * sweep; this pass only ships the gates:
 *   - hardcoded-line-height (error)            — line-height literal unless var(--lh
 *   - hardcoded-font-weight (error)            — font-weight literal unless .fw-* / var(--
 *   - tone-outside-sanctioned-surface (error)  — var(--tone-1..5) outside tone surfaces
 *   - resting-amber-shadow (error)             — amber shadow in a non-hover/XP rule
 *   - elevation-no-hairline (error)            — --shadow-elevated-* w/o hairline in rule
 *   - z-index-raw (error)                      — raw z-index literal not via var(--z-)
 *   - saturated-fill-overflow (advisory)       — >1 saturated fill in a single file
 *   - display-tracking (advisory)              — display font class without tracking-tight
 *   - nesting-inversion (advisory)             — child gap token ≥ parent gap token
 *   - transition-token-only (advisory)         — raw transition duration literal
 * Rule-level/file-level checks return finding ARRAYS (the per-line loop spreads
 * them); per-line checks return a single finding or null.
 *
 * Usage:
 *   node tools/design-audit.mjs                       # Scan entire frontend
 *   node tools/design-audit.mjs apps/frontend/src/features/character-hub/   # Scope to a feature
 *   node tools/design-audit.mjs --regenerate-baseline # Re-freeze the class baseline
 *   node tools/design-audit.mjs --check-baseline-shrink  # CI guard: baseline never grows
 *
 * Exit codes:
 *   0 = no errors (warnings OK)
 *   1 = errors found
 */

import fs from "node:fs";
import path from "node:path";

// ─── Configuration ───────────────────────────────────────────────────────────

const DEFAULT_PATH = "apps/frontend/src";
const ROOT = process.cwd();
const BASELINE_PATH = path.resolve(ROOT, "tools/design-audit.class-baseline.json");
const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  ".git",
  "__tests__",
  "stories",
  ".storybook",
]);

const SKIP_FILES = new Set([
  ".stories.tsx",
  ".stories.ts",
  ".test.tsx",
  ".test.ts",
  ".spec.tsx",
  ".spec.ts",
]);

// ─── Check Definitions ───────────────────────────────────────────────────────

const CHECKS = {
  hardcodedColors: {
    name: "hardcoded-color",
    severity: "error",
    description: "Hardcoded color value in TSX — use CSS variable instead",
    test: (line, file) => {
      if (!file.endsWith(".tsx")) return null;
      // Match #xxx or #xxxxxx, but not inside comments or CSS variable definitions
      const colorMatch = line.match(/(?<!var\(--)[#][0-9a-fA-F]{3,6}\b/);
      const rgbaMatch = line.match(/rgba?\(/);
      if (colorMatch && !line.trim().startsWith("//") && !line.trim().startsWith("*")) {
        return { line: line, match: colorMatch[0] };
      }
      if (rgbaMatch && !line.trim().startsWith("//") && !line.trim().startsWith("*")) {
        return { line: line, match: line.match(/rgba?\([^)]+\)/)?.[0] || rgbaMatch[0] };
      }
      return null;
    },
  },
  hardcodedSpacing: {
    name: "hardcoded-spacing",
    severity: "error",
    description: "Hardcoded px spacing in CSS — use var(--space-*) instead",
    test: (line, file) => {
      if (!file.endsWith(".css")) return null;
      const patterns = [
        /gap:\s*\d+px/,
        /padding:\s*\d+px/,
        /margin:\s*\d+px/,
        /padding:\s+\d+px/,
        /margin:\s+\d+px/,
      ];
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          // Skip if it's already a variable reference
          if (
            line.includes("var(--space") ||
            line.includes("var(--font") ||
            line.includes("var(--radius")
          )
            continue;
          return { line: line, match: match[0] };
        }
      }
      return null;
    },
  },
  hardcodedFontSize: {
    name: "hardcoded-font-size",
    severity: "error",
    description: "Hardcoded font-size in CSS — use var(--font-*) instead",
    test: (line, file) => {
      if (!file.endsWith(".css")) return null;
      const match = line.match(/font-size:\s*\d+px/);
      if (match && !line.includes("var(--font")) {
        return { line: line, match: match[0] };
      }
      return null;
    },
  },
  consoleLog: {
    name: "console-log",
    severity: "error",
    description: "console.log/warn/error in production code — remove before commit",
    test: (line, file) => {
      if (!file.endsWith(".tsx") && !file.endsWith(".ts")) return null;
      const match = line.match(/console\.(log|warn|error)\s*\(/);
      if (match && !line.trim().startsWith("//")) {
        return { line: line, match: match[0] };
      }
      return null;
    },
  },
  // Inline `style={{...}}` handling moved to the block-aware scanner below —
  // see findInlineStyleIssues() (inline-style-magic-value error +
  // inline-style-static advisory). The single-line regex could not handle
  // multi-line blocks or `${...}` templates.
  todoComment: {
    name: "todo-comment",
    severity: "warning",
    description: "TODO/FIXME/HACK/XXX comment — resolve before commit",
    test: (line, file) => {
      if (!file.endsWith(".tsx") && !file.endsWith(".ts") && !file.endsWith(".css")) return null;
      const match = line.match(/(TODO|FIXME|HACK|XXX)/);
      if (match && (line.includes("//") || line.includes("/*"))) {
        return { line: line, match: match[0] };
      }
      return null;
    },
  },
  missingAriaLabel: {
    name: "missing-aria-label",
    severity: "warning",
    description: "Button with no aria-label or text content — not accessible",
    test: (line, file) => {
      if (!file.endsWith(".tsx")) return null;
      // Look for <button without aria-label and without visible text children
      const buttonMatch = line.match(/<button\s[^>]*>/);
      if (buttonMatch) {
        const hasAria = line.includes("aria-label") || line.includes("aria-labelledby");
        const hasText = line.match(/<button[^>]*>[^<\s]/);
        if (
          !hasAria &&
          (hasText || line.includes("icon") || line.includes("Icon") || line.includes("x"))
        ) {
          return { line: line, match: "<button ...>" };
        }
        // Also flag icon-only buttons: if the button wraps an img/svg and has no aria-label
        if (!hasAria && (line.includes("<svg") || line.includes("<img") || line.includes("icon"))) {
          return { line: line, match: "<button>" };
        }
      }
      return null;
    },
  },
  utilityDuplicate: {
    name: "utility-duplicate",
    severity: "warning",
    description:
      "CSS property duplicates a global utility class — use className instead, or add a comment explaining why local override is needed",
    // Built at startup by parseGlobalsUtilityMap() — see function below
    propertyMap: null,
    test: function (line, file, context) {
      // Only check local CSS files (not globals.css, not components.css, not animations.css)
      if (!file.endsWith(".css")) return null;
      const basename = path.basename(file);
      if (
        basename === "globals.css" ||
        basename === "components.css" ||
        basename === "animations.css"
      )
        return null;

      // Skip shared component CSS — these are intentionally multi-property variant
      // classes that bundle background + border + radius + shadow + padding together
      const isSharedComponent = file.replace(/\\/g, "/").includes("/shared/components/");
      if (isSharedComponent) return null;

      // Lazy-load the utility map on first use
      if (!this.propertyMap) {
        this.propertyMap = parseGlobalsUtilityMap();
      }

      const trimmed = line.trim().replace(/;\s*$/, "").trim();
      const classes = this.propertyMap.get(trimmed);
      if (classes && classes.size > 0) {
        // Check if previous line has a comment explaining the override
        const prevLine = context?.prevLine?.trim() || "";
        const hasComment =
          prevLine.startsWith("/*") || prevLine.startsWith("//") || prevLine.startsWith("*");
        if (!hasComment) {
          const classList = [...classes].join(", ");
          return {
            line: line,
            match: trimmed,
            utility: classList,
          };
        }
      }
      return null;
    },
  },

  // ─── Anti-slop scan (Architect Report 4, item 5) ──────────────────────────
  // Warm-minimalism forbiddance list, converted from prose to a machine gate.
  // Severity `error` (hard-fail), except the advisory heuristics below.
  // Shared-component CSS is the approved library: the sanctioned gradient hosts
  // (Button/ProgressBar) plus the Skeleton shimmer are exempt from the gradient
  // rule; the rhythm heuristics exempt all shared component CSS by design.

  slopGradient: {
    name: "slop-gradient",
    severity: "error",
    description:
      "linear-gradient outside shared Button/ProgressBar/Skeleton — warm-minimalism forbids decorative gradients (anti-slop)",
    test: (line, file) => {
      if (!file.endsWith(".css") && !file.endsWith(".tsx")) return null;
      const basename = path.basename(file);
      // Exempt token definitions + sanctioned utilities in the global css files
      // (--gradient-primary/--gradient-success, .gradient-*, .skeleton-loading).
      if (
        basename === "globals.css" ||
        basename === "components.css" ||
        basename === "animations.css"
      )
        return null;
      // Exempt the sanctioned shared gradient hosts + the skeleton shimmer
      // (a loading-state pattern, not decorative decoration).
      const norm = file.replace(/\\/g, "/");
      if (
        norm.includes("/shared/components/Button/") ||
        norm.includes("/shared/components/ProgressBar/") ||
        norm.includes("/shared/components/Skeleton/")
      )
        return null;
      const match = line.match(/linear-gradient\(/);
      if (match) return { line, match: match[0] };
      return null;
    },
  },
  slopBackdropFilter: {
    name: "slop-backdrop-filter",
    severity: "error",
    description: "backdrop-filter — glassmorphism is forbidden (anti-slop)",
    test: (line, file) => {
      if (!file.endsWith(".css") && !file.endsWith(".tsx")) return null;
      const match = line.match(/backdrop-filter\s*:/);
      if (match) return { line, match: match[0] };
      return null;
    },
  },
  slopBlur: {
    name: "slop-blur",
    severity: "error",
    description: "blur( — glow/glass blur is forbidden unless tokenized (anti-slop)",
    test: (line, file) => {
      if (!file.endsWith(".css") && !file.endsWith(".tsx")) return null;
      const match = line.match(/blur\(/);
      if (match && !line.includes("var(--")) {
        return { line, match: match[0] };
      }
      return null;
    },
  },
  slopUntokenedShadow: {
    name: "slop-untokened-shadow",
    severity: "error",
    description:
      "untokened box-shadow (no var(--shadow-*)) — use elevation tokens; focus rings (0 0 0 Npx) and inset underlines are exempt",
    test: (line, file) => {
      if (!file.endsWith(".css")) return null;
      const basename = path.basename(file);
      if (
        basename === "globals.css" ||
        basename === "components.css" ||
        basename === "animations.css"
      )
        return null;
      const match = line.match(/box-shadow\s*:\s*([^;]+);?/);
      if (!match) return null;
      const value = match[1].trim();
      // Tokenized elevation is the sanctioned path.
      if (value.includes("var(--shadow")) return null;
      // Focus-visible rings (0 0 0 <spread>) and inset underlines are functional,
      // not decorative — exempt.
      if (/^0\s+0\s+0\s/.test(value)) return null;
      if (value.startsWith("inset")) return null;
      // Blur radius <= 1px reads as a focus ring, not a glow — exempt.
      const radius = value.match(/0\s+0\s+(\d+)px/);
      if (radius && Number(radius[1]) <= 1) return null;
      return { line, match: match[0].substring(0, 80) };
    },
  },

  // ─── Advisory heuristics (spacing-role §5.3 + typography-role) ────────────
  // Warning severity only — these must never fail the run.

  slopEmoji: {
    name: "slop-emoji",
    severity: "warning",
    description:
      "emoji codepoint in page JSX — decorative emoji is forbidden (anti-slop). NOTE: shared/feature `icon` slots use emoji as the app's icon system, so this is scoped to the page layer and advisory.",
    test: (line, file) => {
      if (!file.endsWith(".tsx")) return null;
      // Scope to the page layer — the anti-slop gate governs generated page UI.
      if (!file.replace(/\\/g, "/").includes("/pages/")) return null;
      const match = line.match(
        /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{1F1E6}-\u{1F1FF}]/u,
      );
      if (match) return { line, match: match[0] };
      return null;
    },
  },
  uniformGap: {
    name: "uniform-gap",
    severity: "warning",
    description:
      "uniform gap rhythm — one gap value everywhere with no hierarchy (design-reasoning §5.3: sections gap-lg → items gap-sm; never the same gap at different levels)",
    // File-level heuristic; computed once per file via a cache (advisory).
    cache: null,
    test: function (line, file) {
      if (this.cache === null) this.cache = new Map();
      if (this.cache.has(file)) return null;
      this.cache.set(file, true);
      return computeUniformGap(file);
    },
  },
  sizeJump: {
    name: "size-jump",
    severity: "warning",
    description:
      "typography size-jump — display size (font-2xl+) used alongside font-xs/sm with no font-md/lg/xl bridge (typography-role; the flat-hierarchy AI-slop tell)",
    // File-level heuristic; computed once per file via a cache (advisory).
    cache: null,
    test: function (line, file) {
      if (this.cache === null) this.cache = new Map();
      if (this.cache.has(file)) return null;
      this.cache.set(file, true);
      return computeSizeJump(file);
    },
  },

  // ─── Wave-1 P0 rules (2026-08-18 — voted UIUX fundamentals decision set) ───
  // Errors where marked; advisories otherwise. The error rules intentionally
  // surface PRE-EXISTING violations — Wave 2 owns the sweep; this pass ships the
  // gates. Rule-level/file-level checks return finding ARRAYS via the per-file
  // cache; per-line checks return a single finding or null.

  hardcodedLineHeight: {
    name: "hardcoded-line-height",
    severity: "error",
    description: "Hardcoded line-height in CSS — use var(--lh-*) instead",
    test: (line, file) => {
      if (!file.endsWith(".css")) return null;
      const trimmed = line.trim();
      if (trimmed.startsWith("/*") || trimmed.startsWith("*") || trimmed.startsWith("//"))
        return null; // comment-only line
      const match = line.match(/line-height:\s*\d+(?:\.\d+)?(?:px|rem)?/);
      if (match && !line.includes("var(--lh")) {
        return { line: line, match: match[0] };
      }
      return null;
    },
  },
  hardcodedFontWeight: {
    name: "hardcoded-font-weight",
    severity: "error",
    description: "Hardcoded font-weight in CSS/TSX — use the .fw-* utility instead",
    test: (line, file, context) => {
      if (!file.endsWith(".css") && !file.endsWith(".tsx")) return null;
      if (file.endsWith(".css")) {
        const trimmed = line.trim();
        if (trimmed.startsWith("/*") || trimmed.startsWith("*") || trimmed.startsWith("//"))
          return null; // comment-only line
        const match = line.match(/font-weight:\s*\d+/);
        if (!match) return null;
        if (line.includes("var(--")) return null; // tokenized
        const selector = enclosingSelector(context);
        if (!selector) return null;
        if (/\.fw-\d+/.test(selector)) return null; // .fw-* utility definitions (sanctioned home)
        if (/^:root|^html|^body|^\*/.test(selector.trim())) return null; // base document defaults
        return { line: line, match: match[0] };
      }
      // TSX — fontWeight literal in a style object. Inline-style blocks are also
      // covered by inline-style-magic-value; this catches const/spread style objects.
      const tsxMatch = line.match(/fontWeight\s*:\s*["']?\d{3}["']?/);
      if (!tsxMatch) return null;
      if (line.includes("var(--")) return null;
      return { line: line, match: tsxMatch[0] };
    },
  },
  toneOutsideSanctionedSurface: {
    name: "tone-outside-sanctioned-surface",
    severity: "error",
    description:
      "var(--tone-1..5) used outside sanctioned tone surfaces (.box-tone-* / .btn-tone-* / .chip--tone-* / .tone-* utility)",
    test: (line, file, context) => {
      if (!file.endsWith(".css")) return null;
      const trimmed = line.trim();
      if (trimmed.startsWith("/*") || trimmed.startsWith("*") || trimmed.startsWith("//"))
        return null; // comment-only line
      const match = line.match(/var\(--tone-[1-5]\)/);
      if (!match) return null;
      if (path.basename(file) === "globals.css") return null; // token home + .tone-* utilities
      const selector = enclosingSelector(context);
      if (/\.(?:box-tone|btn-tone|chip--tone|tone)-[1-5]/.test(selector)) return null;
      return { line: line, match: match[0] };
    },
  },
  restingAmberShadow: {
    name: "resting-amber-shadow",
    severity: "error",
    description:
      "Amber --shadow-md/lg/xp-glow in a non-hover / non-lift / non-XP rule — amber is hover-lift/XP-only (Amber Restriction A.3)",
    cache: null,
    test: function (line, file) {
      if (!file.endsWith(".css")) return null;
      if (this.cache === null) this.cache = new Map();
      if (this.cache.has(file)) return null;
      this.cache.set(file, true);
      return computeRestingAmberShadow(file);
    },
  },
  elevationNoHairline: {
    name: "elevation-no-hairline",
    severity: "error",
    description:
      "Rule uses --shadow-elevated-* without --surface-border-subtle in the same rule — elevated surfaces get the hairline (Elevation Usage Ladder)",
    cache: null,
    test: function (line, file) {
      if (!file.endsWith(".css")) return null;
      if (this.cache === null) this.cache = new Map();
      if (this.cache.has(file)) return null;
      this.cache.set(file, true);
      return computeElevationNoHairline(file);
    },
  },
  zIndexRaw: {
    name: "z-index-raw",
    severity: "error",
    description: "Raw z-index literal — use var(--z-*) tokens (z-index ladder)",
    test: (line, file) => {
      if (!file.endsWith(".css")) return null;
      if (line.includes("var(--z-")) return null;
      const match = line.match(/z-index\s*:\s*\d+/);
      if (match) return { line: line, match: match[0] };
      return null;
    },
  },
  saturatedFillOverflow: {
    name: "saturated-fill-overflow",
    severity: "warning",
    description:
      ">1 saturated fill (--gradient-* / --color-primary background) in a single file — ≤1 saturated fill per viewport is the budget (signal; human-enforced)",
    cache: null,
    test: function (line, file) {
      if (this.cache === null) this.cache = new Map();
      if (this.cache.has(file)) return null;
      this.cache.set(file, true);
      return computeSaturatedFillOverflow(file);
    },
  },
  displayTracking: {
    name: "display-tracking",
    severity: "warning",
    description:
      "Display heading (font-2xl+) without tracking-tight on the same className — Latin display headings carry tracking-tight (hanzi/emoji glyphs are expected advisory noise)",
    test: (line, file) => {
      if (!file.endsWith(".tsx")) return null;
      const classMatches = line.match(/className="([^"]*)"/g);
      if (!classMatches) return null;
      for (const cls of classMatches) {
        if (/\bfont-(?:2xl|3xl|4xl|5xl|6xl)\b/.test(cls) && !cls.includes("tracking-tight")) {
          return { line: line, match: cls.slice(0, 80) };
        }
      }
      return null;
    },
  },
  nestingInversion: {
    name: "nesting-inversion",
    severity: "warning",
    description:
      "Child gap token ≥ parent gap token in co-located CSS — nesting should tighten spacing (outer lg → inner sm; design-reasoning §5.3)",
    cache: null,
    test: function (line, file) {
      if (!file.endsWith(".css")) return null;
      if (this.cache === null) this.cache = new Map();
      if (this.cache.has(file)) return null;
      this.cache.set(file, true);
      return computeNestingInversion(file);
    },
  },
  transitionTokenOnly: {
    name: "transition-token-only",
    severity: "warning",
    description: "Raw transition duration literal (e.g. 0.3s) — use var(--transition-*) tokens",
    test: (line, file) => {
      if (!file.endsWith(".css")) return null;
      if (line.includes("var(--transition")) return null;
      const match = line.match(/(?:transition|transition-duration)\s*:\s*[^;]*?[\d.]+(?:s|ms)/);
      if (match) return { line: line, match: match[0] };
      return null;
    },
  },
};

// ─── Advisory Heuristic Helpers (file-level) ─────────────────────────────────
// These run once per file (via the uniformGap/sizeJump caches) and return a
// finding-like result or null. Advisory only — never a hard failure.

/** Flat gap rhythm: a file whose gap usage has zero variation (all same token). */
function computeUniformGap(file) {
  const basename = path.basename(file);
  if (basename === "globals.css" || basename === "components.css" || basename === "animations.css")
    return null;
  // Shared component CSS bundles intentional variant classes — exempt from rhythm heuristics.
  if (file.replace(/\\/g, "/").includes("/shared/components/")) return null;

  let content;
  try {
    content = fs.readFileSync(file, "utf-8");
  } catch {
    return null;
  }

  const gapUses = [];
  if (file.endsWith(".css")) {
    const re = /gap\s*:\s*(var\(--space-[\w-]+\))/g;
    let m;
    while ((m = re.exec(content)) !== null) gapUses.push(m[1]);
  } else if (file.endsWith(".tsx")) {
    const re = /className="([^"]*)"/g;
    let m;
    while ((m = re.exec(content)) !== null) {
      for (const cls of m[1].split(/\s+/)) {
        if (/^gap-(xs|sm|md|lg|xl|2xl)$/.test(cls)) gapUses.push(cls);
      }
    }
  }
  if (gapUses.length < 3) return null;
  const unique = new Set(gapUses);
  if (unique.size === 1) {
    return { line: 1, match: `${[...unique][0]} × ${gapUses.length}` };
  }
  return null;
}

/** Typography size-jump: display size + small size with no md/lg/xl bridge. */
function computeSizeJump(file) {
  const basename = path.basename(file);
  if (basename === "globals.css" || basename === "components.css" || basename === "animations.css")
    return null;
  if (file.replace(/\\/g, "/").includes("/shared/components/")) return null;

  let content;
  try {
    content = fs.readFileSync(file, "utf-8");
  } catch {
    return null;
  }

  const sizes = new Set();
  if (file.endsWith(".css")) {
    const re = /font-size\s*:\s*var\(--font-([\w-]+)\)/g;
    let m;
    while ((m = re.exec(content)) !== null) sizes.add(m[1]);
  } else if (file.endsWith(".tsx")) {
    const re = /className="([^"]*)"/g;
    let m;
    while ((m = re.exec(content)) !== null) {
      for (const cls of m[1].split(/\s+/)) {
        const sm = cls.match(/^font-(xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl)$/);
        if (sm) sizes.add(sm[1]);
      }
    }
  }
  if (sizes.size < 2) return null;

  const display = ["2xl", "3xl", "4xl", "5xl", "6xl"];
  const small = ["xs", "sm"];
  const bridge = ["md", "lg", "xl"];
  const hasDisplay = [...sizes].some((s) => display.includes(s));
  const hasSmall = [...sizes].some((s) => small.includes(s));
  const hasBridge = [...sizes].some((s) => bridge.includes(s));
  if (hasDisplay && hasSmall && !hasBridge) {
    return { line: 1, match: [...sizes].join(", ") };
  }
  return null;
}

// ─── Wave-1 P0 Rule Helpers (2026-08-18) ────────────────────────────────────
// Rule-level/file-level heuristics for the Wave-1 gates. These return finding
// ARRAYS (the per-line loop spreads them) or null. Per-line rules (line-height,
// font-weight, tone, z-index, display-tracking, transition) live in CHECKS above.

const GAP_TOKEN_VALUE = { xs: 8, sm: 12, md: 16, lg: 24, xl: 32, "2xl": 40 };

/** Escape a string for safe use inside a RegExp literal. */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Walk back from a declaration line to the enclosing rule selector. */
function enclosingSelector(context) {
  const lines = context?.lines || [];
  const index = context?.index ?? 0;
  for (let k = index; k >= 0; k--) {
    const line = lines[k] || "";
    const brace = line.indexOf("{");
    if (brace !== -1) return line.slice(0, brace).trim();
  }
  return "";
}

/**
 * Parse a CSS file into flat rules [{ selector, body, line }]. At-rule wrappers
 * (@media/@keyframes) are not emitted; their non-at-rule children are. Comments
 * are stripped from bodies so they can't false-positive the token regexes.
 */
function parseCssRules(content) {
  const rules = [];
  const stack = []; // { selector, body, line, isAtRule }
  let buf = "";
  let line = 1;
  for (let k = 0; k < content.length; k++) {
    const ch = content[k];
    if (ch === "\n") line++;
    if (ch === "{") {
      const sel = buf.replace(/\/\*[\s\S]*?\*\//g, "").trim();
      stack.push({ selector: sel, body: "", line, isAtRule: /^@/.test(sel) });
      buf = "";
    } else if (ch === "}") {
      const frame = stack.pop();
      if (frame && !frame.isAtRule && frame.selector) {
        const body = frame.body.replace(/\/\*[\s\S]*?\*\//g, "").trim();
        rules.push({ selector: frame.selector, body, line: frame.line });
      }
      buf = "";
    } else if (stack.length > 0) {
      stack[stack.length - 1].body += ch;
    } else {
      buf += ch;
    }
  }
  return rules;
}

/** Resting amber shadows: --shadow-md/lg/xp-glow in a non-hover/lift/XP rule. */
function computeRestingAmberShadow(file) {
  const basename = path.basename(file);
  if (basename === "globals.css" || basename === "components.css" || basename === "animations.css")
    return null;
  let content;
  try {
    content = fs.readFileSync(file, "utf-8");
  } catch {
    return null;
  }
  const findings = [];
  for (const rule of parseCssRules(content)) {
    if (!/(?:var\(--shadow-(?:md|lg|xp-glow)\))/.test(rule.body)) continue;
    const selector = rule.selector;
    if (/:hover|:focus|:active|\.hover-lift|\.hover-scale/.test(selector)) continue;
    // XP-completion surfaces (Amber Restriction A.3 sanctioned celebration states)
    if (/progress-fill|example-char-cell|pictograph|\.xp-/.test(selector)) continue;
    findings.push({ line: rule.line, match: selector });
  }
  return findings.length ? findings : null;
}

/** Elevated shadow without the hairline in the same rule (Elevation Usage Ladder). */
function computeElevationNoHairline(file) {
  const basename = path.basename(file);
  if (basename === "globals.css" || basename === "animations.css") return null;
  let content;
  try {
    content = fs.readFileSync(file, "utf-8");
  } catch {
    return null;
  }
  const findings = [];
  for (const rule of parseCssRules(content)) {
    if (!/var\(--shadow-elevated-[123]\)/.test(rule.body)) continue;
    if (/var\(--surface-border-subtle\)/.test(rule.body)) continue;
    findings.push({ line: rule.line, match: `${rule.selector} (elevated, no hairline)` });
  }
  return findings.length ? findings : null;
}

/** Saturated fill budget: >1 gradient/primary fill in a single file (signal). */
function computeSaturatedFillOverflow(file) {
  const basename = path.basename(file);
  if (basename === "globals.css" || basename === "components.css" || basename === "animations.css")
    return null;
  let content;
  try {
    content = fs.readFileSync(file, "utf-8");
  } catch {
    return null;
  }
  let count = 0;
  if (file.endsWith(".css")) {
    const re =
      /var\(--gradient-(?:primary|success)\)|background(?:-color)?\s*:\s*var\(--color-primary\)/g;
    count = (content.match(re) || []).length;
  } else if (file.endsWith(".tsx")) {
    const re =
      /var\(--gradient-(?:primary|success)\)|background(?:-color)?\s*:\s*var\(--color-primary\)|bg-gradient-(?:primary|success)/g;
    count = (content.match(re) || []).length;
  }
  if (count > 1) {
    return { line: 1, match: `${count} saturated fill(s) in one file — ≤1 per viewport` };
  }
  return null;
}

/** Nesting-tightens: child gap token ≥ parent gap token (descendant selectors). */
function computeNestingInversion(file) {
  const basename = path.basename(file);
  if (basename === "globals.css" || basename === "components.css" || basename === "animations.css")
    return null;
  let content;
  try {
    content = fs.readFileSync(file, "utf-8");
  } catch {
    return null;
  }
  const withGap = [];
  for (const rule of parseCssRules(content)) {
    const m = rule.body.match(/gap\s*:\s*var\(--space-([\w-]+)\)/);
    if (!m) continue;
    const key = m[1].split(" ")[0];
    if (!(key in GAP_TOKEN_VALUE)) continue;
    withGap.push({ selector: rule.selector, gap: GAP_TOKEN_VALUE[key], line: rule.line });
  }
  if (withGap.length < 2) return null;
  const findings = [];
  for (const parent of withGap) {
    const pm = parent.selector.match(/^\.([\w-]+)$/);
    if (!pm) continue;
    const re = new RegExp(`\\.${escapeRegex(pm[1])}(?=\\s|$)`, "i");
    for (const child of withGap) {
      if (child === parent) continue;
      if (!re.test(child.selector)) continue;
      if (child.gap >= parent.gap) {
        findings.push({
          line: child.line,
          match: `${child.selector} gap ${child.gap}px ≥ parent ${parent.selector} gap ${parent.gap}px`,
        });
      }
    }
  }
  return findings.length ? findings : null;
}

// ─── CSS Variable Registry ───────────────────────────────────────────────────

/** Scan CSS files for all defined CSS variables */
function buildVariableRegistry(files) {
  const variables = new Set();
  for (const file of files) {
    if (!file.endsWith(".css")) continue;
    const content = fs.readFileSync(file, "utf-8");
    const matches = content.matchAll(/--[\w-]+/g);
    for (const m of matches) {
      variables.add(m[0]);
    }
  }
  return variables;
}

// ─── Dead Class Detection ────────────────────────────────────────────────────

/** Find CSS classes defined but never used in TSX */
function findDeadClasses(cssFiles, tsxFiles) {
  const findings = [];
  const allDefined = new Map(); // className -> [files]

  for (const file of cssFiles) {
    const content = fs.readFileSync(file, "utf-8");
    const classMatches = content.matchAll(/\.([\w-]+)\s*\{/g);
    for (const m of classMatches) {
      const cls = m[1];
      // Skip utility classes (defined in globals.css with many usages)
      if (
        cls.startsWith("hover-") ||
        cls.startsWith("btn-") ||
        cls.startsWith("alert-") ||
        cls.startsWith("card-") ||
        cls.startsWith("progress-") ||
        cls.startsWith("input-") ||
        cls.startsWith("overlay") ||
        cls.startsWith("grid-") ||
        cls.startsWith("flex-") ||
        cls.startsWith("text-") ||
        cls.startsWith("bg-") ||
        cls.startsWith("border-") ||
        cls.startsWith("p-") ||
        cls.startsWith("gap-") ||
        cls.startsWith("fw-") ||
        cls.startsWith("op-") ||
        cls.startsWith("disabled") ||
        cls.startsWith("radius-") ||
        cls.startsWith("shadow-") ||
        cls.startsWith("relative") ||
        cls.startsWith("absolute") ||
        cls.startsWith("fixed") ||
        cls.startsWith("w-") ||
        cls.startsWith("height-") ||
        cls.startsWith("self-") ||
        cls.startsWith("items-") ||
        cls.startsWith("justify-") ||
        cls.startsWith("outline-") ||
        cls.startsWith("inline-") ||
        cls.startsWith("whitespace-") ||
        cls.startsWith("z-") ||
        cls.startsWith("cursor-") ||
        cls.startsWith("overflow-") ||
        cls.startsWith("object-") ||
        cls.startsWith("pointer-") ||
        cls === "btn-base" ||
        cls === "hover-lift" ||
        cls === "hover-lift-sm" ||
        cls === "hover-lift-md" ||
        cls === "hover-scale" ||
        cls === "card-interactive" ||
        cls === "overlay" ||
        cls === "progress-container" ||
        cls === "progress-text" ||
        cls === "progress-bar" ||
        cls === "progress-fill" ||
        cls === "text-white" ||
        cls === "radius-full" ||
        cls === "inline-block" ||
        cls === "text-left" ||
        cls === "whitespace-nowrap" ||
        cls === "flex-shrink-0" ||
        cls === "border-top-default" ||
        cls === "border-bottom-default" ||
        cls === "border-right-default" ||
        cls === "border-left-default" ||
        cls === "bg-surface-light-5" ||
        cls === "bg-surface-light-10" ||
        cls === "flex-align-center"
      ) {
        continue;
      }
      if (!allDefined.has(cls)) {
        allDefined.set(cls, []);
      }
      allDefined.get(cls).push(file);
    }
  }

  // Collect all className usages from TSX
  const usedClasses = new Set();
  for (const file of tsxFiles) {
    const content = fs.readFileSync(file, "utf-8");
    const usageMatches = content.matchAll(/className="([^"]*)"/g);
    for (const m of usageMatches) {
      const classes = m[1].split(/\s+/);
      for (const c of classes) {
        usedClasses.add(c);
      }
    }
  }

  // Find dead classes
  for (const [cls, files] of allDefined) {
    if (!usedClasses.has(cls)) {
      for (const file of files) {
        findings.push({
          file,
          line: 1,
          severity: "warning",
          check: "dead-class",
          message: `Dead CSS class ".${cls}" defined but never used in any TSX file`,
        });
      }
    }
  }

  return findings;
}

// ─── Used-but-Undefined Class Detection ──────────────────────────────────────

// Allowlist for classes used in static `className="..."` strings that are injected
// by third-party libraries at runtime (so they are intentionally NOT defined in
// repo CSS). Kept minimal — populate ONLY when a full scan proves a real false
// positive. Static className scanning cannot see template-literal classNames.
const USED_CLASS_ALLOWLIST = new Set([
  // (empty until a full scan proves lib-injected classes exist)
]);

/**
 * Find classes used in static `className="..."` strings that are NOT defined
 * anywhere in repo CSS (REVERSE of the dead-class check). Catches typos and
 * copy-paste leftovers such as `btn-outline`, which silently render unstyled
 * because no rule defines them.
 *
 * Scope (honest limits):
 *  - Only STATIC className strings are seen (e.g. `className="btn btn-sm"`);
 *    template-literal / computed classNames (`` `btn ${cond ? "x" : "y"}` ``)
 *    are out of scope.
 *  - Classes injected by third-party libs (not in repo CSS) need an entry in
 *    USED_CLASS_ALLOWLIST to avoid false positives.
 *
 * BASELINE (frozen — see tools/design-audit.class-baseline.json): pre-existing
 * undefined-class debt is snapshotted keyed by `class|file` (line-independent,
 * robust to reordering). Severity:
 *   - `error`   — the class|file pair is NOT in the baseline (a NEW typo, in
 *                 any file) → hard gate failure;
 *   - `warning` — the pair IS baselined (legacy debt) → gate stays green.
 * A baselined class used in a NEW file is an error — legacy slop can't leak
 * into new code. The baseline is deliberately FROZEN: no runtime code path can
 * add to it. Regenerate only via `--regenerate-baseline`; guard regrowth in CI
 * with `--check-baseline-shrink`. When the baseline is deleted (debt cleared)
 * every undefined class is an error.
 */
function findUsedButUndefinedClasses(tsxFiles, allCssFiles, baseline) {
  // Register every class defined in repo CSS (globals, components, animations,
  // shared components, feature CSS). No skip list here — unlike the dead-class
  // check, every defined rule counts as "defined" for this direction.
  //
  // Class extraction is deliberately broad: it matches every `.class` token in
  // the raw CSS (not just `\.name {` rules) so grouped/compound/descendant
  // selectors (`.a, .b`, `.parent .child`) and CSS-escaped names
  // (`disabled\:op-40` → `disabled:op-40`) are all registered. Over-registration
  // is safe here — a class mentioned in ANY selector is "defined" — whereas the
  // naive rule-only regex produced false positives on grouped selectors.
  const definedClasses = new Set();
  const classTokenRegex = /\.((?:\\.|[A-Za-z0-9_-])+)/g;
  for (const file of allCssFiles) {
    const content = fs.readFileSync(file, "utf-8");
    const classMatches = content.matchAll(classTokenRegex);
    for (const m of classMatches) {
      // Unescape CSS escapes: `hover\:border-error` → `hover:border-error`
      definedClasses.add(m[1].replace(/\\(.)/g, "$1"));
    }
  }

  // class → Set<relativeFile> (deduped per class|file pair, first line retained)
  const classFiles = new Map();
  const firstLine = new Map();
  for (const file of tsxFiles) {
    const content = fs.readFileSync(file, "utf-8");
    const lines = content.split("\n");
    const relativePath = path.relative(ROOT, file).replace(/\\/g, "/"); // POSIX for cross-platform baseline

    for (let i = 0; i < lines.length; i++) {
      const usageMatches = lines[i].matchAll(/className="([^"]*)"/g);
      for (const m of usageMatches) {
        for (const c of m[1].split(/\s+/)) {
          if (!c) continue;
          if (USED_CLASS_ALLOWLIST.has(c)) continue;
          if (definedClasses.has(c)) continue;
          const pairKey = `${c}|${relativePath}`;
          if (firstLine.has(pairKey)) continue; // one finding per class|file pair
          firstLine.set(pairKey, i + 1);
          if (!classFiles.has(c)) classFiles.set(c, new Set());
          classFiles.get(c).add(relativePath);
        }
      }
    }
  }

  const findings = [];
  for (const [cls, files] of classFiles) {
    for (const file of files) {
      // Baselines are FROZEN: no runtime code path may add to them. A pair in
      // the baseline is legacy debt (warning); anything else is a NEW typo
      // (error), even for a baselined class used in a new file.
      const baselined = baseline?.has(cls) && baseline.get(cls).has(file);
      findings.push({
        file,
        line: firstLine.get(`${cls}|${file}`) ?? 1,
        severity: baselined ? "warning" : "error",
        check: "used-but-undefined-class",
        message: `Used CSS class "${cls}" is not defined in any CSS file`,
      });
    }
  }

  return { findings, classFiles };
}

// ─── Undefined CSS Variable Detection ────────────────────────────────────────

function findUndefinedVariables(allFiles, registry) {
  const findings = [];

  for (const file of allFiles) {
    if (!file.endsWith(".tsx") && !file.endsWith(".css")) continue;
    const content = fs.readFileSync(file, "utf-8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const varMatches = line.matchAll(/var\((--[\w-]+)\)/g);
      for (const m of varMatches) {
        if (!registry.has(m[1])) {
          findings.push({
            file,
            line: i + 1,
            severity: "error",
            check: "undefined-variable",
            message: `Undefined CSS variable "${m[1]}" — not found in any CSS file`,
          });
        }
      }
    }
  }

  return findings;
}

// ─── Utility Class Map (parsed from globals.css) ────────────────────────────

/**
 * Parse globals.css to build a dynamic map of CSS property → utility class name(s).
 * This replaces the previous hardcoded pattern list — any utility added to
 * globals.css is automatically detected.
 *
 * Returns: Map<string, Set<string>>
 *   Key:   "property: value"  (e.g. "gap: var(--space-xs)")
 *   Value: Set of utility class names (e.g. {"gap-xs"})
 */
function parseGlobalsUtilityMap() {
  const globalsPath = path.resolve(ROOT, "apps/frontend/src/styles/globals.css");
  if (!fs.existsSync(globalsPath)) {
    console.warn("[design-audit] globals.css not found — utility-duplicate check disabled");
    return new Map();
  }

  const content = fs.readFileSync(globalsPath, "utf-8");
  // Strip CSS comments first so they don't pollute selectors
  const cleanContent = content.replace(/\/\*[\s\S]*?\*\//g, "");
  const map = new Map(); // "prop: value" → Set of class names

  // Match each CSS rule block: selector { ... }
  const ruleRegex = /([^{]+)\{([^}]*)\}/g;
  let match;
  while ((match = ruleRegex.exec(cleanContent)) !== null) {
    const rawSelector = match[1].trim();
    const body = match[2].trim();
    // Strip any remaining CSS comments from selector
    const selector = rawSelector.replace(/\/\*[\s\S]*?\*\//g, "").trim();
    if (!selector) continue;

    // Skip :root, @media, @import, @keyframes, and raw tag selectors
    if (
      selector.startsWith(":") ||
      selector.startsWith("@") ||
      selector === "*" ||
      selector.startsWith("html") ||
      selector.startsWith("body")
    ) {
      continue;
    }

    // Skip pseudo-class/element/attribute selectors (can't replace with className)
    if (
      selector.includes(":hover") ||
      selector.includes(":focus") ||
      selector.includes(":disabled") ||
      selector.includes(":active") ||
      selector.includes(":focus-visible") ||
      selector.includes("::") ||
      selector.includes("[open]") ||
      selector.includes("[data-") ||
      selector.match(/\[(style|class|rating|role|type|aria-)/)
    ) {
      continue;
    }

    // Skip compound or combinator selectors (",", ">", "+", "~", " ")
    // Allow simple descendant for things like .parent .child pattern
    if (
      selector.includes(",") ||
      selector.includes(">") ||
      selector.includes("+") ||
      selector.includes("~")
    ) {
      continue;
    }

    // Extract class name — must be a simple `.className`
    const classMatch = selector.match(/^\.([\w\\-]+)$/);
    if (!classMatch) continue;

    let className = classMatch[1];
    // Unescape CSS escapes: `hover\:border-error` → `hover:border-error`
    className = className.replace(/\\(.)/g, "$1");

    // Parse individual declarations from the body
    const decls = body.split(";");
    for (const decl of decls) {
      const trimmedDecl = decl.trim();
      if (!trimmedDecl) continue;

      const colonIdx = trimmedDecl.indexOf(":");
      if (colonIdx === -1) continue;

      const prop = trimmedDecl.substring(0, colonIdx).trim();
      const value = trimmedDecl.substring(colonIdx + 1).trim();
      if (!prop || !value) continue;

      const key = `${prop}: ${value}`;
      if (!map.has(key)) {
        map.set(key, new Set());
      }
      map.get(key).add(className);
    }
  }

  return map;
}

// ─── Inline Style Block Detection ───────────────────────────────────────────
// Replaces the old single-line `/style=\{\{(.*?)\}\}/` regex (removed from CHECKS
// above). Brace-depth counting consumes the whole `style={{ ... }}` block, so
// multi-line objects, `${...}` template literals, and nested object spreads are
// handled; `//` and `/* */` comments are masked before value analysis; spread
// entries (`...x`) are skipped (only explicit `key: value` pairs are analyzed).
//
// Per-property decision table:
//   PASS    — key starts with `--` (CSS var key, e.g. `--accent-color`)
//           — value contains `var(--`
//           — value is dynamic: contains `${`, is a bare identifier (`color`,
//             `pct`, `gridCols`), a member/call expression (`TONE_COLORS[i]`,
//             `Math.max(value, 4)`), a ternary, or a `%` string (`"100%"`,
//             `` `${pct}%` ``)
//   ERROR   — value contains a static literal: `\d+px` / `\d+rem` / `\d+em`,
//             a bare `\d+` (`8`, `320`, `1000`), a quoted length (`"0.25rem"`,
//             `"clamp(...)"`, `"40px"`), or `clamp()/calc()/min()/max()/repeat()`
//             with a px arg — even if it ALSO contains `${`
//             (`` `40px repeat(${initials.length}, 40px)` ``). A quoted length
//             nested inside a ternary/call also counts (e.g. Skeleton's
//             `width ?? (variant === "circle" ? "40px" : "100%")`). Bare digits
//             that are call args (`Math.max(value, 4)`) are NOT quoted → pass.
//   STATIC  — no magic literal and zero dynamic content (`display: "flex"`,
//             `overflow: "hidden"`) → `inline-style-static` advisory warning
//
// Out of scope (documented, not scanned):
//   - template-literal / computed `className`
//   - `clsx` / `cn` / array className composition
//   - runtime third-party classes (handled by USED_CLASS_ALLOWLIST)
//   - style objects defined in `const` and spread in (`...style` — the
//     Button/Box style-prop passthrough is covered because spreads are skipped)

const IDENTIFIER_RE = /^[A-Za-z_$][\w$]*$/;
const STATIC_LITERAL_RE = /[\d.]+(?:px|rem|em\b)?/;

/** Skip a quoted string starting at j (content[j] is the quote char). */
function skipString(content, j) {
  const quote = content[j];
  j++;
  while (j < content.length) {
    if (content[j] === "\\") {
      j += 2;
      continue;
    }
    if (content[j] === quote) return j + 1;
    j++;
  }
  return j;
}

/** Skip a template literal starting at j (content[j] is a backtick); handles `${...}`. */
function skipTemplateLiteral(content, j) {
  j++;
  while (j < content.length) {
    if (content[j] === "\\") {
      j += 2;
      continue;
    }
    if (content[j] === "`") return j + 1;
    if (content[j] === "$" && content[j + 1] === "{") {
      j = scanBracedExpression(content, j + 2);
      continue;
    }
    j++;
  }
  return j;
}

/** Scan a braced expression from j (just after `{`) to its matching `}`, returning j past it. */
function scanBracedExpression(content, j) {
  let depth = 1;
  while (j < content.length) {
    const ch = content[j];
    const next = content[j + 1];
    if (ch === '"' || ch === "'") {
      j = skipString(content, j);
      continue;
    }
    if (ch === "`") {
      j = skipTemplateLiteral(content, j);
      continue;
    }
    if (ch === "/" && next === "/") {
      while (j < content.length && content[j] !== "\n") j++;
      continue;
    }
    if (ch === "/" && next === "*") {
      j += 2;
      while (j < content.length && !(content[j] === "*" && content[j + 1] === "/")) j++;
      j += 2;
      continue;
    }
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) return j + 1;
    }
    j++;
  }
  return j;
}

/** Scan a `style={{ ... }}` block from `start` (just past `style={{`) to the matching inner `}`. */
function scanStyleBlock(content, start) {
  let depth = 0;
  let j = start;
  while (j < content.length) {
    const ch = content[j];
    const next = content[j + 1];
    if (ch === '"' || ch === "'") {
      j = skipString(content, j);
      continue;
    }
    if (ch === "`") {
      j = skipTemplateLiteral(content, j);
      continue;
    }
    if (ch === "/" && next === "/") {
      while (j < content.length && content[j] !== "\n") j++;
      continue;
    }
    if (ch === "/" && next === "*") {
      j += 2;
      while (j < content.length && !(content[j] === "*" && content[j + 1] === "/")) j++;
      j += 2;
      continue;
    }
    if (ch === "{") depth++;
    if (ch === "}") {
      if (depth === 0) return j; // inner object closed → end of the style block (exclusive)
      depth--;
    }
    j++;
  }
  return -1;
}

/** Find all complete `style={{ ... }}` blocks; returns [{ start, end }] offsets in `content`. */
function findStyleBlocks(content) {
  const blocks = [];
  const needle = "style={{";
  let i = 0;
  while (i < content.length) {
    const idx = content.indexOf(needle, i);
    if (idx === -1) break;
    const end = scanStyleBlock(content, idx + needle.length);
    if (end === -1) {
      i = idx + needle.length;
      continue;
    }
    blocks.push({ start: idx + needle.length, end });
    i = end;
  }
  return blocks;
}

/** Mask line comments (`//…`) and block comments (slash-star … star-slash) with spaces — preserves offsets & newlines, skips strings/templates. */
function maskComments(text) {
  let out = "";
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    const next = text[i + 1];
    if (ch === '"' || ch === "'") {
      const end = skipString(text, i);
      out += text.slice(i, end);
      i = end;
      continue;
    }
    if (ch === "`") {
      const end = skipTemplateLiteral(text, i);
      out += text.slice(i, end);
      i = end;
      continue;
    }
    if (ch === "/" && next === "/") {
      while (i < text.length && text[i] !== "\n") {
        out += " ";
        i++;
      }
      continue;
    }
    if (ch === "/" && next === "*") {
      out += "  ";
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) {
        out += text[i] === "\n" ? "\n" : " ";
        i++;
      }
      if (i < text.length) {
        out += "  ";
        i += 2;
      }
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

/** Split a style block body into top-level entries at depth-0 commas (string/template-aware). */
function splitTopLevel(text) {
  const entries = [];
  let depth = 0;
  let start = 0;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"' || ch === "'") {
      i = skipString(text, i);
      continue;
    }
    if (ch === "`") {
      i = skipTemplateLiteral(text, i);
      continue;
    }
    if (ch === "{") depth++;
    if (ch === "}") depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0) {
      entries.push({ text: text.slice(start, i), start });
      start = i + 1;
    }
    i++;
  }
  entries.push({ text: text.slice(start), start });
  return entries;
}

/** First depth-0 colon index (string/template-aware), or -1. */
function findTopLevelColon(text) {
  let depth = 0;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"' || ch === "'") {
      i = skipString(text, i);
      continue;
    }
    if (ch === "`") {
      i = skipTemplateLiteral(text, i);
      continue;
    }
    if (ch === "{") depth++;
    if (ch === "}") depth = Math.max(0, depth - 1);
    if (ch === ":" && depth === 0) return i;
    i++;
  }
  return -1;
}

/** Static text of a template literal (content outside `${...}` interpolation). */
function templateStaticText(tpl) {
  let out = "";
  let i = 0;
  while (i < tpl.length) {
    if (tpl.startsWith("${", i)) {
      i = scanBracedExpression(tpl, i + 2);
      continue;
    }
    out += tpl[i];
    i++;
  }
  return out;
}

/**
 * Does the value contain a QUOTED length/number literal anywhere — including
 * nested inside a ternary/call (e.g. Skeleton's `"40px"` branch)? Excludes
 * pure `%` strings (`"100%"`) which are dynamic. Bare digits that are call
 * arguments (`Math.max(value, 4)`) are NOT quoted, so they still pass.
 */
function containsQuotedLength(v) {
  const re = /"([^"]*)"|'([^']*)'/g;
  let m;
  while ((m = re.exec(v)) !== null) {
    const inner = (m[1] ?? m[2] ?? "").trim();
    if (/^[\d.]+%$/.test(inner)) continue; // "100%" — dynamic percent string
    if (STATIC_LITERAL_RE.test(inner)) return true;
  }
  return false;
}

/** Classify a single `key: value` pair — "pass" | "magic" | "static" (see decision table above). */
function classifyValue(key, value) {
  const v = value.trim();
  if (key.startsWith("--")) return "pass"; // CSS-var key
  if (v.includes("var(--")) return "pass"; // var-driven value
  // Quoted length/number literal anywhere (even in a ternary branch) → magic
  if (containsQuotedLength(v)) return "magic";
  if (v.startsWith("`")) {
    // Template literal — magic only from static text outside `${...}`
    if (STATIC_LITERAL_RE.test(templateStaticText(v))) return "magic";
    return "pass"; // dynamic template
  }
  if (v.startsWith('"') || v.startsWith("'")) {
    const inner = v.slice(1, -1).trim();
    if (/^[\d.]+%$/.test(inner)) return "pass"; // "100%"
    return "static"; // "flex", "hidden", "center", "none" (quoted lengths already caught above)
  }
  if (/^\d+$/.test(v) || /^\d*\.\d+$/.test(v)) return "magic"; // bare number: 8, 320, 1000
  if (v.includes("${") || IDENTIFIER_RE.test(v) || /[A-Za-z_$]/.test(v)) return "pass"; // dynamic expr
  return "static";
}

/** 1-based line number of a character offset in `content`. */
function lineOfOffset(content, offset) {
  let line = 1;
  const max = Math.min(offset, content.length);
  for (let k = 0; k < max; k++) if (content[k] === "\n") line++;
  return line;
}

/** Scan all TSX files for inline-style issues (magic-value errors + static-only warnings). */
function findInlineStyleIssues(tsxFiles) {
  const findings = [];
  for (const file of tsxFiles) {
    const content = fs.readFileSync(file, "utf-8");
    const relativePath = path.relative(ROOT, file).replace(/\\/g, "/"); // POSIX for consistent reporting
    for (const block of findStyleBlocks(content)) {
      const masked = maskComments(content.slice(block.start, block.end));
      const props = [];
      for (const entry of splitTopLevel(masked)) {
        const text = entry.text.trim();
        if (!text) continue;
        if (text.startsWith("...")) continue; // spread — const-defined / passthrough, out of scope
        const colonIdx = findTopLevelColon(text);
        const key =
          colonIdx === -1
            ? ""
            : text
                .slice(0, colonIdx)
                .trim()
                .replace(/^["']|["']$/g, "");
        const value = colonIdx === -1 ? text : text.slice(colonIdx + 1).trim();
        props.push({
          key,
          value,
          verdict: classifyValue(key, value),
          line: lineOfOffset(content, block.start + entry.start),
        });
      }
      const hasMagic = props.some((p) => p.verdict === "magic");
      if (hasMagic) {
        for (const p of props) {
          if (p.verdict !== "magic") continue;
          const match = `${p.key}: ${p.value}`;
          const truncated = match.length > 80 ? `${match.slice(0, 80)}…` : match;
          findings.push({
            file: relativePath,
            line: p.line,
            severity: "error",
            check: "inline-style-magic-value",
            message: `Inline style contains static magic value "${truncated}" — use a global utility or co-located CSS class (dynamic/var-driven values only)`,
          });
        }
      } else {
        const staticProps = props.filter((p) => p.verdict === "static");
        const hasDynamic = props.some((p) => p.verdict === "pass");
        if (staticProps.length > 0 && !hasDynamic) {
          const first = staticProps[0];
          const match = staticProps.map((p) => `${p.key}: ${p.value}`).join(", ");
          const truncated = match.length > 80 ? `${match.slice(0, 80)}…` : match;
          findings.push({
            file: relativePath,
            line: first.line,
            severity: "warning",
            check: "inline-style-static",
            message: `Inline style block is fully static ("${truncated}") — move to a utility or co-located CSS class`,
          });
        }
      }
    }
  }
  return findings;
}

// ─── File Scanning ──────────────────────────────────────────────────────────

function* walkFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      yield* walkFiles(fullPath);
    } else if (entry.isFile()) {
      yield fullPath;
    }
  }
}

function isSkipFile(filePath) {
  const basename = path.basename(filePath);
  for (const skip of SKIP_FILES) {
    if (basename.endsWith(skip) || basename === skip) return true;
  }
  return false;
}

/** Load the frozen class baseline (tools/design-audit.class-baseline.json) → Map<class, Set<file>>. */
function loadBaseline() {
  if (!fs.existsSync(BASELINE_PATH)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf-8"));
    const map = new Map();
    for (const [cls, files] of Object.entries(data)) {
      map.set(cls, new Set(Array.isArray(files) ? files : []));
    }
    return map;
  } catch (err) {
    console.warn(`[design-audit] Could not read baseline ${BASELINE_PATH}: ${err.message}`);
    return null;
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const regenerateBaseline = args.includes("--regenerate-baseline");
  const checkBaselineShrink = args.includes("--check-baseline-shrink");
  const positional = args.filter((a) => !a.startsWith("--"));
  const targetDir = path.resolve(ROOT, positional[0] || DEFAULT_PATH);

  if (!fs.existsSync(targetDir)) {
    console.error(`❌ Path not found: ${targetDir}`);
    process.exit(1);
  }

  console.log(`\n🔍 Design Audit: ${path.relative(ROOT, targetDir)}\n`);

  // Collect files
  const tsxFiles = [];
  const cssFiles = [];
  const tsFiles = [];
  const allFiles = [];

  for (const filePath of walkFiles(targetDir)) {
    if (isSkipFile(filePath)) continue;
    const relativePath = path.relative(ROOT, filePath);
    allFiles.push(filePath);
    if (filePath.endsWith(".tsx")) tsxFiles.push(filePath);
    else if (filePath.endsWith(".css")) cssFiles.push(filePath);
    else if (filePath.endsWith(".ts") && !filePath.endsWith(".d.ts")) tsFiles.push(filePath);
  }

  console.log(`  Files: ${tsxFiles.length} TSX, ${cssFiles.length} CSS, ${tsFiles.length} TS`);

  // Build variable registry from all CSS files
  const allCssFiles = [];
  for (const filePath of walkFiles(path.resolve(ROOT, "apps/frontend/src/styles"))) {
    if (filePath.endsWith(".css")) allCssFiles.push(filePath);
  }
  const registry = buildVariableRegistry([...cssFiles, ...allCssFiles]);

  // Run checks
  const findings = [];

  // Per-line checks
  const scanFiles = [...tsxFiles, ...cssFiles, ...tsFiles];
  for (const filePath of scanFiles) {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const relativePath = path.relative(ROOT, filePath);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const prevLine = i > 0 ? lines[i - 1] : "";

      for (const [, check] of Object.entries(CHECKS)) {
        const context = { prevLine, lines, index: i };
        const result = check.test(line, filePath, context);
        if (!result) continue;
        // Rule-level/file-level checks return finding ARRAYS carrying a numeric
        // `line` (the rule's line); per-line checks return a single finding whose
        // `line` field is the LINE TEXT (legacy — position is always i + 1).
        const isArray = Array.isArray(result);
        const results = isArray ? result : [result];
        for (const r of results) {
          const msg = r.utility
            ? `${check.description}: "${r.match}" → use className="${r.utility}"`
            : `${check.description}: "${r.match}"`;
          findings.push({
            file: relativePath,
            line: isArray ? (r.line ?? i + 1) : i + 1,
            severity: check.severity,
            check: check.name,
            message: msg,
          });
        }
      }
    }
  }

  // Dead class detection (feature-level CSS only)
  const featureCssFiles = cssFiles.filter((f) => f.includes("features"));
  const deadClassFindings = findDeadClasses(featureCssFiles, tsxFiles);
  findings.push(...deadClassFindings);

  // Used-but-undefined class detection (baseline-aware — see function docs).
  // The class baseline is FROZEN (tools/design-audit.class-baseline.json):
  // baselined class|file pairs → warning (legacy debt); anything else → error.
  const baseline = loadBaseline();
  const { findings: undefinedClassFindings, classFiles } = findUsedButUndefinedClasses(
    tsxFiles,
    [...cssFiles, ...allCssFiles],
    baseline,
  );
  findings.push(...undefinedClassFindings);

  // Inline-style block scan (static magic values = error, static-only = warning)
  const inlineStyleFindings = findInlineStyleIssues(tsxFiles);
  findings.push(...inlineStyleFindings);

  // Undefined variable detection
  const undefinedVarFindings = findUndefinedVariables(scanFiles, registry);
  findings.push(...undefinedVarFindings);

  // ─── Baseline lifecycle flags ─────────────────────────────────────────────
  // --regenerate-baseline: freeze the CURRENT undefined-class usage into the
  // baseline file (deliberate action only — freezing new debt hides it).
  if (regenerateBaseline) {
    const out = {};
    for (const [cls, files] of classFiles) {
      out[cls] = [...files].sort();
    }
    fs.writeFileSync(BASELINE_PATH, JSON.stringify(out, null, 2) + "\n");
    let pairs = 0;
    const distinctFiles = new Set();
    for (const files of classFiles.values()) {
      for (const f of files) {
        distinctFiles.add(f);
        pairs++;
      }
    }
    console.log(`\n✅ Baseline frozen → ${path.relative(ROOT, BASELINE_PATH)}`);
    console.log(
      `   ${classFiles.size} class(es), ${distinctFiles.size} file(s), ${pairs} class|file pair(s)`,
    );
    process.exit(0);
  }

  // --check-baseline-shrink (CI): the frozen baseline must never grow. Fails if
  // any currently-used class|file pair is missing from the baseline (a
  // regeneration would produce a strictly larger file — i.e. new debt frozen).
  if (checkBaselineShrink) {
    const grew = [];
    for (const [cls, files] of classFiles) {
      const frozen = baseline?.get(cls);
      if (!frozen) {
        for (const f of files) grew.push(`${cls} @ ${f}`);
        continue;
      }
      for (const f of files) if (!frozen.has(f)) grew.push(`${cls} @ ${f}`);
    }
    if (grew.length > 0) {
      console.error(
        `\n❌ Baseline shrink guard FAILED — ${grew.length} class|file pair(s) are NOT in the frozen baseline (a regeneration would grow it):`,
      );
      for (const g of grew.slice(0, 20)) console.error(`   - ${g}`);
      console.error(
        "   The baseline must never grow. Fix the new undefined classes; re-freeze only via",
      );
      console.error("   --regenerate-baseline as a deliberate, reviewed action.");
      process.exit(1);
    }
    console.log(
      `\n✅ Baseline shrink guard OK — current usage (${classFiles.size} class(es)) is within the frozen baseline.`,
    );
  }

  // Deduplicate findings (same check + file + line + message)
  const seen = new Set();
  const unique = [];
  for (const f of findings) {
    const key = `${f.check}|${f.file}|${f.line}|${f.message}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(f);
    }
  }

  // Sort: errors first, then warnings, then by file
  unique.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === "error" ? -1 : 1;
    return a.file.localeCompare(b.file) || a.line - b.line;
  });

  // Report
  let errorCount = 0;
  let warningCount = 0;

  for (const f of unique) {
    const icon = f.severity === "error" ? "❌" : "⚠️";
    const label = f.severity === "error" ? "error" : "warning";
    console.log(`${icon} ${f.file}:${f.line}`);
    console.log(`   ${label}: ${f.message}`);
    if (f.severity === "error") errorCount++;
    else warningCount++;
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(
    `  ${errorCount} error(s), ${warningCount} warning(s) in ${unique.length} finding(s)`,
  );
  console.log(`${"─".repeat(50)}\n`);

  process.exit(errorCount > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
