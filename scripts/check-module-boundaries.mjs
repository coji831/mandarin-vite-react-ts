#!/usr/bin/env node

/**
 * check-module-boundaries.mjs
 *
 * Machine-enforces the DIRECTION rule for the monorepo:
 *
 *   - apps/frontend/src/shared/**  must import ZERO  apps/frontend/src/features/**
 *   - apps/backend/src/shared/**   must import ZERO  apps/backend/src/modules/**
 *
 * "shared" is the foundation layer — it must never reach back into
 * feature/module implementation. Cross-feature and cross-module access must go
 * through the feature/module barrel (index) instead.
 *
 * Parsing is deliberately simple (this is a guard, not a bundler): a lexical
 * scan for import specifiers in `from "..."` / `import "..."` / `import("...")`
 * positions, with comments stripped first. Specifiers are resolved BOTH as
 * alias-style (`features/...`, `src/...`, `shared/...` — the FE aliases that
 * can reach the features tree; no `@/` alias exists in this repo) and as
 * relative (`./`, `../`) paths against the importing file. Bare packages
 * (`react`, `@mandarin/*`, node builtins) are ignored.
 *
 * NOTE: `no-restricted-imports` in apps/frontend/eslint.config.js matches only
 * the literal import-specifier string, so RELATIVE-path imports bypass it.
 * This script is the authoritative direction guard.
 *
 * ALLOWLIST (keep minimal & explicit — document every entry):
 *
 *   1. FE  apps/frontend/src/shared/layouts/**  →  features/auth,
 *      features/lexical-hub/components
 *      Reason: composition-root exception — AppLayout.tsx / LearnLayout.tsx
 *      orchestrate the app-wide auth + LexicalHub overlay. No other shared
 *      folder may import a feature.
 *
 *   2. BE  apps/backend/src/shared/types/**  →  modules/**
 *      Reason: type augmentation (express.d.ts) declares controller/service
 *      types on Express.Request for middleware-injected access. Type-only
 *      imports (erased at compile time). Mirrors the existing BE eslint
 *      override in apps/backend/eslint.config.js (files: `src/shared/types`).
 *
 * Tests / stories ARE scanned: a shared test or story importing a feature is a
 * smell and must follow the same rule.
 *
 * Usage:
 *   node scripts/check-module-boundaries.mjs
 *
 * Exit codes:
 *   0 = all scanned imports PASS the direction rule
 *   1 = at least one FAIL (offending file + import + resolved path printed)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ─── Configuration ───────────────────────────────────────────────────────────

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const FE_SRC = path.join(ROOT, "apps", "frontend", "src");
const FE_SHARED = path.join(FE_SRC, "shared");
const FE_FEATURES = path.join(FE_SRC, "features");

const BE_SRC = path.join(ROOT, "apps", "backend", "src");
const BE_SHARED = path.join(BE_SRC, "shared");
const BE_MODULES = path.join(BE_SRC, "modules");

// Allowlist entry 1 (FE): shared/layouts may reach the auth + lexical-hub
// composition root only. Everything else under shared/ must be feature-free.
const FE_ALLOWED_LAYOUT_DIRS = [path.join(FE_SHARED, "layouts")];
const FE_ALLOWED_FEATURE_TARGETS = [
  path.join(FE_FEATURES, "auth"),
  path.join(FE_FEATURES, "lexical-hub", "components"),
];

// Allowlist entry 2 (BE): shared/types is the type-augmentation exception
// (express.d.ts) — type-only controller/service imports, erased at compile.
const BE_ALLOWED_TYPE_DIRS = [path.join(BE_SHARED, "types")];

// Frontend alias roots (vite.config.ts). Only `features` and `src` can reach
// the features tree; `shared` is included for symmetry. Backend uses relative
// imports only (no path aliases in tsconfig.json).
const FE_ALIAS_ROOTS = {
  features: FE_FEATURES,
  src: FE_SRC,
  shared: FE_SHARED,
};

// Banned capability/provider name segments — a naming-trap guard. If any path
// (file OR directory) under a src tree contains one of these, the guard fails.
// Capability modules are named after the CAPABILITY (`modules/audio`), never
// the provider (`modules/tts`, `modules/gemini`); and shared/ holds ZERO
// capability logic (no `shared/tts`, no `shared/services`).
const BANNED_PATH_SEGMENTS = ["modules/tts", "modules/gemini", "shared/services", "shared/tts"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** True if `child` is `parent` or a descendant of `parent`. */
function isUnder(child, parent) {
  const rel = path.relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

/** Recursively collect .ts/.tsx files under a directory. */
function collectFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/** Recursively collect every file AND directory path under a directory. */
function collectAllPaths(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    out.push(full);
    if (entry.isDirectory()) out.push(...collectAllPaths(full));
  }
  return out;
}

/**
 * Naming guard: fail if any path under a src tree contains a banned
 * capability/provider name segment (e.g. modules/tts, shared/services).
 */
function scanBannedNames(roots) {
  const failures = [];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const file of collectAllPaths(root)) {
      const rel = path.relative(ROOT, file).replace(/\\/g, "/");
      for (const banned of BANNED_PATH_SEGMENTS) {
        if (rel.includes(banned)) {
          failures.push({ rel, banned });
        }
      }
    }
  }
  return failures;
}

/** Strip block + line comments so doc examples can't false-positive. */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

/** Lexically extract import/export specifiers from source. */
function extractSpecifiers(src) {
  const specifiers = [];
  const re =
    /\bfrom\s+["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|\bimport\s+["']([^"']+)["']/g;
  const clean = stripComments(src);
  let m;
  while ((m = re.exec(clean)) !== null) {
    const spec = m[1] ?? m[2] ?? m[3];
    if (spec) specifiers.push(spec);
  }
  return specifiers;
}

/**
 * Resolve a specifier to an absolute path, or null for bare packages /
 * node builtins / @mandarin/* (not a boundary concern).
 */
function resolveSpecifier(specifier, fromFile, aliasRoots) {
  if (specifier.startsWith(".")) {
    return path.resolve(path.dirname(fromFile), specifier);
  }
  const first = specifier.split("/")[0];
  const aliasRoot = aliasRoots[first];
  if (aliasRoot) {
    return path.join(aliasRoot, specifier.slice(first.length + 1));
  }
  return null;
}

/** Build the combined allowlist predicate from the entries above. */
function makeAllowList() {
  return (file, resolved) => {
    // FE: shared/layouts → allowed feature targets only
    if (FE_ALLOWED_LAYOUT_DIRS.some((d) => isUnder(file, d))) {
      if (FE_ALLOWED_FEATURE_TARGETS.some((t) => isUnder(resolved, t))) return true;
    }
    // BE: shared/types → any module (type-augmentation exception)
    if (BE_ALLOWED_TYPE_DIRS.some((d) => isUnder(file, d))) return true;
    return false;
  };
}

/** Scan one side; return { files, importsChecked, failures }. */
function scanSide({ label, sharedDir, forbiddenRoot, aliasRoots, isAllowed }) {
  const failures = [];
  let importsChecked = 0;
  const files = collectFiles(sharedDir);

  for (const file of files) {
    const src = fs.readFileSync(file, "utf-8");
    for (const spec of extractSpecifiers(src)) {
      const resolved = resolveSpecifier(spec, file, aliasRoots);
      if (resolved === null) continue;
      if (!isUnder(resolved, forbiddenRoot)) continue; // not a features/modules import
      importsChecked++;
      if (isAllowed(file, resolved)) continue;
      failures.push({ file, spec, resolved });
    }
  }

  return { label, files: files.length, importsChecked, failures };
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  console.log(
    "\n🔍 Module Boundary Direction Rule (shared never imports features/modules) + naming guard\n",
  );

  const isAllowed = makeAllowList();

  const fe = scanSide({
    label: "FE apps/frontend/src/shared → features",
    sharedDir: FE_SHARED,
    forbiddenRoot: FE_FEATURES,
    aliasRoots: FE_ALIAS_ROOTS,
    isAllowed,
  });

  const be = scanSide({
    label: "BE apps/backend/src/shared → modules",
    sharedDir: BE_SHARED,
    forbiddenRoot: BE_MODULES,
    aliasRoots: {}, // BE: relative imports only
    isAllowed,
  });

  let failures = 0;
  for (const side of [fe, be]) {
    console.log(`  ${side.label}`);
    console.log(
      `    files scanned: ${side.files}, feature/module imports resolved: ${side.importsChecked}`,
    );
    for (const f of side.failures) {
      failures++;
      console.log(`    ❌ ${path.relative(ROOT, f.file)}`);
      console.log(`         import: ${f.spec}`);
      console.log(`         resolved to: ${path.relative(ROOT, f.resolved)}`);
    }
  }

  // Naming guard — banned capability/provider name segments.
  // Scoped to the BACKEND src tree: this is a backend modulith convention
  // (capability modules named after the capability, never the provider; shared/
  // holds zero capability logic). The frontend legitimately keeps
  // `shared/services/` as its transport/service layer (see architecture map §4)
  // — the guard must not flag it.
  const banned = scanBannedNames([BE_SRC]);
  if (banned.length > 0) {
    console.log(`  Naming guard (banned capability/provider names):`);
    for (const b of banned) {
      failures++;
      console.log(`    ❌ ${b.rel} (banned name segment: ${b.banned})`);
    }
  } else {
    console.log(
      "  Naming guard: no banned capability/provider name segments (modules/tts, modules/gemini, shared/services, shared/tts)",
    );
  }

  console.log(`\n${"─".repeat(60)}`);
  if (failures > 0) {
    console.log(
      `  ${failures} boundary violation(s) or banned name(s) found — shared must not import features/modules; capability modules must be named after the capability, not the provider`,
    );
    console.log(`${"─".repeat(60)}\n`);
    process.exit(1);
  }
  console.log(
    "  All shared imports respect the direction rule (shared never imports features/modules); naming guard clean",
  );
  console.log(`${"─".repeat(60)}\n`);
  process.exit(0);
}

main();
