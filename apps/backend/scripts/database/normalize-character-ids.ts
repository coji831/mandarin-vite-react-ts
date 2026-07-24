/**
 * @file apps/backend/scripts/database/normalize-character-ids.ts
 * @description Phase B migration: Rename ch_hsk_* → ch_XXXX filename pattern.
 *
 * Reads all content/characters/*.json files, maps ch_hsk_* names to the
 * canonical ch_NNNN format when the same glyph already has a ch_NNNN file.
 * If no ch_NNNN exists for the glyph, the script will create a mapping.
 *
 * Uses filename as source of truth — never modifies file content IDs.
 *
 * Run: cd apps/backend && npx tsx scripts/database/normalize-character-ids.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONTENT_DIR = path.resolve(__dirname, "..", "..", "..", "..", "content");
const CHARS_DIR = path.join(CONTENT_DIR, "characters");

interface CharFile {
  id: string;
  glyph: string;
  [key: string]: unknown;
}

interface Manifest {
  version: number;
  created_at: string;
  content_types: string[];
  entity_counts: Record<string, number>;
  characters?: {
    files: string[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

async function main() {
  console.log("🔄 Starting character ID normalization...");

  // Read all character files
  const files = fs.readdirSync(CHARS_DIR).filter((f) => f.endsWith(".json"));
  console.log(`  Found ${files.length} character files`);

  const hskFiles = files.filter((f) => f.startsWith("ch_hsk_"));
  const numericFiles = files.filter((f) => /^ch_\d{4}\.json$/.test(f));

  console.log(`  HSK-named files: ${hskFiles.length}`);
  console.log(`  Numeric files: ${numericFiles.length}`);

  // Build glyph → numeric file mapping
  const glyphToNumeric = new Map<string, string>();
  for (const file of numericFiles) {
    const data = JSON.parse(fs.readFileSync(path.join(CHARS_DIR, file), "utf-8")) as CharFile;
    glyphToNumeric.set(data.glyph, file);
  }

  // Find highest existing numeric ID
  let maxNumeric = 0;
  for (const file of numericFiles) {
    const match = file.match(/^ch_(\d{4})\.json$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNumeric) maxNumeric = num;
    }
  }
  console.log(`  Highest existing numeric ID: ch_${String(maxNumeric).padStart(4, "0")}`);

  // Process HSK-named files
  let renamed = 0;
  let skipped = 0;
  let nextId = maxNumeric + 1;

  for (const hskFile of hskFiles) {
    const filePath = path.join(CHARS_DIR, hskFile);
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as CharFile;
    const glyph = data.glyph;

    // Check if this glyph already has a numeric file
    const existingNumericFile = glyphToNumeric.get(glyph);

    if (existingNumericFile) {
      // Remove the HSK duplicate (same glyph, keep numeric file)
      console.log(
        `  🗑️  Removing duplicate: ${hskFile} → ${existingNumericFile} (same glyph: ${glyph})`,
      );
      fs.unlinkSync(filePath);
      skipped++;
    } else {
      // Rename HSK file to numeric
      const newName = `ch_${String(nextId).padStart(4, "0")}.json`;
      const newPath = path.join(CHARS_DIR, newName);

      // Check if target name doesn't exist
      if (fs.existsSync(newPath)) {
        console.log(`  ⚠️  Target ${newName} already exists — skipping ${hskFile}`);
        skipped++;
        continue;
      }

      // Update the id field in the JSON content to match new filename
      data.id = newName.replace(".json", "");
      fs.writeFileSync(newPath, JSON.stringify(data, null, 2), "utf-8");
      fs.unlinkSync(filePath);
      console.log(`  ✅ Renamed: ${hskFile} → ${newName} (glyph: ${glyph})`);
      glyphToNumeric.set(glyph, newName);
      renamed++;
      nextId++;
    }
  }

  // Update manifest.json
  const manifestPath = path.join(CONTENT_DIR, "manifest.json");
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as Manifest;
    const updatedFiles = fs
      .readdirSync(CHARS_DIR)
      .filter((f) => f.endsWith(".json"))
      .sort();

    if (manifest.characters) {
      manifest.characters.files = updatedFiles;
    }

    if (manifest.entity_counts) {
      manifest.entity_counts.characters = updatedFiles.length;
    }

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
    console.log("  ✅ Updated manifest.json");
  }

  console.log(`\n🎉 Normalization complete: ${renamed} renamed, ${skipped} skipped/removed`);
}

main().catch((e) => {
  console.error("❌ Normalization failed:", e);
  process.exit(1);
});
