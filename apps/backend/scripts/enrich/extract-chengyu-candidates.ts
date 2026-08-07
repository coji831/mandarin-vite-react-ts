/**
 * @file apps/backend/scripts/enrich/extract-chengyu-candidates.ts
 * @description Epic 23 (Story 23.1) — ENRICH-phase (phase-2) generation script
 * that scaffolds the chengyu authoring draft from the phase-1 CC-CEDICT extract.
 *
 * This is a JSON→JSON enrich transform alongside the other `build-*` scripts in
 * scripts/enrich/ — NOT a phase-1 extractor and NOT a new pipeline stage. The
 * pipeline stays exactly 3 phases: extract (phase1) → enrich (phase2) → seed.
 *
 * It reads `content/seed/phase1/cc-cedict-entries.json` read-only (the phase-1
 * generator `scripts/generate/cc-cedict-entries.ts` owns the raw
 * `data/CC-CEDICT/*.txt`), applies the exactly-4-CJK + lit./fig.-or-idiom
 * filter (widening on `lit.`/`fig.` beyond the incomplete `(idiom)` tag — never
 * the tag alone), intersects the curated shortlist (`CURATED_SHORTLIST` —
 * mandatory KB §6.2 family + common chengyu), converts numbered pinyin via
 * `numberedToToneMark`/`pinyinStringToToneMarks`, and writes the working draft
 * `content/seed/phase2/chengyu-draft.json` (CC-CEDICT fields pre-filled,
 * authoring fields empty). The draft is INERT — never declared in the manifest,
 * never read by seed.ts; it is renamed → `chengyu.json` on completion and then
 * deleted to keep phase2/ clean.
 *
 * Per-row pre-fill:
 *   - chengyu            = simplified (exactly 4 CJK)
 *   - pinyin             = pinyinNumbered → tone marks (handles u:→ü, digits→marks, neutral)
 *   - literalMeaning     = `lit.` gloss (stripped of `(idiom)` suffix)
 *   - figurativeMeaning  = `fig.` gloss (fallback: second definition line)
 *   - metadata.source    = "CC-CEDICT"
 *   - content_id         = sequential `cy_0001…`
 *   - sortOrder          = list order
 *   - story/storySource/era/theme/examples = empty (authoring fields)
 *
 * Rejects: CC-CEDICT "variant of …" rows and pure "abbr. for …" stubs (rows with
 * no `lit.`/`fig.` gloss), rare/archaic idioms with no Chinese Wiktionary 詞源,
 * and any 惯用语 / 歇后语 / 谚语 (KB §6.3).
 *
 * Run via: npm run extract:chengyu-candidates
 *          (or cd apps/backend && npx tsx scripts/enrich/extract-chengyu-candidates.ts)
 *
 * Pure helpers are unit-tested in apps/backend/scripts/__tests__/extract-chengyu-candidates.test.ts.
 */

import { readFile, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { pinyinStringToToneMarks } from "../../src/shared/utils/pinyinFormatUtils.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..", "..", "..", "..");
const CC_CEDICT_FILE = join(PROJECT_ROOT, "content", "seed", "phase1", "cc-cedict-entries.json");
const DRAFT_FILE = join(PROJECT_ROOT, "content", "seed", "phase2", "chengyu-draft.json");

// ── Types ──────────────────────────────────────────────────────────────────

interface CedictEntry {
  traditional: string;
  simplified: string;
  pinyinRaw: string;
  pinyinNumbered: string;
  definitions: string[];
}

/** One row of the authoring draft — CC-CEDICT fields pre-filled, authoring fields empty. */
export interface ChengyuDraftRow {
  content_id: string;
  chengyu: string;
  pinyin: string;
  literalMeaning: string | null;
  figurativeMeaning: string | null;
  story: string;
  storySource: string;
  era: string;
  theme: string;
  sortOrder: number;
  metadata: {
    source: string;
    [key: string]: unknown;
  };
  examples: never[];
}

// ── Curated shortlist (60–80) ──────────────────────────────────────────────
// Mandatory KB §6.2 family seed (破釜沉舟, 画蛇添足, 瓜田李下) + common chengyu.
// No separate JSON artifact — this typed constant IS the shortlist. Sized 60–80
// so curation dropping lands safely at ≥50 authored rows.
export const CURATED_SHORTLIST: readonly string[] = [
  // KB §6.2 mandatory family seed
  "破釜沉舟",
  "画蛇添足",
  "瓜田李下",
  // Common chengyu (IMP starter list + classical-source-grounded additions)
  "守株待兔",
  "叶公好龙",
  "亡羊补牢",
  "塞翁失马",
  "三顾茅庐",
  "井底之蛙",
  "自相矛盾",
  "掩耳盗铃",
  "滥竽充数",
  "画龙点睛",
  "刻舟求剑",
  "对牛弹琴",
  "狐假虎威",
  "胸有成竹",
  "卧薪尝胆",
  "望梅止渴",
  "纸上谈兵",
  "东施效颦",
  "邯郸学步",
  "完璧归赵",
  "负荆请罪",
  "四面楚歌",
  "指鹿为马",
  "一鼓作气",
  "唇亡齿寒",
  "愚公移山",
  "杞人忧天",
  "朝三暮四",
  "庖丁解牛",
  "鹬蚌相争",
  "南辕北辙",
  "画饼充饥",
  "望洋兴叹",
  "老马识途",
  "买椟还珠",
  "郑人买履",
  "一鸣惊人",
  "毛遂自荐",
  "脱颖而出",
  "围魏救赵",
  "三令五申",
  "背水一战",
  "温故知新",
  "不耻下问",
  "任重道远",
  "三人成虎",
  "惊弓之鸟",
  "悬梁刺股",
  "乐不思蜀",
  "七步成诗",
  "前车之鉴",
  "居安思危",
  "学富五车",
  "出类拔萃",
  "缘木求鱼",
  "揠苗助长",
  "五十步笑百步",
  "一曝十寒",
  "专心致志",
  "名正言顺",
  "见义勇为",
  "言而有信",
  "见贤思齐",
  "道听途说",
  "前倨后恭",
  "一诺千金",
];

// ── Pure helpers (unit-tested) ─────────────────────────────────────────────

/** True when `s` is exactly 4 CJK Unified Ideograph characters (incl. Ext A). */
export function is4Han(s: string): boolean {
  return /^[\u3400-\u9FFF]{4}$/.test(s);
}

/** True when the entry's definitions carry an idiom marker (widened: lit./fig. OR `(idiom)` tag — never tag alone). */
export function isIdiomCandidate(entry: Pick<CedictEntry, "simplified" | "definitions">): boolean {
  return (
    is4Han(entry.simplified) &&
    /\bidio[m]?\b|lit\.|fig\./.test(entry.definitions.join(" ").toLowerCase())
  );
}

/**
 * True for CC-CEDICT rows that are variant/abbr stubs with no real gloss —
 * "variant of …" / "see …" rows and pure "abbr. for …" rows (a row with no
 * `lit.`/`fig.` gloss is not authorable and is rejected).
 */
export function isVariantOrAbbrStub(definitions: string[]): boolean {
  const joined = definitions.join(" ").toLowerCase();
  const isVariant = /\bvariant of\b|\bsee\b/.test(joined);
  const isAbbr = /\babbr\.? for\b/.test(joined);
  const hasGloss = /lit\.|fig\./.test(joined);
  return (isVariant || isAbbr) && !hasGloss;
}

/** True when a candidate row carries a usable `lit.` or `fig.` gloss (authorable). */
export function hasLitOrFigGloss(definitions: string[]): boolean {
  return /lit\.|fig\./.test(definitions.join(" ").toLowerCase());
}

/**
 * Extract the `lit.` gloss (literal meaning) and `fig.` gloss (figurative
 * meaning) from CC-CEDICT definitions. Falls back to the second definition line
 * for the figurative meaning when no `fig.` marker is present (CC-CEDICT
 * convention: first def line is literal, later lines are figurative/usage).
 */
export function extractLitFig(definitions: string[]): {
  literalMeaning: string | null;
  figurativeMeaning: string | null;
} {
  const joined = definitions.join(" ");
  const lower = joined.toLowerCase();
  const litIdx = lower.indexOf("lit.");
  const figIdx = lower.indexOf("fig.");

  let literalMeaning: string | null = null;
  let figurativeMeaning: string | null = null;

  if (litIdx >= 0) {
    const start = litIdx + "lit.".length;
    const end = figIdx > litIdx ? figIdx : joined.length;
    literalMeaning = stripIdiomTag(joined.slice(start, end)).trim() || null;
  }

  if (figIdx >= 0) {
    figurativeMeaning =
      joined
        .slice(figIdx + "fig.".length)
        .split(";")[0]
        ?.trim() || null;
  } else if (definitions.length >= 2) {
    figurativeMeaning = stripIdiomTag(definitions[1]).trim() || null;
  }

  return { literalMeaning, figurativeMeaning };
}

/** Remove `(idiom)` / `(idioms)` tags and trailing separators from a gloss fragment. */
function stripIdiomTag(s: string): string {
  return s.replace(/\s*\(idio[m]?s?\)/g, "").replace(/[;,\s]+$/, "");
}

// ── Draft builder ──────────────────────────────────────────────────────────

/**
 * Build the authoring draft from the CC-CEDICT entries + curated shortlist.
 *
 * - `poolCount` = the raw candidate pool: exactly-4-CJK + idiom/lit./fig.
 *   marker, minus variant/abbr stubs (matches the IMP ~5,000–6,000 yield).
 * - Shortlist coverage is checked against ALL exactly-4-CJK CC-CEDICT entries,
 *   NOT just the marker pool. This is the curation bypass: untagged/markerless
 *   shortlist members (e.g. 瓜田李下 [abbr.], 自相矛盾 [no marker], 光明正大)
 *   are still surfaced so the mandatory KB §6.2 family + shortlist stay
 *   authorable. Their CC-CEDICT glosses may be null — the author fills them
 *   from the KB / Wiktionary 詞源 during enrichment.
 */
export function buildDraft(
  entries: CedictEntry[],
  shortlist: readonly string[] = CURATED_SHORTLIST,
): { rows: ChengyuDraftRow[]; poolCount: number; found: string[]; notFound: string[] } {
  // 1. Candidate pool (exactly-4-CJK + idiom marker, minus variant/abbr stubs).
  const poolCount = entries.filter(
    (e) => isIdiomCandidate(e) && !isVariantOrAbbrStub(e.definitions),
  ).length;

  // 2. Map simplified → first exactly-4-CJK entry (marker OR shortlist member).
  const bySimplified = new Map<string, CedictEntry>();
  for (const entry of entries) {
    if (!is4Han(entry.simplified)) continue;
    if (!bySimplified.has(entry.simplified)) bySimplified.set(entry.simplified, entry);
  }

  // 3. Shortlist coverage (against all exactly-4-CJK entries).
  const found: string[] = [];
  const notFound: string[] = [];
  for (const idiom of shortlist) {
    if (bySimplified.has(idiom)) found.push(idiom);
    else notFound.push(idiom);
  }

  // 4. Scaffold the draft rows for the found shortlist members (list order).
  const rows: ChengyuDraftRow[] = [];
  let index = 0;
  for (const idiom of shortlist) {
    const entry = bySimplified.get(idiom);
    if (!entry) continue;
    index += 1;
    const { literalMeaning, figurativeMeaning } = extractLitFig(entry.definitions);
    rows.push({
      content_id: `cy_${String(index).padStart(4, "0")}`,
      chengyu: entry.simplified,
      pinyin: pinyinStringToToneMarks(entry.pinyinNumbered),
      literalMeaning,
      figurativeMeaning,
      story: "",
      storySource: "",
      era: "",
      theme: "",
      sortOrder: index,
      metadata: {
        source: "CC-CEDICT",
        cedictPinyinRaw: entry.pinyinRaw,
      },
      examples: [],
    });
  }

  return { rows, poolCount, found, notFound };
}

// ── CLI runner ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("=== Extract Chengyu Candidates (phase-2 enrich draft) ===");
  const entries = JSON.parse(await readFile(CC_CEDICT_FILE, "utf-8")) as CedictEntry[];
  console.log(`  Read ${entries.length} phase-1 CC-CEDICT entries`);

  const { rows, poolCount, found, notFound } = buildDraft(entries);
  console.log(`  Candidate pool (4-char + idiom/lit./fig., minus stubs): ${poolCount}`);
  console.log(`  Shortlist: ${CURATED_SHORTLIST.length} members`);
  console.log(`  Found in candidates: ${found.length} — ${found.join(", ")}`);
  if (notFound.length > 0) {
    console.log(`  ⚠️  NOT found in candidates: ${notFound.join(", ")}`);
  } else {
    console.log("  ✅ All shortlist members found in the candidate pool");
  }

  await writeFile(DRAFT_FILE, `${JSON.stringify(rows, null, 2)}\n`, "utf-8");
  console.log(`  Wrote ${rows.length} draft rows to ${DRAFT_FILE}`);
  console.log("Done.");
}

// Only run the CLI when executed directly (not when imported by tests).
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  main().catch((err) => {
    console.error("Extract failed:", err);
    process.exit(1);
  });
}
