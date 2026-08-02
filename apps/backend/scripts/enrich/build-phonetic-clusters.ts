/**
 * @file apps/backend/scripts/enrich/build-phonetic-clusters.ts
 * @description Enrich: Generate PhoneticCluster + PhoneticClusterMember seed
 *   data from phase2 character phonetic-component relationships.
 *
 * Reads:
 *   - content/seed/phase2/characters.json — characters carrying phoneticComponentId (ch_-prefixed IDs)
 *   - content/seed/phase2/component-entries.json — component glyph → cmp_XXX id
 *   - content/seed/phase2/phonetic-clusters.json — existing hand-curated clusters (preserved verbatim)
 *   - content/seed/phase2/phonetic-cluster-members.json — existing members (preserved verbatim)
 *
 * Writes:
 *   - content/seed/phase2/phonetic-clusters.json
 *   - content/seed/phase2/phonetic-cluster-members.json
 *
 * How it works:
 *   1. Group characters by their phoneticComponentId — the same self-relation
 *      that powers GET /v1/characters/:glyph/phonetic (Story 21.10).
 *   2. Map each phonetic component character to a Component (cmp_XXX) by glyph
 *      (PhoneticCluster.componentId is an FK to Component.id).
 *   3. Require the component glyph to have a pinyin reading.
 *   4. Rank families by member count (descending) and emit the top N
 *      (default 10) as new clusters, skipping component IDs already covered
 *      by the preserved hand-curated clusters.
 *   This meets the Story 21.19 Phase 2 "top 10 families" preview target.
 *
 * Idempotent: pure JSON-to-JSON transform with deterministic ordering.
 *
 * Run: cd apps/backend && npx tsx scripts/enrich/build-phonetic-clusters.ts
 *      npx tsx scripts/enrich/build-phonetic-clusters.ts --top 25 --min-members 3
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { writeJsonAtomic, ensureDir } from "../utils.js";
import { scriptLogger } from "../logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = scriptLogger("enrich:phonetic-clusters");

// ── Paths ──

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const PHASE2_DIR = path.join(PROJECT_ROOT, "content", "seed", "phase2");

// ── CLI args ──

function parseArg(name: string, fallback: number): number {
  const idx = process.argv.indexOf(name);
  if (idx !== -1 && process.argv[idx + 1]) {
    const parsed = Number(process.argv[idx + 1]);
    if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
  }
  return fallback;
}

// ── Types ──

interface Phase2Character {
  id: string;
  glyph: string;
  strokeCount: number | null;
  classification: string | null;
  etymology: string | null;
  readings: Array<{ pinyin: string; tone: number; type: string; coreMeaning?: string | null }>;
  hskLevel: number | null;
  frequencyRank: number | null;
  commonWords: string[] | null;
  phoneticComponentId: string | null;
  coreMeaning: string | null;
}

interface ComponentEntry {
  id: string; // "cmp_XXX"
  glyph: string;
  meaning: string | null;
  type: string | null;
  variantOf: string | null;
  strokes: number | null;
}

interface PhoneticCluster {
  id: string; // "pc_XXXX"
  componentId: string; // "cmp_XXX"
  displayOrder: number;
  description: string;
  pronunciationNote: string | null;
  phoneticPinyin: string | null;
}

interface PhoneticClusterMember {
  clusterId: string;
  characterId: string; // Character glyph
  sequenceOrder: number;
}

// ── Helpers ──

/** Strip tone marks so readings can be compared tone-insensitively. */
function stripToneMarks(syllable: string): string {
  return syllable
    .replace(/[āáǎà]/g, "a")
    .replace(/[ōóǒò]/g, "o")
    .replace(/[ēéěè]/g, "e")
    .replace(/[īíǐì]/g, "i")
    .replace(/[ūúǔù]/g, "u")
    .replace(/[ǖǘǚǜ]/g, "ü");
}

/**
 * Build a data-derived pronunciation note for a generated family.
 * Counts members whose primary reading keeps the component's pinyin
 * (tone-insensitive) versus those showing phonetic drift.
 */
function buildPronunciationNote(componentPinyin: string, members: Phase2Character[]): string {
  const base = stripToneMarks(componentPinyin);
  let same = 0;
  for (const m of members) {
    const first = m.readings?.[0]?.pinyin;
    if (first && stripToneMarks(first) === base) same++;
  }
  if (same === members.length) {
    return `All ${members.length} members share the ${componentPinyin} reading (tones vary)`;
  }
  if (same === 0) {
    return `${members.length} characters built on the ${componentPinyin} phonetic component, with notable sound drift`;
  }
  return `${same} of ${members.length} members keep the ${componentPinyin} reading; the rest show phonetic drift`;
}

// ── Main ──

function main(): void {
  logger.info("📦 Build Phonetic Clusters");
  logger.info("═══════════════════════════\n");

  const topN = parseArg("--top", 10);
  const minMembers = parseArg("--min-members", 3);
  logger.info(`Config: --top ${topN}, --min-members ${minMembers}`);

  ensureDir(PHASE2_DIR);

  const charactersPath = path.join(PHASE2_DIR, "characters.json");
  const componentsPath = path.join(PHASE2_DIR, "component-entries.json");
  const clustersPath = path.join(PHASE2_DIR, "phonetic-clusters.json");
  const membersPath = path.join(PHASE2_DIR, "phonetic-cluster-members.json");

  logger.info("Loading inputs...");
  const characters: Phase2Character[] = JSON.parse(fs.readFileSync(charactersPath, "utf-8"));
  const components: ComponentEntry[] = JSON.parse(fs.readFileSync(componentsPath, "utf-8"));
  const existingClusters: PhoneticCluster[] = fs.existsSync(clustersPath)
    ? JSON.parse(fs.readFileSync(clustersPath, "utf-8"))
    : [];
  const existingMembers: PhoneticClusterMember[] = fs.existsSync(membersPath)
    ? JSON.parse(fs.readFileSync(membersPath, "utf-8"))
    : [];

  logger.info(`  📄 Characters: ${characters.length}`);
  logger.info(`  📄 Component entries: ${components.length}`);
  logger.info(`  📄 Existing curated clusters: ${existingClusters.length}`);

  // Indexes
  const charById = new Map(characters.map((c) => [c.id, c]));
  const compGlyphToId = new Map(components.map((c) => [c.glyph, c.id]));
  const coveredComponentIds = new Set(existingClusters.map((c) => c.componentId));

  // Group characters by their phonetic component (self-relation on Character.id)
  const groups = new Map<string, Phase2Character[]>();
  for (const c of characters) {
    if (!c.phoneticComponentId) continue;
    const arr = groups.get(c.phoneticComponentId) ?? [];
    arr.push(c);
    groups.set(c.phoneticComponentId, arr);
  }
  logger.info(`  📄 Distinct phonetic component targets: ${groups.size}`);

  // Build ranked candidates
  interface Candidate {
    glyph: string;
    compId: string;
    pinyin: string;
    members: Phase2Character[];
  }
  const candidates: Candidate[] = [];
  let skippedNoComponent = 0;
  let skippedNoPinyin = 0;
  let skippedTooSmall = 0;
  let skippedCovered = 0;

  for (const [pid, members] of groups) {
    const pc = charById.get(pid);
    if (!pc) continue;
    const compId = compGlyphToId.get(pc.glyph);
    if (!compId) {
      skippedNoComponent++;
      continue;
    }
    if (coveredComponentIds.has(compId)) {
      skippedCovered++;
      continue;
    }
    const pinyin = pc.readings?.[0]?.pinyin ?? "";
    if (!pinyin) {
      skippedNoPinyin++;
      continue;
    }
    if (members.length < minMembers) {
      skippedTooSmall++;
      continue;
    }
    candidates.push({
      glyph: pc.glyph,
      compId,
      pinyin,
      members: [...members].sort((a, b) => a.glyph.localeCompare(b.glyph)),
    });
  }

  // Deterministic ranking: member count desc, then glyph asc
  candidates.sort((a, b) => {
    if (b.members.length !== a.members.length) return b.members.length - a.members.length;
    return a.glyph.localeCompare(b.glyph);
  });

  const selected = candidates.slice(0, topN);
  logger.info(`  Ranked ${candidates.length} candidate families; selecting top ${selected.length}`);
  logger.info(`  Skipped: no component map=${skippedNoComponent}, no pinyin=${skippedNoPinyin},`);
  logger.info(
    `           too small (<${minMembers})=${skippedTooSmall}, covered by curated=${skippedCovered}`,
  );

  // Determine next id + displayOrder (preserve curated numbering)
  const maxPcNum = existingClusters.reduce((max, c) => {
    const m = /^pc_(\d+)$/.exec(c.id);
    return m ? Math.max(max, Number(m[1])) : max;
  }, 0);
  const maxDisplayOrder = existingClusters.reduce((max, c) => Math.max(max, c.displayOrder), 0);

  const newClusters: PhoneticCluster[] = [];
  const newMembers: PhoneticClusterMember[] = [];
  selected.forEach((cand, idx) => {
    const clusterId = `pc_${String(maxPcNum + idx + 1).padStart(4, "0")}`;
    const displayOrder = maxDisplayOrder + idx + 1;
    newClusters.push({
      id: clusterId,
      componentId: cand.compId,
      displayOrder,
      description: `Characters containing ${cand.glyph} as phonetic component`,
      pronunciationNote: buildPronunciationNote(cand.pinyin, cand.members),
      phoneticPinyin: cand.pinyin,
    });
    cand.members.forEach((m, mi) => {
      newMembers.push({
        clusterId,
        characterId: m.glyph,
        sequenceOrder: mi + 1,
      });
    });
    logger.info(
      `  🆕 ${clusterId} | ${cand.glyph} | ${cand.pinyin} | ${cand.compId} | ${cand.members.length} members`,
    );
  });

  const allClusters = [...existingClusters, ...newClusters];
  const allMembers = [...existingMembers, ...newMembers];

  logger.info("Writing output...");
  writeJsonAtomic(clustersPath, allClusters);
  writeJsonAtomic(membersPath, allMembers);

  logger.info("\n═══════════════════════════════════════════");
  logger.info("  ✅ Phonetic Clusters Complete");
  logger.info("═══════════════════════════════════════════\n");
  logger.info(`  Curated clusters preserved: ${existingClusters.length}`);
  logger.info(`  Generated clusters added: ${newClusters.length}`);
  logger.info(`  Total clusters: ${allClusters.length}`);
  logger.info(`  Total members: ${allMembers.length}`);
  logger.info("");
}

main();
