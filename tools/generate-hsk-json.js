#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const INPUT = path.resolve(
  __dirname,
  "..",
  "apps",
  "frontend",
  "public",
  "data",
  "vocabulary",
  "hsk3.0",
  "band1",
  "hsk3.0-band1-full.txt",
);

try {
  const raw = fs.readFileSync(INPUT, "utf8");
  const lines = raw.split(/\r?\n/);
  const words = [];
  const seen = new Set();

  for (let i = 1; i < lines.length; i++) {
    const line = (lines[i] || "").trim();
    if (!line) continue;
    const cols = line.split("\t");
    // Chinese column usually at index 1
    const chineseField = (cols[1] || "").trim();
    if (!chineseField) continue;

    // Remove parenthetical annotations like （形） or (x)
    const cleaned = chineseField.replace(/（.*?）|\(.*?\)/g, "").trim();

    // Split on common variant separators and whitespace
    const variants = cleaned.split(/[｜|、\/，,；;\s]+/);
    for (let v of variants) {
      v = (v || "").trim();
      if (!v) continue;
      // Extract contiguous CJK Unified Ideographs (common Han range)
      const matches = v.match(/[\u4E00-\u9FFF]+/g);
      if (!matches) continue;
      for (const m of matches) {
        if (!seen.has(m)) {
          seen.add(m);
          words.push(m);
        }
      }
    }
  }

  // Output JSON array to stdout
  console.log(JSON.stringify(words, null, 2));
} catch (err) {
  console.error("Error generating HSK JSON:", err && err.message ? err.message : err);
  process.exit(2);
}
