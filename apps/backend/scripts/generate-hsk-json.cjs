/**
 * @file apps/backend/scripts/generate-hsk-json.js
 * @description Reads HSK CSV files from the frontend's public directory and
 * outputs a clean JSON vocabulary file to apps/backend/data/vocabulary/hsk-band1.json.
 *
 * Usage: node scripts/generate-hsk-json.js
 *
 * The output file is read by ReviewService via readStaticReference("vocabulary/hsk-band1.json").
 */

const fs = require("fs");
const path = require("path");

/**
 * Parse accented pinyin into plain text and tone number.
 * Inlined here to avoid ESM/CJS module boundary issues.
 */
function parsePinyin(accented) {
  const toneMarks = {
    ā: ["a", 1],
    á: ["a", 2],
    ǎ: ["a", 3],
    à: ["a", 4],
    ē: ["e", 1],
    é: ["e", 2],
    ě: ["e", 3],
    è: ["e", 4],
    ī: ["i", 1],
    í: ["i", 2],
    ǐ: ["i", 3],
    ì: ["i", 4],
    ō: ["o", 1],
    ó: ["o", 2],
    ǒ: ["o", 3],
    ò: ["o", 4],
    ū: ["u", 1],
    ú: ["u", 2],
    ǔ: ["u", 3],
    ù: ["u", 4],
    ǖ: ["v", 1],
    ǘ: ["v", 2],
    ǚ: ["v", 3],
    ǜ: ["v", 4],
    ü: ["v", 0],
    Ā: ["A", 1],
    Á: ["A", 2],
    Ǎ: ["A", 3],
    À: ["A", 4],
    Ē: ["E", 1],
    É: ["E", 2],
    Ě: ["E", 3],
    È: ["E", 4],
    Ī: ["I", 1],
    Í: ["I", 2],
    Ǐ: ["I", 3],
    Ì: ["I", 4],
    Ō: ["O", 1],
    Ó: ["O", 2],
    Ǒ: ["O", 3],
    Ò: ["O", 4],
    Ū: ["U", 1],
    Ú: ["U", 2],
    Ǔ: ["U", 3],
    Ù: ["U", 4],
  };
  let plain = "";
  let tone = 0;
  for (const char of accented) {
    const mark = toneMarks[char];
    if (mark) {
      plain += mark[0];
      tone = mark[1];
    } else {
      plain += char;
    }
  }
  return { plain: plain.toLowerCase(), tone };
}

// ── Paths ──────────────────────────────────────────────────────────────
const csvDir = path.resolve(
  __dirname,
  "../../../apps/frontend/public/data/vocabulary/hsk3.0/band1",
);
const outputPath = path.resolve(__dirname, "../data/vocabulary/hsk-band1.json");

// ── CSV parsing ────────────────────────────────────────────────────────

/**
 * Parse a CSV line respecting quoted fields.
 * Simple parser — handles the known HSK CSV format correctly.
 */
function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Clean a Chinese word by removing annotating parentheses like 白(形) → 白, 白（形）→ 白
 * and handling alternative forms like 爸爸｜爸 → 爸爸
 */
function cleanChinese(raw) {
  let word = raw.trim();
  // Remove parenthetical annotations: 白(形) → 白, 白（形）→ 白
  word = word.replace(/[（(][^)）]*[)）]/g, "").trim();
  // Take the first form if alternatives exist
  word = word.split("｜")[0].trim();
  return word;
}

/**
 * Clean pinyin by removing parenthetical annotations and handling alternatives.
 */
function cleanPinyin(raw) {
  let p = raw.trim();
  // Remove trailing whitespace before parentheses
  p = p.replace(/\s+[（(][^)）]*[)）]/g, "").trim();
  // Take first pinyin reading if alternatives exist
  p = p.split("｜")[0].trim();
  // Remove extra spaces around · interpunct (别·人 → 别人 handled elsewhere)
  return p;
}

/**
 * Clean English meaning.
 */
function cleanEnglish(raw) {
  return raw
    .trim()
    .replace(/^[""]|[""]$/g, "")
    .trim();
}

// ── Main ───────────────────────────────────────────────────────────────

function main() {
  // Read all CSV files sorted by name
  const files = fs
    .readdirSync(csvDir)
    .filter((f) => f.endsWith(".csv") && f.startsWith("hsk3.0-band1"))
    .sort();

  if (files.length === 0) {
    console.error("No HSK CSV files found in", csvDir);
    process.exit(1);
  }

  console.log(`Found ${files.length} CSV files in ${csvDir}`);

  const words = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(csvDir, file), "utf-8");
    const lines = content.trim().split("\n");

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const parts = parseCsvLine(lines[i]);
      if (parts.length < 4) continue;

      const rawChinese = parts[1];
      const rawPinyin = parts[2];
      const rawEnglish = parts[3];

      const chinese = cleanChinese(rawChinese);
      const pinyin = cleanPinyin(rawPinyin);
      const english = cleanEnglish(rawEnglish);

      if (!chinese || !pinyin) continue;

      // Parse each space-separated pinyin word to get plain text and tones
      const pinyinWords = pinyin.split(/\s+/);
      const parsedWords = pinyinWords.map((w) => parsePinyin(w));
      const pinyinPlain = parsedWords.map((pw) => pw.plain).join(" ");
      // Use the last word's tone for single-character words, or last tone
      const correctTone = parsedWords.length > 0 ? parsedWords[parsedWords.length - 1].tone : 0;

      // For multi-character words, use the first character for the display character
      // and set the correctTone to the tone of the last word (commonly tested)
      words.push({
        id: parts[0].trim(),
        chinese,
        pinyin,
        english,
        pinyinPlain,
        correctTone,
      });
    }
  }

  // Deduplicate by chinese character
  const seen = new Set();
  const unique = [];
  for (const w of words) {
    if (!seen.has(w.chinese)) {
      seen.add(w.chinese);
      unique.push(w);
    }
  }

  // Create output directory
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(unique, null, 2), "utf-8");

  console.log(
    `✓ Generated ${unique.length} vocabulary items (${words.length - unique.length} duplicates skipped)`,
  );
  console.log(`  Output: ${outputPath}`);
}

main();
