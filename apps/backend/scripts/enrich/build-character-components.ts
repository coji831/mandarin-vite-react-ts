/**
 * @file apps/backend/scripts/enrich/build-character-components.ts
 * @description Enrich: Parse MMAH IDS decomposition strings to create
 *   CharacterComponent junction records linking characters to their
 *   sub-character components with position and function info.
 *
 * Reads:
 *   - content/seed/phase1/mmah-entries.json — MMAH entries with decomposition + etymology
 *   - content/seed/phase2/characters.json — phase 2 characters (glyph → characterId)
 *   - content/seed/phase2/component-entries.json — phase 2 components (glyph → componentId)
 *
 * Writes: content/seed/phase2/character-components.json
 *
 * Idempotent: pure JSON-to-JSON transform.
 *
 * Run: cd apps/backend && npx tsx scripts/enrich/build-character-components.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { writeJsonAtomic, ensureDir } from "../utils.js";
import { scriptLogger } from "../logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = scriptLogger("enrich:char-components");

// ── Paths ──

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const PHASE1_DIR = path.join(PROJECT_ROOT, "content", "seed", "phase1");
const PHASE2_DIR = path.join(PROJECT_ROOT, "content", "seed", "phase2");

// ── IDS Operators ──

const IDS_BINARY = new Map<string, string[]>([
  ["\u2FF0", ["left", "right"]], // ⿰
  ["\u2FF1", ["top", "bottom"]], // ⿱
  ["\u2FF4", ["outside", "inside"]], // ⿴ full surround
  ["\u2FF5", ["outside", "inside"]], // ⿵ surround from above
  ["\u2FF6", ["outside", "inside"]], // ⿶ surround from below
  ["\u2FF7", ["outside", "inside"]], // ⿷ surround from left
  ["\u2FF8", ["outside", "inside"]], // ⿸ surround from upper left
  ["\u2FF9", ["outside", "inside"]], // ⿹ surround from upper right
  ["\u2FFA", ["outside", "inside"]], // ⿺ surround from lower left
  ["\u2FFB", ["center", "center"]], // ⿻ overlap/infusion (both get "center")
]);

const IDS_TERNARY = new Map<string, string[]>([
  ["\u2FF2", ["left", "center", "right"]], // ⿲
  ["\u2FF3", ["top", "center", "bottom"]], // ⿳
]);

// ── Types ──

interface MmahEntry {
  character: string;
  definition?: string;
  pinyin?: string[];
  decomposition?: string;
  etymology?: {
    type?: string;
    hint?: string;
    phonetic?: string;
    semantic?: string;
  };
  radical?: string;
  matches?: Array<Array<number> | null>;
}

interface ComponentEntry {
  id: string;
  glyph: string;
  [key: string]: unknown;
}

interface CharacterComponentRecord {
  characterId: string;
  componentId: string;
  position: string | null;
  function: string | null;
}

// ── Parsed Component Node ──

interface ComponentNode {
  glyph: string;
  position: string;
}

// ── Helpers ──

/**
 * Check if a character is a CJK Unified Ideograph, Extension, or CJK Radical.
 */
function isCjkOrRadical(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return (
    (code >= 0x4e00 && code <= 0x9fff) ||
    (code >= 0x3400 && code <= 0x4dbf) ||
    (code >= 0x20000 && code <= 0x2a6df) ||
    (code >= 0x2a700 && code <= 0x2b73f) ||
    (code >= 0x2b740 && code <= 0x2b81f) ||
    (code >= 0x2b820 && code <= 0x2ceaf) ||
    (code >= 0x2ceb0 && code <= 0x2ebef) ||
    (code >= 0x2e80 && code <= 0x2eff) ||
    (code >= 0x2f00 && code <= 0x2fdf)
  );
}

// ── IDS Parser ──

/**
 * Parse an IDS decomposition string and return a flat list of (glyph, position)
 * pairs, where position is determined by the IDS operator that contains the glyph.
 *
 * Recursively resolves nested IDS operators.
 */
function parseIdsWithPositions(decomp: string): ComponentNode[] {
  const nodes: ComponentNode[] = [];
  let pos = 0;

  function parse(): string | null {
    if (pos >= decomp.length) return null;
    const ch = decomp[pos];

    // Unknown marker — skip
    if (ch === "\uFF1F") {
      pos++;
      return null;
    }

    // Binary IDS operator
    if (IDS_BINARY.has(ch)) {
      const positions = IDS_BINARY.get(ch)!;
      pos++;
      const left = parse();
      const right = parse();
      if (left) nodes.push({ glyph: left, position: positions[0] });
      if (right) nodes.push({ glyph: right, position: positions[1] });
      return null;
    }

    // Ternary IDS operator
    if (IDS_TERNARY.has(ch)) {
      const positions = IDS_TERNARY.get(ch)!;
      pos++;
      const a = parse();
      const b = parse();
      const c = parse();
      if (a) nodes.push({ glyph: a, position: positions[0] });
      if (b) nodes.push({ glyph: b, position: positions[1] });
      if (c) nodes.push({ glyph: c, position: positions[2] });
      return null;
    }

    // Regular character
    pos++;
    return ch;
  }

  parse();
  return nodes;
}

// ── Main ──

function main(): void {
  logger.info("📦 Build Character Components (Character ↔ Component junction)");
  logger.info("═══════════════════════════════════════════════════════════════\n");

  // ── Load inputs ──

  logger.info("Loading inputs...");

  const mmahEntries: MmahEntry[] = JSON.parse(
    fs.readFileSync(path.join(PHASE1_DIR, "mmah-entries.json"), "utf-8"),
  );
  logger.info(`  📄 MMAH entries: ${mmahEntries.length}`);

  // Phase 2 characters: build glyph → characterId map
  const charsPath = path.join(PHASE2_DIR, "characters.json");
  if (!fs.existsSync(charsPath)) {
    logger.error(
      "  ❌ Phase 2 characters.json not found — run Enrich 1 first",
      new Error("Missing characters.json"),
    );
    process.exit(1);
  }
  const characters: Array<{ id: string; glyph: string }> = JSON.parse(
    fs.readFileSync(charsPath, "utf-8"),
  );
  const glyphToCharId = new Map<string, string>();
  for (const c of characters) {
    glyphToCharId.set(c.glyph, c.id);
  }
  logger.info(`  📄 Characters: ${characters.length}`);

  // Phase 2 component entries: build glyph → componentId map
  const compPath = path.join(PHASE2_DIR, "component-entries.json");
  if (!fs.existsSync(compPath)) {
    logger.error(
      "  ❌ Phase 2 component-entries.json not found — run build-component-entries first",
      new Error("Missing component-entries.json"),
    );
    process.exit(1);
  }
  const componentEntries: ComponentEntry[] = JSON.parse(fs.readFileSync(compPath, "utf-8"));
  const glyphToComponentId = new Map<string, string>();
  for (const ce of componentEntries) {
    glyphToComponentId.set(ce.glyph, ce.id);
  }
  logger.info(`  📄 Component entries: ${componentEntries.length}`);

  // ── Build character-component records ──

  logger.info("Building character-component records...");

  const records: CharacterComponentRecord[] = [];
  const dedupSet = new Set<string>(); // "characterId_componentId" dedup

  let withDecomp = 0;
  let skippedQuestion = 0;
  let skippedNoDecomp = 0;
  let charNotInSet = 0;
  let compNotInSet = 0;
  let nonCjkSkipped = 0;
  let dedupSkipped = 0;

  for (const mmah of mmahEntries) {
    const glyph = mmah.character;
    if (!glyph) continue;

    const charId = glyphToCharId.get(glyph);
    if (!charId) {
      charNotInSet++;
      continue;
    }

    const decomp = mmah.decomposition;
    if (!decomp) {
      skippedNoDecomp++;
      continue;
    }
    if (decomp === "\uFF1F") {
      // "？" — unknown
      skippedQuestion++;
      continue;
    }

    const nodes = parseIdsWithPositions(decomp);
    withDecomp++;

    for (const node of nodes) {
      if (node.glyph && !isCjkOrRadical(node.glyph)) {
        nonCjkSkipped++;
        continue;
      }
      const componentId = glyphToComponentId.get(node.glyph);
      if (!componentId) {
        compNotInSet++;
        continue;
      }

      // Dedup (characterId + componentId)
      const dedupKey = `${charId}_${componentId}`;
      if (dedupSet.has(dedupKey)) {
        dedupSkipped++;
        continue;
      }
      dedupSet.add(dedupKey);

      // Determine function: check etymology
      let func: string | null = null;
      if (mmah.etymology?.phonetic && node.glyph === mmah.etymology.phonetic) {
        func = "phonetic";
      } else if (mmah.etymology?.semantic && node.glyph === mmah.etymology.semantic) {
        func = "semantic";
      } else {
        func = "remaining";
      }

      records.push({
        characterId: charId,
        componentId,
        position: node.position,
        function: func,
      });
    }
  }

  // ── Summary stats ──

  const funcCounts = { phonetic: 0, semantic: 0, remaining: 0 };
  const posCounts: Record<string, number> = {};
  for (const r of records) {
    if (r.function && funcCounts[r.function as keyof typeof funcCounts] !== undefined) {
      funcCounts[r.function as keyof typeof funcCounts]++;
    }
    if (r.position) {
      posCounts[r.position] = (posCounts[r.position] || 0) + 1;
    }
  }

  logger.info(`  Records: ${records.length}`);
  logger.info(`  Characters with decomposition: ${withDecomp}`);
  logger.info(`  Skipped (？unknown): ${skippedQuestion}`);
  logger.info(`  Skipped (no decomp): ${skippedNoDecomp}`);
  logger.info(`  Char not in Phase 2 set: ${charNotInSet}`);
  logger.info(`  Component not in component-entries: ${compNotInSet}`);
  logger.info(`  Non-CJK skipped: ${nonCjkSkipped}`);
  logger.info(`  Dedup skipped: ${dedupSkipped}`);
  logger.info(
    `  Function: phonetic=${funcCounts.phonetic}, semantic=${funcCounts.semantic}, remaining=${funcCounts.remaining}`,
  );
  logger.info(
    `  Positions: ${Object.entries(posCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k}=${v}`)
      .join(", ")}`,
  );

  // ── Write output ──

  logger.info("Writing output...");
  ensureDir(PHASE2_DIR);
  const outputPath = path.join(PHASE2_DIR, "character-components.json");
  writeJsonAtomic(outputPath, records);
  logger.info(`  ✅ Written ${records.length} character-component records`);

  // ── Summary ──

  logger.info("\n═══════════════════════════════════════════");
  logger.info("  ✅ Character Components Complete");
  logger.info("═══════════════════════════════════════════\n");
  logger.info(`  Character-Component records: ${records.length}`);
  logger.info(`  Input MMAH entries: ${mmahEntries.length}`);
  logger.info(`  Unique characters matched: ${new Set(records.map((r) => r.characterId)).size}`);
  logger.info(`  Unique components referenced: ${new Set(records.map((r) => r.componentId)).size}`);
  logger.info("");
}

main();
