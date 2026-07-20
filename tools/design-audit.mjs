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
 * Usage:
 *   node tools/design-audit.mjs                      # Scan entire frontend
 *   node tools/design-audit.mjs apps/frontend/src/features/character-hub/  # Scope to a feature
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
  inlineStyles: {
    name: "inline-style",
    severity: "warning",
    description: "Inline style={{...}} — move to CSS class or utility",
    test: (line, file) => {
      if (!file.endsWith(".tsx")) return null;
      const match = line.match(/style=\{\{(.*?)\}\}/);
      if (match) {
        return {
          line: line,
          match: match[0].substring(0, 60) + (match[0].length > 60 ? "..." : ""),
        };
      }
      return null;
    },
  },
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
};

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

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const targetDir = path.resolve(ROOT, process.argv[2] || DEFAULT_PATH);

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
        const context = { prevLine };
        const result = check.test(line, filePath, context);
        if (result) {
          const msg = result.utility
            ? `${check.description}: "${result.match}" → use className="${result.utility}"`
            : `${check.description}: "${result.match}"`;
          findings.push({
            file: relativePath,
            line: i + 1,
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

  // Undefined variable detection
  const undefinedVarFindings = findUndefinedVariables(scanFiles, registry);
  findings.push(...undefinedVarFindings);

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
