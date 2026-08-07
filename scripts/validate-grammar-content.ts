/**
 * @file scripts/validate-grammar-content.ts
 * @description Authoring-time validation for content/seed/phase2/grammar-patterns.json
 * (Epic 22 — Grammar Pattern Library, Story 22.1).
 *
 * Mirrors scripts/validate-radical-content.ts: run before seeding to catch
 * malformed or referentially-broken grammar content.
 *
 * Checks:
 *   - pattern count >= 21; each pattern has name / structure / explanation,
 *     phase ∈ {2,3,4}, hskLevel ∈ 1–6 | null, content_id matching /^gr_\d{4}$/,
 *     numeric sortOrder, and metadata (family + hskSource).
 *   - each pattern >= 3 examples; each example has non-empty chinese / pinyin /
 *     english, a numeric sortOrder, and a segments array conforming to the token
 *     schema ({ text, pinyin, gloss, entityType, entityId }).
 *   - every non-null segments[].entityId resolves to an existing content_id in
 *     the characters/words authoring sources (cross-check) — a dead hub link
 *     would render a broken clickable token in the UI.
 *   - relations reference existing pattern content_ids and use a valid
 *     relationType (RELATED | CONTRASTS_WITH | PREREQUISITE).
 *
 * Run via: npm run validate:grammar-content  (or npx tsx scripts/validate-grammar-content.ts)
 * Exit code 1 on any violation.
 *
 * The pure helper functions below are unit-tested in
 * apps/backend/scripts/__tests__/validate-grammar-content.test.ts.
 */

import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PHASE2_DIR = join(__dirname, "../content/seed/phase2");
const GRAMMAR_FILE = join(PHASE2_DIR, "grammar-patterns.json");
const CHARACTERS_FILE = join(PHASE2_DIR, "characters.json");
const WORDS_FILE = join(PHASE2_DIR, "words.json");

// ── Types ──────────────────────────────────────────────────────────────────

export type GrammarSegment = {
  text: string;
  pinyin: string;
  gloss: string;
  entityType: "character" | "word" | null;
  entityId: string | null;
};

export type GrammarExampleRow = {
  content_id: string;
  chinese: string;
  pinyin: string;
  english: string;
  sortOrder: number;
  segments: GrammarSegment[];
};

export type GrammarPatternRow = {
  content_id: string;
  name: string;
  structure: string;
  explanation: string;
  phase: number;
  hskLevel: number | null;
  sortOrder: number;
  metadata?: { family?: unknown; hskSource?: unknown } | null;
  examples?: GrammarExampleRow[];
};

export type GrammarRelationRow = {
  fromPatternContentId: string;
  toPatternContentId: string;
  relationType: string;
};

export type GrammarFile = {
  patterns?: GrammarPatternRow[];
  relations?: GrammarRelationRow[];
};

// ── Pure validators (unit-tested) ──────────────────────────────────────────

const CONTENT_ID_RE = /^gr_\d{4}$/;
// Example ids are "gr_XXXX_exN" — no leading zero on the example index.
const EXAMPLE_ID_RE = /^gr_\d{4}_ex[1-9]\d*$/;
const PHASES = new Set([2, 3, 4]);
const RELATION_TYPES = new Set(["RELATED", "CONTRASTS_WITH", "PREREQUISITE"]);
const SEGMENT_ENTITY_TYPES = new Set(["character", "word", null]);

export function isValidContentId(id: unknown): boolean {
  return typeof id === "string" && CONTENT_ID_RE.test(id);
}

export function isValidExampleId(id: unknown): boolean {
  return typeof id === "string" && EXAMPLE_ID_RE.test(id);
}

export function isValidPhase(phase: unknown): boolean {
  return typeof phase === "number" && PHASES.has(phase);
}

export function isValidHskLevel(level: unknown): boolean {
  return (
    level === null ||
    (typeof level === "number" && Number.isInteger(level) && level >= 1 && level <= 6)
  );
}

export function isValidRelationType(relationType: unknown): boolean {
  return typeof relationType === "string" && RELATION_TYPES.has(relationType);
}

function isNonEmptyString(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Validate a segments array against the token schema. Returns a list of human-
 * readable violation messages (empty array = valid).
 */
export function validateSegments(segments: unknown): string[] {
  const violations: string[] = [];
  if (!Array.isArray(segments)) {
    return ["segments is not an array"];
  }
  segments.forEach((seg, i) => {
    const prefix = `segments[${i}]`;
    if (seg === null || typeof seg !== "object") {
      violations.push(`${prefix} is not an object`);
      return;
    }
    const s = seg as Record<string, unknown>;
    if (!isNonEmptyString(s.text)) violations.push(`${prefix}.text must be a non-empty string`);
    if (!isNonEmptyString(s.pinyin)) violations.push(`${prefix}.pinyin must be a non-empty string`);
    if (!isNonEmptyString(s.gloss)) violations.push(`${prefix}.gloss must be a non-empty string`);
    if (!SEGMENT_ENTITY_TYPES.has(s.entityType)) {
      violations.push(`${prefix}.entityType must be "character" | "word" | null`);
    }
    const type = s.entityType as "character" | "word" | null;
    if (type === null) {
      if (s.entityId !== null && s.entityId !== undefined) {
        violations.push(`${prefix}.entityId must be null when entityType is null`);
      }
    } else {
      if (typeof s.entityId !== "string" || s.entityId.length === 0) {
        violations.push(`${prefix}.entityId must be a non-empty content_id when entityType is set`);
      } else if (type === "character" && !s.entityId.startsWith("ch_")) {
        violations.push(
          `${prefix}.entityId "${s.entityId}" must be a ch_XXXXX character content_id`,
        );
      } else if (type === "word" && !s.entityId.startsWith("w_")) {
        violations.push(`${prefix}.entityId "${s.entityId}" must be a w_XXXXX word content_id`);
      }
    }
  });
  return violations;
}

/** Validate a single example row. Returns violation messages (empty = valid). */
export function validateExample(example: unknown, patternContentId: string): string[] {
  const violations: string[] = [];
  if (example === null || typeof example !== "object") {
    return ["example is not an object"];
  }
  const e = example as Record<string, unknown>;
  if (!isValidExampleId(e.content_id))
    violations.push(`example content_id must match /^gr_\\d{4}_ex\\d+$/ (got "${e.content_id}")`);
  if (!isNonEmptyString(e.chinese)) violations.push("example chinese must be a non-empty string");
  if (!isNonEmptyString(e.pinyin)) violations.push("example pinyin must be a non-empty string");
  if (!isNonEmptyString(e.english)) violations.push("example english must be a non-empty string");
  if (!isFiniteNumber(e.sortOrder)) violations.push("example sortOrder must be a number");
  const segViolations = validateSegments(e.segments);
  if (segViolations.length > 0) {
    violations.push(...segViolations.map((v) => `example ${e.content_id ?? "?"}: ${v}`));
  }
  return violations;
}

/**
 * Validate a single pattern row (structure + examples + metadata).
 * `validEntityIds` = the set of resolvable content_ids from the characters/words
 * authoring sources (authoring-time cross-check for segment entityIds).
 */
export function validatePattern(pattern: unknown, validEntityIds: Set<string>): string[] {
  const violations: string[] = [];
  if (pattern === null || typeof pattern !== "object") {
    return ["pattern is not an object"];
  }
  const p = pattern as Record<string, unknown>;
  const contentId = p.content_id;

  if (!isValidContentId(contentId))
    violations.push(`content_id must match /^gr_\\d{4}$/ (got "${contentId}")`);
  if (!isNonEmptyString(p.name))
    violations.push(`pattern ${contentId ?? "?"}: name must be a non-empty string`);
  if (!isNonEmptyString(p.structure))
    violations.push(`pattern ${contentId ?? "?"}: structure must be a non-empty string`);
  if (!isNonEmptyString(p.explanation))
    violations.push(`pattern ${contentId ?? "?"}: explanation must be a non-empty string`);
  if (!isValidPhase(p.phase))
    violations.push(`pattern ${contentId ?? "?"}: phase must be 2 | 3 | 4 (got ${p.phase})`);
  if (!isValidHskLevel(p.hskLevel))
    violations.push(
      `pattern ${contentId ?? "?"}: hskLevel must be 1–6 or null (got ${p.hskLevel})`,
    );
  if (!isFiniteNumber(p.sortOrder))
    violations.push(`pattern ${contentId ?? "?"}: sortOrder must be a number`);

  const meta = p.metadata as Record<string, unknown> | null | undefined;
  if (meta === null || typeof meta !== "object") {
    violations.push(
      `pattern ${contentId ?? "?"}: metadata object is required (family + hskSource)`,
    );
  } else {
    if (!isNonEmptyString(meta.family))
      violations.push(`pattern ${contentId ?? "?"}: metadata.family must be a non-empty string`);
    if (!isNonEmptyString(meta.hskSource))
      violations.push(`pattern ${contentId ?? "?"}: metadata.hskSource must be a non-empty string`);
  }

  const examples = p.examples;
  if (!Array.isArray(examples)) {
    violations.push(`pattern ${contentId ?? "?"}: examples must be an array (≥3 required)`);
  } else {
    if (examples.length < 3) {
      violations.push(
        `pattern ${contentId ?? "?"}: only ${examples.length} examples (minimum 3 required)`,
      );
    }
    for (const ex of examples) {
      violations.push(...validateExample(ex, contentId as string));
      if (ex !== null && typeof ex === "object") {
        const entityIds =
          (ex as { segments?: GrammarSegment[] }).segments
            ?.filter((s) => s.entityId != null)
            .map((s) => s.entityId) ?? [];
        for (const entityId of entityIds) {
          if (!validEntityIds.has(entityId as string)) {
            violations.push(
              `pattern ${contentId ?? "?"}: segment entityId "${entityId}" does not resolve to an existing character/word content_id`,
            );
          }
        }
      }
    }
  }
  return violations;
}

/** Validate a single relation row against the set of seeded pattern content_ids. */
export function validateRelation(relation: unknown, validPatternIds: Set<string>): string[] {
  const violations: string[] = [];
  if (relation === null || typeof relation !== "object") {
    return ["relation is not an object"];
  }
  const r = relation as Record<string, unknown>;
  const { fromPatternContentId, toPatternContentId, relationType } = r;
  if (!isValidContentId(fromPatternContentId)) {
    violations.push(
      `relation fromPatternContentId must match /^gr_\\d{4}$/ (got "${fromPatternContentId}")`,
    );
  } else if (!validPatternIds.has(fromPatternContentId)) {
    violations.push(
      `relation fromPatternContentId "${fromPatternContentId}" references an unknown pattern`,
    );
  }
  if (!isValidContentId(toPatternContentId)) {
    violations.push(
      `relation toPatternContentId must match /^gr_\\d{4}$/ (got "${toPatternContentId}")`,
    );
  } else if (!validPatternIds.has(toPatternContentId)) {
    violations.push(
      `relation toPatternContentId "${toPatternContentId}" references an unknown pattern`,
    );
  }
  if (!isValidRelationType(relationType)) {
    violations.push(
      `relation relationType must be RELATED | CONTRASTS_WITH | PREREQUISITE (got "${relationType}")`,
    );
  }
  if (fromPatternContentId === toPatternContentId) {
    violations.push(
      `relation cannot reference the same pattern on both ends (${fromPatternContentId})`,
    );
  }
  return violations;
}

// ── Runner (CLI entry) ─────────────────────────────────────────────────────

async function loadContentIds(): Promise<Set<string>> {
  const ids = new Set<string>();
  const chars = JSON.parse(await readFile(CHARACTERS_FILE, "utf-8")) as Array<{ id: string }>;
  for (const c of chars) ids.add(c.id);
  const words = JSON.parse(await readFile(WORDS_FILE, "utf-8")) as Array<{ id: string }>;
  for (const w of words) ids.add(w.id);
  return ids;
}

async function validateGrammarContent(): Promise<void> {
  let violations = 0;
  const report = (msg: string): void => {
    console.error(`❌ Violation: ${msg}`);
    violations++;
  };

  const grammar = JSON.parse(await readFile(GRAMMAR_FILE, "utf-8")) as GrammarFile;
  const patterns = grammar.patterns ?? [];
  const relations = grammar.relations ?? [];

  // 1. Overall count
  if (patterns.length < 21) {
    report(`grammar-patterns.json has ${patterns.length} patterns — minimum 21 required`);
  } else {
    console.log(`✅ ${patterns.length} patterns authored (target ≥21)`);
  }

  const validEntityIds = await loadContentIds();
  const validPatternIds = new Set(patterns.map((p) => p.content_id));

  // 2. Per-pattern checks (structure + examples + segment entityId cross-check)
  for (const p of patterns) {
    for (const v of validatePattern(p, validEntityIds)) report(v);
  }

  // 3. Duplicate content_id guard
  const seen = new Set<string>();
  for (const p of patterns) {
    if (seen.has(p.content_id)) report(`duplicate pattern content_id "${p.content_id}"`);
    seen.add(p.content_id);
  }

  // 4. Relation checks
  for (const r of relations) {
    for (const v of validateRelation(r, validPatternIds)) report(v);
  }

  if (violations > 0) {
    console.error(`\n❌ Grammar validation failed with ${violations} violation(s)`);
    process.exit(1);
  }
  console.log("✅ Grammar content valid — patterns, examples, segments, and relations all conform");
}

// Only run the CLI when executed directly (not when imported by tests).
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  validateGrammarContent().catch((err) => {
    console.error("Validation failed:", err);
    process.exit(1);
  });
}
