#!/usr/bin/env node

/**
 * check-doc-links.mjs
 *
 * Standalone link-target companion to check:system-map (C2). Walks docs/**,
 * .github/** and repo-root *.md, reports relative markdown links whose targets
 * do not resolve, and exits 0/1 with a summary count.
 *
 * Rules:
 *   - Only RELATIVE links are checked (http(s)://, mailto:, tel:, data:,
 *     file://, and bare `#anchor` links are skipped).
 *   - Targets are resolved against the containing file's directory. A trailing
 *     `/` resolves as a directory link. A `#fragment` is stripped before the
 *     file-existence check.
 *   - `<!-- link-ignore: <path> -->` inside a file exempts any broken link in
 *     THAT file whose target matches <path> (raw target or normalized path).
 *   - Gitignored `wip/` and `verification-artifacts/` are skipped (they keep
 *     pointer rows, never content — per the two-layer design).
 *   - build artifacts (node_modules, dist, storybook-static, .git, .terraform)
 *     are not scanned.
 *
 * Usage:
 *   node scripts/check-doc-links.mjs
 *
 * Exit codes:
 *   0 = no unresolved relative links
 *   1 = at least one unresolved relative link
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Directories/files never scanned (build artifacts + gitignored governance dirs).
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "storybook-static",
  ".terraform",
  "wip",
  "verification-artifacts",
]);
const SKIP_FILES = new Set(["package-lock.json"]);

function* walkMd(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) yield* walkMd(full);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      yield full;
    }
  }
}

function collectScannedFiles() {
  const files = new Set();
  for (const dir of [path.join(ROOT, "docs"), path.join(ROOT, ".github")]) {
    if (fs.existsSync(dir)) {
      for (const f of walkMd(dir)) files.add(f);
    }
  }
  // Repo-root *.md (README.md, DESIGN.md, CLAUDE.md, TODO.md, AGENTS.md …).
  for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".md") && !SKIP_FILES.has(entry.name)) {
      files.add(path.join(ROOT, entry.name));
    }
  }
  return [...files].sort();
}

/**
 * Remove fenced code blocks (``` or ~~~) so markdown-looking text inside code
 * (prompt templates, shell/PowerShell snippets) is not treated as links.
 */
function stripFenced(text) {
  return text.replace(/```[\s\S]*?```/g, "").replace(/~~~[\s\S]*?~~~/g, "");
}

/**
 * Extract { inline } and { definitions } markdown links from a file body.
 * Inline: [text](target) and ![alt](target). Definitions: [label]: target "title".
 */
function extractLinks(text) {
  const links = [];
  const reInline = /!?\[[^\]]*\]\(<([^>]+)>\)|!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let m;
  while ((m = reInline.exec(text)) !== null) {
    const target = m[1] ?? m[2];
    if (target) links.push(target.trim());
  }
  const reDef = /^\[([^\]]+)\]:\s*<?([^\s>]+)>?(?:\s+["'(][^"')]+["')])?/gm;
  while ((m = reDef.exec(text)) !== null) {
    const target = m[2].trim();
    // A reference "destination" without a dot or slash is prose, not a path
    // (e.g. `[Rationale]: Break the epic into …`). Skip it.
    if (!/[./]/.test(target)) continue;
    links.push(target);
  }
  return links;
}

function isSkippable(target) {
  return (
    /^(https?:|mailto:|tel:|data:|file:|ftp:)/i.test(target) ||
    target.startsWith("#") ||
    target.startsWith("<") // inline HTML or bare angle target
  );
}

/** Resolve a relative target against the file's dir; returns an absolute path (fragment stripped). */
function resolveTarget(file, target) {
  const clean = target.split("#")[0].replace(/^<|>$/g, "");
  if (!clean) return null;
  const abs = path.resolve(path.dirname(file), clean);
  return abs;
}

/** The `<!-- link-ignore: path -->` escapes declared in a file. */
function linkIgnores(text) {
  const out = [];
  const re = /<!--\s*link-ignore:\s*([^-]+?)\s*-->/g;
  let m;
  while ((m = re.exec(text)) !== null) out.push(m[1].trim());
  return out;
}

function main() {
  const files = collectScannedFiles();
  console.log(`\n🔍 Doc link checker — ${files.length} markdown file(s) scanned\n`);

  const broken = []; // { file, target }

  for (const file of files) {
    let text;
    try {
      text = fs.readFileSync(file, "utf-8");
    } catch {
      continue;
    }
    const ignores = linkIgnores(text).map((p) => path.resolve(ROOT, p));
    const seen = new Set();
    const body = stripFenced(text);

    for (const target of extractLinks(body)) {
      if (isSkippable(target)) continue;
      const abs = resolveTarget(file, target);
      if (!abs || seen.has(abs)) continue;
      seen.add(abs);

      // File exists → OK. Directory (trailing /) → OK if dir exists.
      if (fs.existsSync(abs)) continue;

      // link-ignore escape: exact raw target or normalized path exempts it.
      if (ignores.includes(abs)) continue;

      broken.push({ file: path.relative(ROOT, file), target, abs });
    }
  }

  // ── Report ────────────────────────────────────────────────────────────────
  const byFile = new Map();
  for (const b of broken) {
    if (!byFile.has(b.file)) byFile.set(b.file, []);
    byFile.get(b.file).push(b.target);
  }

  let shown = 0;
  const maxShown = 120;
  for (const [file, targets] of byFile) {
    for (const t of targets) {
      if (shown >= maxShown) continue;
      console.log(`  ❌ ${file} → ${t}`);
      shown++;
    }
  }
  if (broken.length > maxShown) {
    console.log(`  … and ${broken.length - maxShown} more`);
  }

  console.log(`\n${"─".repeat(60)}`);
  if (broken.length > 0) {
    console.log(`  ${broken.length} unresolved relative link(s) across ${byFile.size} file(s)`);
    console.log(`${"─".repeat(60)}\n`);
    process.exit(1);
  }
  console.log("  All relative links resolve");
  console.log(`${"─".repeat(60)}\n`);
  process.exit(0);
}

main();
