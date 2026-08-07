/**
 * @file scripts/validate-chengyu-content.ts
 * @description Authoring-time validation for content/seed/phase2/chengyu.json
 * (Epic 23 — Chengyu/Idiom Narratives, Story 23.1).
 *
 * Mirrors scripts/validate-grammar-content.ts: run before seeding to catch
 * malformed or referentially-broken chengyu content.
 *
 * Checks:
 *   - idiom count >= 50; each idiom has a /^cy_\d{4}$/ content_id, an exactly-
 *     4-CJK chengyu, non-empty pinyin / literalMeaning / figurativeMeaning /
 *     story / storySource, present era + theme, numeric sortOrder, metadata
 *     with a source, and >= 1 example (each with non-empty chinese / pinyin /
 *     english, a numeric sortOrder, and a segments array conforming to the
 *     token schema).
 *   - Source-aware `storySource` — must start with 《 + one of the KNOWN_WORKS
 *     classical-work keys (the story-23.1 IMP era table, expanded to cover the
 *     cited works), anchoring the citation to a known classical work.
 *   - Source-aware idiom chars — each of the idiom's 4 glyphs must resolve to
 *     an id in characters.json via glyph→id lookup (NEVER assuming ch_ =
 *     codepoint; 釜 = ch_46225, not U+91DC).
 *   - Source-aware pinyin syllables — every space-separated token of the idiom
 *     pinyin and each example.pinyin must normalize to a known syllable in
 *     pinyin-syllables.json (tone-mark stripping preserves ü; j/q/x + final
 *     u/ue → ü per the dataset's orthography).
 *   - segments token schema ({ text, pinyin, gloss, entityType, entityId }),
 *     ch_/w_ prefixes, dead-entity cross-check (entityId resolves to a
 *     characters.json/words.json id).
 *   - duplicate content_id guard; relations validity (RELATED |
 *     CONTRASTS_WITH | PREREQUISITE, no self-loops, both ends known).
 *
 * Run via: npm run validate:chengyu-content  (or npx tsx scripts/validate-chengyu-content.ts)
 * Exit code 1 on any violation.
 *
 * The pure helper functions below are unit-tested in
 * apps/backend/scripts/__tests__/validate-chengyu-content.test.ts.
 */

import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PHASE2_DIR = join(__dirname, "../content/seed/phase2");
const CHENGYU_FILE = join(PHASE2_DIR, "chengyu.json");
const CHARACTERS_FILE = join(PHASE2_DIR, "characters.json");
const WORDS_FILE = join(PHASE2_DIR, "words.json");
const PINYIN_SYLLABLES_FILE = join(PHASE2_DIR, "pinyin-syllables.json");

// ── Types ──────────────────────────────────────────────────────────────────

export type ChengyuSegment = {
  text: string;
  pinyin: string;
  gloss: string;
  entityType: "character" | "word" | null;
  entityId: string | null;
};

export type ChengyuExampleRow = {
  content_id: string;
  chinese: string;
  pinyin: string;
  english: string;
  sortOrder: number;
  segments: ChengyuSegment[];
};

export type ChengyuRow = {
  content_id: string;
  chengyu: string;
  pinyin: string;
  literalMeaning: string;
  figurativeMeaning: string;
  story: string;
  storySource: string;
  era: string;
  theme: string;
  sortOrder: number;
  metadata?: { source?: unknown; [key: string]: unknown } | null;
  examples?: ChengyuExampleRow[];
};

export type ChengyuRelationRow = {
  fromChengyuContentId: string;
  toChengyuContentId: string;
  relationType: string;
};

export type ChengyuFile = {
  idioms?: ChengyuRow[];
  relations?: ChengyuRelationRow[];
};

// ── Known classical works (storySource anchor) ─────────────────────────────
// The story-23.1 IMP era table's KNOWN_WORKS keys (16-row starter set) PLUS the
// expansions needed to truthfully cite the mandatory KB §6.2 family and the
// IMP shortlist members (瓜田李下→乐府诗集, 叶公好龙→新序, 画龙点睛→历代名画记,
// 对牛弹琴→牟子理惑论). See the story-23.1 report for the deviation note.
export const KNOWN_WORKS: readonly string[] = [
  "周易",
  "诗经",
  "论语",
  "左传",
  "楚辞",
  "孟子",
  "庄子",
  "列子",
  "韩非子",
  "吕氏春秋",
  "战国策",
  "史记",
  "淮南子",
  "汉书",
  "三国志",
  "世说新语",
  // Story 23.1 expansions (beyond the IMP 16-row starter set)
  "新序",
  "乐府诗集",
  "牟子理惑论",
  "历代名画记",
];

// ── Pure validators (unit-tested) ──────────────────────────────────────────

const CONTENT_ID_RE = /^cy_\d{4}$/;
const EXAMPLE_ID_RE = /^cy_\d{4}_ex[1-9]\d*$/;
const FOUR_CJK_RE = /^[\u3400-\u9FFF]{4}$/;
const RELATION_TYPES = new Set(["RELATED", "CONTRASTS_WITH", "PREREQUISITE"]);
const SEGMENT_ENTITY_TYPES = new Set(["character", "word", null]);

export function isValidChengyuId(id: unknown): boolean {
  return typeof id === "string" && CONTENT_ID_RE.test(id);
}

export function isValidChengyuExampleId(id: unknown): boolean {
  return typeof id === "string" && EXAMPLE_ID_RE.test(id);
}

export function isExactly4Cjk(s: unknown): boolean {
  return typeof s === "string" && FOUR_CJK_RE.test(s);
}

export function isValidRelationType(relationType: unknown): boolean {
  return typeof relationType === "string" && RELATION_TYPES.has(relationType);
}

/** True when the storySource cites a KNOWN_WORKS classical work (《<work> prefix). */
export function isValidStorySource(storySource: unknown): boolean {
  return (
    typeof storySource === "string" && KNOWN_WORKS.some((w) => storySource.startsWith(`《${w}`))
  );
}

// ── Pinyin-syllable normalization ──────────────────────────────────────────

const TONE_MAP: Record<string, string> = {
  ā: "a",
  á: "a",
  ǎ: "a",
  à: "a",
  ē: "e",
  é: "e",
  ě: "e",
  è: "e",
  ī: "i",
  í: "i",
  ǐ: "i",
  ì: "i",
  ō: "o",
  ó: "o",
  ǒ: "o",
  ò: "o",
  ū: "u",
  ú: "u",
  ǔ: "u",
  ù: "u",
  ǖ: "ü",
  ǘ: "ü",
  ǚ: "ü",
  ǜ: "ü",
  ü: "ü",
};

/** Strip tone marks from a pinyin syllable, PRESERVING ü (nǚ → nü, not nu). */
export function stripToneMarks(syllable: string): string {
  return syllable.toLowerCase().replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/g, (c) => TONE_MAP[c] ?? c);
}

/**
 * Normalize a tone-marked pinyin syllable to the canonical form used by
 * pinyin-syllables.json: lowercase + strip tone marks (ü preserved) + CC-CEDICT
 * `u:` → `ü` + the j/q/x + FINAL u/ue → ü orthographic rule (the dataset spells
 * jū as `jü`, xué as `xüe`; ua/uan/uang/ui/un stay plain).
 */
export function normalizePinyinSyllable(syllable: string): string {
  let s = stripToneMarks(syllable);
  s = s.replace(/u:/g, "ü");
  s = s.replace(/^([jqx])u(e)?$/, (_m, init: string, tail?: string) => init + "ü" + (tail ?? ""));
  return s;
}

/** True when every space-separated pinyin token normalizes to a known syllable. */
export function isValidPinyin(pinyin: unknown, knownSyllables: Set<string>): boolean {
  if (typeof pinyin !== "string" || pinyin.trim().length === 0) return false;
  const tokens = pinyin.trim().split(/\s+/);
  return tokens.every((t) => knownSyllables.has(normalizePinyinSyllable(t)));
}

// ── segments schema ────────────────────────────────────────────────────────

function isNonEmptyString(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value);
}

/** Validate a segments array against the token schema. Returns violation messages (empty = valid). */
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
export function validateChengyuExample(example: unknown, idiomContentId: string): string[] {
  const violations: string[] = [];
  if (example === null || typeof example !== "object") {
    return ["example is not an object"];
  }
  const e = example as Record<string, unknown>;
  if (!isValidChengyuExampleId(e.content_id))
    violations.push(`example content_id must match /^cy_\\d{4}_ex\\d+$/ (got "${e.content_id}")`);
  if (
    typeof e.content_id === "string" &&
    e.content_id.startsWith("cy_") &&
    !e.content_id.startsWith(`${idiomContentId}_`)
  )
    violations.push(
      `example content_id must start with "${idiomContentId}_" (got "${e.content_id}")`,
    );
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
 * Validate a single idiom row (structure + examples + metadata + source-aware
 * char/pinyin/storySource checks). `glyphToId` = characters.json glyph→id map;
 * `knownSyllables` = pinyin-syllables.json syllable-without-digit set;
 * `validEntityIds` = resolvable characters/words content_ids (dead-link check).
 */
export function validateChengyuIdiom(
  idiom: unknown,
  ctx: {
    glyphToId: Map<string, string>;
    knownSyllables: Set<string>;
    validEntityIds: Set<string>;
  },
): string[] {
  const violations: string[] = [];
  if (idiom === null || typeof idiom !== "object") {
    return ["idiom is not an object"];
  }
  const c = idiom as Record<string, unknown>;
  const contentId = c.content_id;

  if (!isValidChengyuId(contentId))
    violations.push(`content_id must match /^cy_\\d{4}$/ (got "${contentId}")`);
  if (!isExactly4Cjk(c.chengyu))
    violations.push(
      `idiom ${contentId ?? "?"}: chengyu must be exactly 4 CJK chars (got "${c.chengyu}")`,
    );
  if (!isNonEmptyString(c.pinyin))
    violations.push(`idiom ${contentId ?? "?"}: pinyin must be a non-empty string`);
  if (!isNonEmptyString(c.literalMeaning))
    violations.push(`idiom ${contentId ?? "?"}: literalMeaning must be a non-empty string`);
  if (!isNonEmptyString(c.figurativeMeaning))
    violations.push(`idiom ${contentId ?? "?"}: figurativeMeaning must be a non-empty string`);
  if (!isNonEmptyString(c.story))
    violations.push(`idiom ${contentId ?? "?"}: story must be a non-empty string`);
  if (!isNonEmptyString(c.storySource))
    violations.push(`idiom ${contentId ?? "?"}: storySource must be a non-empty string`);
  if (!isNonEmptyString(c.era)) violations.push(`idiom ${contentId ?? "?"}: era must be present`);
  if (!isNonEmptyString(c.theme))
    violations.push(`idiom ${contentId ?? "?"}: theme must be present`);
  if (!isFiniteNumber(c.sortOrder))
    violations.push(`idiom ${contentId ?? "?"}: sortOrder must be a number`);

  // metadata.source provenance
  const meta = c.metadata as Record<string, unknown> | null | undefined;
  if (meta === null || typeof meta !== "object") {
    violations.push(`idiom ${contentId ?? "?"}: metadata object is required (source provenance)`);
  } else if (!isNonEmptyString(meta.source)) {
    violations.push(`idiom ${contentId ?? "?"}: metadata.source must be a non-empty string`);
  }

  // Source-aware: storySource must cite a KNOWN_WORKS classical work.
  if (!isValidStorySource(c.storySource)) {
    violations.push(
      `idiom ${contentId ?? "?"}: storySource must start with 《 + a KNOWN_WORKS work (got "${c.storySource}")`,
    );
  }

  // Source-aware: each of the idiom's 4 glyphs must resolve via glyph→id lookup.
  if (typeof c.chengyu === "string" && isExactly4Cjk(c.chengyu)) {
    for (const glyph of Array.from(c.chengyu)) {
      if (!ctx.glyphToId.has(glyph)) {
        violations.push(
          `idiom ${contentId ?? "?"}: glyph "${glyph}" does not resolve to a characters.json id (Character-Hub cross-link would break)`,
        );
      }
    }
  }

  // Source-aware: idiom pinyin syllables must normalize to pinyin-syllables.json.
  if (isNonEmptyString(c.pinyin) && !isValidPinyin(c.pinyin, ctx.knownSyllables)) {
    violations.push(
      `idiom ${contentId ?? "?"}: pinyin "${c.pinyin}" has a syllable not in pinyin-syllables.json`,
    );
  }

  // Examples (>= 1 required) + per-example pinyin/entity checks.
  const examples = c.examples;
  if (!Array.isArray(examples)) {
    violations.push(`idiom ${contentId ?? "?"}: examples must be an array (≥1 required)`);
  } else {
    if (examples.length < 1) {
      violations.push(`idiom ${contentId ?? "?"}: at least 1 example required`);
    }
    for (const ex of examples) {
      violations.push(...validateChengyuExample(ex, contentId as string));
      if (ex !== null && typeof ex === "object") {
        const e = ex as { pinyin?: unknown; segments?: ChengyuSegment[] };
        if (!isValidPinyin(e.pinyin, ctx.knownSyllables)) {
          violations.push(
            `idiom ${contentId ?? "?"}: example pinyin "${e.pinyin}" has a syllable not in pinyin-syllables.json`,
          );
        }
        const entityIds =
          e.segments?.filter((s) => s.entityId != null).map((s) => s.entityId) ?? [];
        for (const entityId of entityIds) {
          if (!ctx.validEntityIds.has(entityId as string)) {
            violations.push(
              `idiom ${contentId ?? "?"}: segment entityId "${entityId}" does not resolve to an existing character/word content_id`,
            );
          }
        }
      }
    }
  }

  return violations;
}

/** Validate a single relation row against the set of authored idiom content_ids. */
export function validateChengyuRelation(relation: unknown, validIdiomIds: Set<string>): string[] {
  const violations: string[] = [];
  if (relation === null || typeof relation !== "object") {
    return ["relation is not an object"];
  }
  const r = relation as Record<string, unknown>;
  const { fromChengyuContentId, toChengyuContentId, relationType } = r;
  if (!isValidChengyuId(fromChengyuContentId)) {
    violations.push(
      `relation fromChengyuContentId must match /^cy_\\d{4}$/ (got "${fromChengyuContentId}")`,
    );
  } else if (!validIdiomIds.has(fromChengyuContentId)) {
    violations.push(
      `relation fromChengyuContentId "${fromChengyuContentId}" references an unknown idiom`,
    );
  }
  if (!isValidChengyuId(toChengyuContentId)) {
    violations.push(
      `relation toChengyuContentId must match /^cy_\\d{4}$/ (got "${toChengyuContentId}")`,
    );
  } else if (!validIdiomIds.has(toChengyuContentId)) {
    violations.push(
      `relation toChengyuContentId "${toChengyuContentId}" references an unknown idiom`,
    );
  }
  if (!isValidRelationType(relationType)) {
    violations.push(
      `relation relationType must be RELATED | CONTRASTS_WITH | PREREQUISITE (got "${relationType}")`,
    );
  }
  if (fromChengyuContentId === toChengyuContentId) {
    violations.push(
      `relation cannot reference the same idiom on both ends (${fromChengyuContentId})`,
    );
  }
  return violations;
}

// ── Runner (CLI entry) ─────────────────────────────────────────────────────

async function loadGlyphToId(): Promise<Map<string, string>> {
  const chars = JSON.parse(await readFile(CHARACTERS_FILE, "utf-8")) as Array<{
    id: string;
    glyph: string;
  }>;
  return new Map(chars.map((c) => [c.glyph, c.id]));
}

async function loadSyllableSet(): Promise<Set<string>> {
  const syls = JSON.parse(await readFile(PINYIN_SYLLABLES_FILE, "utf-8")) as Array<{
    syllable: string;
  }>;
  // "syllable-without-digit set" — drop the trailing tone digit (ba1 → ba).
  return new Set(syls.map((s) => s.syllable.slice(0, -1)));
}

async function loadEntityIds(): Promise<Set<string>> {
  const ids = new Set<string>();
  const chars = JSON.parse(await readFile(CHARACTERS_FILE, "utf-8")) as Array<{ id: string }>;
  for (const c of chars) ids.add(c.id);
  const words = JSON.parse(await readFile(WORDS_FILE, "utf-8")) as Array<{ id: string }>;
  for (const w of words) ids.add(w.id);
  return ids;
}

async function validateChengyuContent(): Promise<void> {
  let violations = 0;
  const report = (msg: string): void => {
    console.error(`❌ Violation: ${msg}`);
    violations++;
  };

  const chengyu = JSON.parse(await readFile(CHENGYU_FILE, "utf-8")) as ChengyuFile;
  const idioms = chengyu.idioms ?? [];
  const relations = chengyu.relations ?? [];

  // 1. Overall count
  if (idioms.length < 50) {
    report(`chengyu.json has ${idioms.length} idioms — minimum 50 required`);
  } else {
    console.log(`✅ ${idioms.length} idioms authored (target ≥50)`);
  }

  const glyphToId = await loadGlyphToId();
  const knownSyllables = await loadSyllableSet();
  const validEntityIds = await loadEntityIds();
  const validIdiomIds = new Set(idioms.map((i) => i.content_id));

  // 2. Per-idiom checks (structure + examples + source-aware char/pinyin/storySource)
  for (const i of idioms) {
    for (const v of validateChengyuIdiom(i, { glyphToId, knownSyllables, validEntityIds })) {
      report(v);
    }
  }

  // 3. Duplicate content_id guard
  const seen = new Set<string>();
  for (const i of idioms) {
    if (seen.has(i.content_id)) report(`duplicate idiom content_id "${i.content_id}"`);
    seen.add(i.content_id);
  }

  // 4. Relation checks
  for (const r of relations) {
    for (const v of validateChengyuRelation(r, validIdiomIds)) report(v);
  }

  if (violations > 0) {
    console.error(`\n❌ Chengyu validation failed with ${violations} violation(s)`);
    process.exit(1);
  }
  console.log(
    "✅ Chengyu content valid — idioms, examples, segments, pinyin, and relations all conform",
  );
}

// Only run the CLI when executed directly (not when imported by tests).
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  validateChengyuContent().catch((err) => {
    console.error("Validation failed:", err);
    process.exit(1);
  });
}
