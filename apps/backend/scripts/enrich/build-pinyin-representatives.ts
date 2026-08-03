/**
 * @file apps/backend/scripts/enrich/build-pinyin-representatives.ts
 * @description Enrich 5.5: Stamp the deterministic per-syllable representative
 *   (representativeRank) onto every PinyinCharacterMapping row.
 *
 * Representative selection is the SINGLE source of truth for which glyph
 * represents each syllable at runtime (pinyin→character map + quiz strategies).
 * Order of precedence per syllable:
 *   1. Curated authoring entry (content/seed/curated/pinyin-representatives.json)
 *      → that (syllable, glyph) row is rank 0. When the curated entry declares
 *      `syntheticReading: true` and no genuine CEDICT-derived mapping row exists
 *      for that glyph/reading, the row is SYNTHESIZED as rank 0.
 *   2. Else deterministic tiebreak over the genuine candidates:
 *      hskLevel asc (null last) → frequencyRank asc (null last) →
 *      readingType "primary" first → characterId asc. First = rank 0.
 *   3. All remaining rows are ranked 0..n contiguous per syllable in the same
 *      deterministic order.
 *
 * Missing curated glyph/syllable in the regenerated data ⇒ FAIL LOUDLY (throw),
 * never warn — a stale curated entry must break the pipeline, not silently
 * produce a wrong representative.
 *
 * Reads:
 *   - content/seed/phase2/pinyin-character-mappings.json (from Enrich 3)
 *   - content/seed/phase2/characters.json (hskLevel, frequencyRank — from Enrich 5)
 *   - content/seed/phase1/pinyin-syllables.json
 *   - content/seed/curated/pinyin-representatives.json (AUTHORING input, never runtime-read)
 *
 * Writes: content/seed/phase2/pinyin-character-mappings.json (with representativeRank)
 *
 * Idempotent: pure JSON-to-JSON transform. Deterministic: identical inputs ⇒
 * identical output.
 *
 * Run: cd apps/backend && npx tsx scripts/enrich/build-pinyin-representatives.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { writeJsonAtomic, ensureDir } from "../utils.js";
import { scriptLogger } from "../logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = scriptLogger("enrich:pinyin-reps");

// ── Paths ──

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const PHASE1_DIR = path.join(PROJECT_ROOT, "content", "seed", "phase1");
const PHASE2_DIR = path.join(PROJECT_ROOT, "content", "seed", "phase2");
const CURATED_DIR = path.join(PROJECT_ROOT, "content", "seed", "curated");

// ── Types ──

export interface PinyinCharacterMappingRecord {
  pinyinSyllableId: string;
  characterId: string;
  readingType: "primary" | "secondary";
  isDefault: boolean;
  representativeRank: number;
}

export interface CharacterFacts {
  id: string;
  glyph: string;
  hskLevel: number | null;
  frequencyRank: number | null;
}

export interface CuratedRepresentative {
  syllablePretty: string;
  glyph: string;
  syntheticReading?: boolean;
}

export interface RepresentativeStats {
  syllablesRanked: number;
  curatedApplied: number;
  synthesizedRows: string[]; // "syllablePretty → glyph"
  allNullHskFreqSyllables: number; // syllables whose candidates ALL have null hsk+freq
}

export interface RepresentativeInput {
  mappings: Array<Omit<PinyinCharacterMappingRecord, "representativeRank">>;
  characters: CharacterFacts[];
  syllables: Array<{ syllablePretty: string }>;
  curated: CuratedRepresentative[];
}

// ── Pure logic (unit-testable) ──

/** Compare two nullable numbers, nulls LAST, ascending otherwise. */
function nullsLastNumberCompare(a: number | null, b: number | null): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a - b;
}

interface Candidate {
  characterId: string;
  readingType: string;
  hskLevel: number | null;
  frequencyRank: number | null;
}

/**
 * Deterministic tiebreak for representative selection:
 * hskLevel asc (null last) → frequencyRank asc (null last) →
 * readingType "primary" first → characterId asc.
 */
function compareCandidates(a: Candidate, b: Candidate): number {
  const hsk = nullsLastNumberCompare(a.hskLevel, b.hskLevel);
  if (hsk !== 0) return hsk;
  const freq = nullsLastNumberCompare(a.frequencyRank, b.frequencyRank);
  if (freq !== 0) return freq;
  const aPrimary = a.readingType === "primary" ? 0 : 1;
  const bPrimary = b.readingType === "primary" ? 0 : 1;
  if (aPrimary !== bPrimary) return aPrimary - bPrimary;
  return a.characterId.localeCompare(b.characterId);
}

/**
 * Stamp representativeRank on every mapping row. Pure — no I/O.
 *
 * @throws Error listing every curated entry that could not be honored
 *   (missing syllable in pinyin-syllables.json, or missing glyph in
 *   characters.json / in the genuine mappings without syntheticReading).
 */
export function computeRepresentativeRanks(input: RepresentativeInput): {
  mappings: PinyinCharacterMappingRecord[];
  stats: RepresentativeStats;
} {
  const { mappings, characters, syllables, curated } = input;

  // ── Build lookups ──

  const glyphToId = new Map<string, string>();
  const charById = new Map<string, CharacterFacts>();
  for (const ch of characters) {
    charById.set(ch.id, ch);
    // First glyph wins so curated glyphs resolve deterministically.
    if (!glyphToId.has(ch.glyph)) glyphToId.set(ch.glyph, ch.id);
  }

  // Syllable ids are derived the same way build-pinyin-mappings does:
  // ps_XXXXX (5-digit zero-padded index over phase1/pinyin-syllables.json).
  const syllablePrettyToId = new Map<string, string>();
  const syllableIdToPretty = new Map<string, string>();
  for (let i = 0; i < syllables.length; i++) {
    const id = `ps_${String(i + 1).padStart(5, "0")}`;
    syllablePrettyToId.set(syllables[i].syllablePretty, id);
    syllableIdToPretty.set(id, syllables[i].syllablePretty);
  }

  // ── Group rows by syllable (preserve input order; sort groups later) ──

  const rowsBySyllable = new Map<
    string,
    Array<Omit<PinyinCharacterMappingRecord, "representativeRank">>
  >();
  for (const m of mappings) {
    const rows = rowsBySyllable.get(m.pinyinSyllableId) ?? [];
    rows.push(m);
    rowsBySyllable.set(m.pinyinSyllableId, rows);
  }

  // ── Validate curated entries FIRST (fail loudly, collect ALL failures) ──
  // A curated entry must resolve to a real syllable + character, and either
  // have a genuine mapping row or declare syntheticReading. This pass also
  // catches curated syllables with NO genuine rows (synthetic-only syllables),
  // which the ranking loop would otherwise never visit.

  const failures: string[] = [];
  const curatedBySyllableId = new Map<
    string,
    { characterId: string; syntheticReading: boolean; glyph: string }
  >();
  for (const c of curated) {
    const syllableId = syllablePrettyToId.get(c.syllablePretty);
    if (!syllableId) {
      failures.push(`Curated syllable "${c.syllablePretty}" is not in pinyin-syllables.json`);
      continue;
    }
    const characterId = glyphToId.get(c.glyph);
    if (!characterId) {
      failures.push(
        `Curated glyph "${c.glyph}" for "${c.syllablePretty}" not found in characters.json`,
      );
      continue;
    }
    const hasGenuineRow = (rowsBySyllable.get(syllableId) ?? []).some(
      (m) => m.characterId === characterId,
    );
    if (!hasGenuineRow && !c.syntheticReading) {
      failures.push(
        `Curated glyph "${c.glyph}" for "${c.syllablePretty}" has no genuine mapping row and syntheticReading is not set`,
      );
      continue;
    }
    curatedBySyllableId.set(syllableId, {
      characterId,
      syntheticReading: c.syntheticReading === true,
      glyph: c.glyph,
    });
  }

  // ── Rank each syllable ──
  // Iterate the union of mapping-bearing syllables AND validated curated
  // syllables, so a synthetic-only curated syllable still emits its rank-0 row.

  const stats: RepresentativeStats = {
    syllablesRanked: 0,
    curatedApplied: 0,
    synthesizedRows: [],
    allNullHskFreqSyllables: 0,
  };

  const result: PinyinCharacterMappingRecord[] = [];
  const syllableIds = [
    ...new Set([...rowsBySyllable.keys(), ...curatedBySyllableId.keys()]),
  ].sort();

  for (const syllableId of syllableIds) {
    const candidates = rowsBySyllable.get(syllableId) ?? [];
    const syllablePretty = syllableIdToPretty.get(syllableId);
    const curatedEntry = curatedBySyllableId.get(syllableId);

    const withFacts: Candidate[] = candidates.map((m) => {
      const ch = charById.get(m.characterId);
      return {
        characterId: m.characterId,
        readingType: m.readingType,
        hskLevel: ch?.hskLevel ?? null,
        frequencyRank: ch?.frequencyRank ?? null,
      };
    });

    const allNullHskFreq =
      candidates.length > 0 &&
      withFacts.every((c) => c.hskLevel == null && c.frequencyRank == null);
    if (allNullHskFreq) stats.allNullHskFreqSyllables++;

    // ── Curated entry present ──
    if (curatedEntry) {
      const existingIndex = candidates.findIndex((m) => m.characterId === curatedEntry.characterId);

      // Curated row: use the genuine mapping row, or synthesize when the
      // curated entry declares syntheticReading (e.g. neutral "bai" → 掰 has
      // no CEDICT-derived reading).
      const curatedRow =
        existingIndex >= 0
          ? candidates[existingIndex]
          : {
              pinyinSyllableId: syllableId,
              characterId: curatedEntry.characterId,
              readingType: "primary" as const,
              isDefault: true,
            };

      result.push({ ...curatedRow, representativeRank: 0 });
      if (existingIndex < 0 && curatedEntry.syntheticReading) {
        stats.synthesizedRows.push(`${syllablePretty ?? syllableId} → ${curatedEntry.glyph}`);
      }

      // Remaining candidates follow the deterministic tiebreak (1..n).
      const orderedRemaining = candidates
        .filter((_, idx) => idx !== existingIndex)
        .map((m) => {
          const ch = charById.get(m.characterId);
          return { m, hskLevel: ch?.hskLevel ?? null, frequencyRank: ch?.frequencyRank ?? null };
        })
        .sort((a, b) =>
          compareCandidates(
            {
              characterId: a.m.characterId,
              readingType: a.m.readingType,
              hskLevel: a.hskLevel,
              frequencyRank: a.frequencyRank,
            },
            {
              characterId: b.m.characterId,
              readingType: b.m.readingType,
              hskLevel: b.hskLevel,
              frequencyRank: b.frequencyRank,
            },
          ),
        )
        .map(({ m }) => m);
      orderedRemaining.forEach((m, idx) => {
        result.push({ ...m, representativeRank: idx + 1 });
      });

      stats.curatedApplied++;
      stats.syllablesRanked++;
      continue;
    }

    // ── No curated entry — deterministic tiebreak ──
    const ordered = withFacts
      .map((c) => ({ m: candidates.find((m) => m.characterId === c.characterId)!, ...c }))
      .sort((a, b) => compareCandidates(a, b))
      .map(({ m }) => m);
    ordered.forEach((m, idx) => {
      result.push({ ...m, representativeRank: idx });
    });
    stats.syllablesRanked++;
  }

  if (failures.length > 0) {
    throw new Error(
      `build-pinyin-representatives: ${failures.length} curated failure(s):\n  - ${failures.join("\n  - ")}`,
    );
  }

  return { mappings: result, stats };
}

// ── Main (standalone entry) ──

async function main(): Promise<void> {
  logger.info("📦 Build Pinyin Representatives (Enrich 5.5)");
  logger.info("═══════════════════════════════════════════════\n");

  // ── Load inputs ──

  const mappingsPath = path.join(PHASE2_DIR, "pinyin-character-mappings.json");
  if (!fs.existsSync(mappingsPath)) {
    logger.error(
      "  ❌ Phase 2 pinyin-character-mappings.json not found — run Enrich 3 first",
      new Error("Missing pinyin-character-mappings.json"),
    );
    process.exit(1);
  }
  const mappings: Array<Omit<PinyinCharacterMappingRecord, "representativeRank">> = JSON.parse(
    fs.readFileSync(mappingsPath, "utf-8"),
  );
  logger.info(`  📄 Pinyin character mappings: ${mappings.length}`);

  const charsPath = path.join(PHASE2_DIR, "characters.json");
  if (!fs.existsSync(charsPath)) {
    logger.error(
      "  ❌ Phase 2 characters.json not found — run Enrich 5 (build-word-character-junction) first",
      new Error("Missing characters.json"),
    );
    process.exit(1);
  }
  const characters: CharacterFacts[] = JSON.parse(fs.readFileSync(charsPath, "utf-8"));
  logger.info(`  📄 Characters: ${characters.length}`);

  const syllablesPath = path.join(PHASE1_DIR, "pinyin-syllables.json");
  const syllables: Array<{ syllablePretty: string }> = JSON.parse(
    fs.readFileSync(syllablesPath, "utf-8"),
  );
  logger.info(`  📄 Pinyin syllables: ${syllables.length}`);

  const curatedPath = path.join(CURATED_DIR, "pinyin-representatives.json");
  const curated: CuratedRepresentative[] = fs.existsSync(curatedPath)
    ? JSON.parse(fs.readFileSync(curatedPath, "utf-8"))
    : [];
  logger.info(`  📄 Curated representatives: ${curated.length}`);

  // ── Compute ranks ──

  const { mappings: ranked, stats } = computeRepresentativeRanks({
    mappings,
    characters,
    syllables,
    curated,
  });

  // ── Write output ──

  ensureDir(PHASE2_DIR);
  writeJsonAtomic(mappingsPath, ranked);
  logger.info(`  ✅ Written ${ranked.length} ranked mappings to ${mappingsPath}`);

  logger.info("\n═══════════════════════════════════════════════");
  logger.info("  ✅ Pinyin Representatives Complete");
  logger.info("═══════════════════════════════════════════════\n");
  logger.info(`  Syllables ranked: ${stats.syllablesRanked}`);
  logger.info(`  Curated applied:  ${stats.curatedApplied}`);
  if (stats.synthesizedRows.length > 0) {
    logger.info(`  Synthesized rows: ${stats.synthesizedRows.join(", ")}`);
  }
  logger.info(
    `  Syllables with ALL null hsk+freq: ${stats.allNullHskFreqSyllables} (tiebreak falls to readingType/characterId)`,
  );
  logger.info("");
}

// Auto-detect: run directly if this file is the entry point (allows unit-test
// imports without executing main()).
const isStandalone =
  process.argv[1] &&
  (fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) ||
    import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, "/")));

if (isStandalone) {
  main().catch((e: Error) => {
    logger.error(`❌ Failed: ${e.message}`, e);
    process.exit(1);
  });
}
