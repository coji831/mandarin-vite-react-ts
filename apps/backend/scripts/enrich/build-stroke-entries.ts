/**
 * @file apps/backend/scripts/enrich/build-stroke-entries.ts
 * @description Enrichment script for stroke content: reads content/strokes/strokes.json
 *   and writes 4 Phase 2 seed files (strokes-categories, strokes-extended-types,
 *   strokes-order-rules, strokes-category-rules).
 *
 * Reads:
 *   - content/strokes/strokes.json
 *
 * Writes:
 *   - content/seed/phase2/strokes-categories.json
 *   - content/seed/phase2/strokes-extended-types.json
 *   - content/seed/phase2/strokes-order-rules.json
 *   - content/seed/phase2/strokes-category-rules.json
 *
 * Idempotent: pure JSON-to-JSON transform — same inputs = same outputs.
 *
 * Run: cd apps/backend && npx tsx scripts/enrich/build-stroke-entries.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { writeJsonAtomic, ensureDir } from "../utils.js";
import { scriptLogger } from "../logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = scriptLogger("enrich:stroke-entries");

// ── Paths ──

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const STROKES_SOURCE = path.join(PROJECT_ROOT, "content", "strokes", "strokes.json");
const PHASE2_DIR = path.join(PROJECT_ROOT, "content", "seed", "phase2");

// ── Types ──

interface SourceStrokeCategory {
  id: string;
  name: string;
  pinyin: string;
  meaning: string;
  glyph: string;
  order: number;
  strokeCount: number;
  exampleChars: string[];
  orderRules: string[];
}

interface SourceExtendedType {
  id: string;
  name: string;
  pinyin: string;
  meaning: string;
  glyph: string;
  order: number;
  baseCategory: string;
}

interface SourceOrderRule {
  id: string;
  number: number;
  name: string;
  description: string;
  examples: string[];
}

interface SourceStrokeFile {
  version: string;
  categories: SourceStrokeCategory[];
  extendedTypes: SourceExtendedType[];
  orderRules: SourceOrderRule[];
}

interface Phase2Category {
  id: string;
  name: string;
  pinyin: string;
  meaning: string;
  glyph: string;
  order: number;
  strokeCount: number;
  exampleChars: string[];
}

interface Phase2ExtendedType {
  id: string;
  name: string;
  pinyin: string;
  meaning: string;
  glyph: string;
  order: number;
  baseCategoryId: string;
}

interface Phase2OrderRule {
  id: string;
  number: number;
  name: string;
  description: string;
  examples: string[];
}

interface Phase2CategoryRule {
  categoryId: string;
  ruleId: string;
  priority: number;
}

// ── Order rule lookup: maps orderRules short name → rule id ──
const ORDER_RULE_MAP: Record<string, string> = {
  "top-to-bottom": "rule-1",
  "left-to-right": "rule-2",
  "horizontal-before-vertical": "rule-3",
  "outside-to-inside": "rule-4",
  "middle-to-sides": "rule-5",
  "top-first": "rule-1",
  "center-first": "rule-5",
};

// ── Main ──

function main(): void {
  logger.info("📦 Build Stroke Entries (Enrich)");
  logger.info("═══════════════════════════════════════\n");

  // ── Load source ──

  logger.info("Loading source file...");
  if (!fs.existsSync(STROKES_SOURCE)) {
    logger.error(`  ❌ Source file not found: ${STROKES_SOURCE}`);
    process.exit(1);
  }

  const source: SourceStrokeFile = JSON.parse(fs.readFileSync(STROKES_SOURCE, "utf-8"));
  logger.info(`  📄 Categories: ${source.categories.length}`);
  logger.info(`  📄 Extended types: ${source.extendedTypes.length}`);
  logger.info(`  📄 Order rules: ${source.orderRules.length}`);

  // ── Build lookup: category id → name (for validation) ──

  const categoryIds = new Set(source.categories.map((c) => c.id));
  logger.info(`  📄 Category IDs: ${[...categoryIds].join(", ")}`);

  // ── Phase 2: Categories (no FK deps) ──

  const categories: Phase2Category[] = source.categories.map((c) => ({
    id: c.id,
    name: c.name,
    pinyin: c.pinyin,
    meaning: c.meaning,
    glyph: c.glyph,
    order: c.order,
    strokeCount: c.strokeCount,
    exampleChars: c.exampleChars,
  }));

  // ── Phase 2: Extended Types (FK → Category) ──

  const extendedTypes: Phase2ExtendedType[] = source.extendedTypes.map((e) => {
    // Validate baseCategory reference
    if (!categoryIds.has(e.baseCategory)) {
      logger.error(
        `  ❌ Extended type "${e.id}" references unknown baseCategory "${e.baseCategory}"`,
      );
      process.exit(1);
    }

    return {
      id: e.id,
      name: e.name,
      pinyin: e.pinyin,
      meaning: e.meaning,
      glyph: e.glyph,
      order: e.order,
      baseCategoryId: e.baseCategory,
    };
  });

  // ── Phase 2: Order Rules (no FK deps) ──

  const orderRules: Phase2OrderRule[] = source.orderRules.map((r) => ({
    id: r.id,
    number: r.number,
    name: r.name,
    description: r.description,
    examples: r.examples,
  }));

  // Build rule ID lookup for validation
  const ruleIds = new Set(source.orderRules.map((r) => r.id));

  // ── Phase 2: Category Rules (FK → Category + Rule) ──

  const categoryRules: Phase2CategoryRule[] = [];

  for (const cat of source.categories) {
    for (const ruleShort of cat.orderRules) {
      const ruleId = ORDER_RULE_MAP[ruleShort];
      if (!ruleId) {
        logger.warn(`  ⚠️  Unknown order rule "${ruleShort}" for category "${cat.id}" — skipping`);
        continue;
      }

      if (!ruleIds.has(ruleId)) {
        logger.warn(`  ⚠️  Resolved rule "${ruleId}" not found in order rules — skipping`);
        continue;
      }

      categoryRules.push({
        categoryId: cat.id,
        ruleId,
        priority: 0,
      });
    }
  }

  // ── Validate FK relationships ──

  logger.info("\n🔍 Validating FK relationships...");
  let valid = true;

  for (const et of extendedTypes) {
    if (!categoryIds.has(et.baseCategoryId)) {
      logger.error(
        `  ❌ Extended type "${et.id}": baseCategoryId "${et.baseCategoryId}" not found in categories`,
      );
      valid = false;
    }
  }

  for (const cr of categoryRules) {
    if (!categoryIds.has(cr.categoryId)) {
      logger.error(`  ❌ Category rule: categoryId "${cr.categoryId}" not found in categories`);
      valid = false;
    }
    if (!ruleIds.has(cr.ruleId)) {
      logger.error(`  ❌ Category rule: ruleId "${cr.ruleId}" not found in order rules`);
      valid = false;
    }
  }

  if (!valid) {
    logger.error("\n  ❌ FK validation failed — exiting");
    process.exit(1);
  }

  logger.info("  ✅ All FK relationships valid");

  // ── Write Phase 2 files ──

  logger.info("\n📝 Writing Phase 2 files...");
  ensureDir(PHASE2_DIR);

  writeJsonAtomic(path.join(PHASE2_DIR, "strokes-categories.json"), categories);
  logger.info(`  ✅ strokes-categories.json (${categories.length} records)`);

  writeJsonAtomic(path.join(PHASE2_DIR, "strokes-extended-types.json"), extendedTypes);
  logger.info(`  ✅ strokes-extended-types.json (${extendedTypes.length} records)`);

  writeJsonAtomic(path.join(PHASE2_DIR, "strokes-order-rules.json"), orderRules);
  logger.info(`  ✅ strokes-order-rules.json (${orderRules.length} records)`);

  writeJsonAtomic(path.join(PHASE2_DIR, "strokes-category-rules.json"), categoryRules);
  logger.info(`  ✅ strokes-category-rules.json (${categoryRules.length} records)`);

  logger.info("\n═══════════════════════════════════════");
  logger.info("🎉 Stroke enrichment completed successfully!");
  logger.info("═══════════════════════════════════════\n");
}

main();
