#!/usr/bin/env node
/*
 Simple scanner to locate legacy progress hook usages and storage keys.
 Usage:
  node scripts/automate-cleanup-legacy.cjs    # runs scan and writes report to scripts/cleanup-report.json
  node scripts/automate-cleanup-legacy.cjs --json  # prints JSON to stdout

 This script is intentionally read-only (no edits) to provide a safe starting point for automated cleanup.
*/

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");

const fileExts = [".ts", ".tsx", ".js", ".jsx"];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".git") continue;
      files.push(...walk(full));
    } else if (e.isFile() && fileExts.includes(path.extname(e.name))) {
      files.push(full);
    }
  }
  return files;
}

function getMatches(content, regex) {
  const lines = content.split(/\r?\n/);
  const matches = [];
  lines.forEach((ln, idx) => {
    if (regex.test(ln)) {
      matches.push({ line: idx + 1, text: ln.trim() });
    }
  });
  return matches;
}

(function main() {
  const args = process.argv.slice(2);
  const outJson = args.includes("--json");

  const files = walk(SRC);
  const patterns = {
    useMandarinProgress: /\buseMandarinProgress\b/,
    useProgressData: /\buseProgressData\b/,
    useProgressContextImport: /import\s+.*useProgressContext.*from/,
    legacyProgressKey: /user_progress|legacyProgress|OLD_PROGRESS_KEY/,
    localStorageGet: /localStorage\.getItem\(/,
  };

  const report = { scanned: files.length, hits: {} };
  Object.keys(patterns).forEach((k) => (report.hits[k] = []));

  for (const file of files) {
    let content;
    try {
      content = fs.readFileSync(file, "utf8");
    } catch (e) {
      continue;
    }
    Object.entries(patterns).forEach(([key, regex]) => {
      const matches = getMatches(content, regex);
      if (matches.length > 0) report.hits[key].push({ file: path.relative(ROOT, file), matches });
    });
  }

  const outPath = path.join(ROOT, "scripts", "cleanup-report.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");

  if (outJson) {
    console.log(JSON.stringify(report));
  } else {
    console.log("Scan complete. Report written to scripts/cleanup-report.json");
    console.log("Summary:");
    Object.entries(report.hits).forEach(([k, arr]) => {
      console.log(`  ${k}: ${arr.length} files`);
    });
  }
})();
