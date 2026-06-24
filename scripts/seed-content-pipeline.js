/**
 * Content Pipeline Seed Script — Pre-Adaptation Pattern
 *
 * Reads content from the content/ directory and validates
 * the one-file-per-entity convention. In production, this would
 * also upsert into Prisma content models.
 *
 * Usage: node scripts/seed-content-pipeline.js
 *
 * See: verification-artifacts/content-registry-architecture.md §11
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(__dirname, "..", "content");
const TYPES = {
  radicals: { required: ["id", "glyph", "meaning", "stroke_count"] },
  characters: { required: ["id", "glyph", "stroke_count", "readings"] },
  pinyin: { required: ["id", "pinyin", "category"] },
  tones: { required: ["id", "number", "name", "contour"] },
};

function validateEntity(filePath, type) {
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const rules = TYPES[type];
  const missing = rules.required.filter((f) => data[f] === undefined || data[f] === null);
  if (missing.length > 0) {
    return { valid: false, errors: [`Missing fields: ${missing.join(", ")}`] };
  }
  const idPrefixes = {
    radicals: "rad_",
    characters: "ch_",
    pinyin: null, // pinyin IDs start with "init_" or "fin_"
    tones: "tn_",
  };

  if (type === "pinyin") {
    if (!data.id.startsWith("init_") && !data.id.startsWith("fin_")) {
      return {
        valid: false,
        errors: [`Invalid ID format: ${data.id} — must start with init_ or fin_`],
      };
    }
  } else if (idPrefixes[type] && !data.id.startsWith(idPrefixes[type])) {
    return { valid: false, errors: [`Invalid ID format: ${data.id}`] };
  }
  return { valid: true, data };
}

function scan() {
  const manifestPath = path.join(CONTENT_DIR, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

  console.log(`\n📋 Content Pipeline v${manifest.version}\n`);
  console.log(`Scanning ${manifest.created_at}\n`);

  let total = 0;
  let valid = 0;
  let invalid = 0;

  for (const [type, rules] of Object.entries(TYPES)) {
    const dir = path.join(CONTENT_DIR, type);
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
    console.log(`  ${type} (${files.length} files):`);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const result = validateEntity(filePath, type);
      total++;

      if (result.valid) {
        valid++;
        const label = result.data.glyph || result.data.pinyin || result.data.name || result.data.id;
        console.log(`    ✅ ${result.data.id} — ${label}`);
      } else {
        invalid++;
        console.log(`    ❌ ${file}: ${result.errors.join("; ")}`);
      }
    }
    console.log("");
  }

  console.log(`\n📊 Summary: ${valid} valid, ${invalid} invalid, ${total} total`);
  console.log(`\n💡 Next step: Import validated entities into Prisma:\n`);
  console.log(`    const data = fs.readFileSync('content/radicals/rad_0008.json');`);
  console.log(`    await prisma.radical.upsert({`);
  console.log(`      where: { content_id: data.id },`);
  console.log(`      update: { glyph: data.glyph, content_version: { increment: 1 } },`);
  console.log(`      create: { content_id: data.id, glyph: data.glyph, ... }`);
  console.log(`    });`);
}

scan();
