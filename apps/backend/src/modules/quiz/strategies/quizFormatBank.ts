/**
 * @file apps/backend/src/modules/quiz/strategies/quizFormatBank.ts
 * @description The contract for the Epic 26 curated quiz banks (§26.4.3).
 *
 * The bank is an authored **selection layer** over the corpus, not a question
 * store: each item names an anchor row that already exists (`GrammarExample`
 * or `Character`) plus the index the generator needs. The answer is DERIVED
 * from the anchor at read time, so the corpus stays the single source of truth
 * and no answer text is duplicated into `content/seed/phase2/quiz-formats.json`.
 *
 * Persistence: the seed writes the items into the anchor row's existing
 * `metadata.quizFormats[]` Json column — no new table, no migration. The
 * generators below select against that column with `quizFormatFilter()`.
 */

/** Key of the `metadata` array that carries a bank's items on an anchor row. */
export const QUIZ_FORMAT_METADATA_KEY = "quizFormats";

/** One authored bank item (as persisted inside `metadata.quizFormats[]`). */
export interface QuizFormatBankItem {
  /** Stable authored id, e.g. `clz_0001` (the seed refuses duplicates). */
  id: string;
  /** Strategy id this item selects — injected from the bank key at seed time. */
  format: string;
  /** Anchor for a `GrammarExample`-based format. */
  exampleContentId?: string;
  /** Anchor for `listening-dictation`. */
  characterId?: string;
  /** `cloze`: which segment the blank replaces. */
  blankSegmentIndex?: number;
  /** `tone-judgment`: which segment's surface tone is judged. */
  targetSegmentIndex?: number;
  /** `tone-judgment`: the `ToneRule` that produces the surface tone, if any. */
  ruleId?: string;
  /** Provenance only — `generateQuestions()` has no phase parameter. */
  phase?: number;
}

/** Shape of `content/seed/phase2/quiz-formats.json`. */
export interface QuizFormatBankFile {
  _comment?: string;
  banks: Record<string, QuizFormatBankItem[]>;
}

/**
 * Prisma `where` selecting anchors whose `metadata.quizFormats` contains an
 * item for `format`.
 *
 * Model-agnostic on purpose: the same filter is used against `GrammarExample`
 * (cloze / sentence-building / tone-judgment) and `Character`
 * (listening-dictation), both of which expose the identical `metadata Json?`
 * column.
 *
 * `array_contains` compiles to jsonb `@>`, where an object element matches by
 * SUBSET — so `[{format:"cloze",id:"clz_0001",...}] @> [{format:"cloze"}]` is
 * true without the item's pins leaking into the filter.
 */
export interface QuizFormatMetadataFilter {
  metadata: { path: string[]; array_contains: Array<{ format: string }> };
}

export function quizFormatFilter(format: string): QuizFormatMetadataFilter {
  return {
    metadata: { path: [QUIZ_FORMAT_METADATA_KEY], array_contains: [{ format }] },
  };
}

/** The bank items for `format` carried by one anchor row (empty when unflagged). */
export function bankItemsFor(metadata: unknown, format: string): QuizFormatBankItem[] {
  if (!metadata || typeof metadata !== "object") return [];
  const value = (metadata as Record<string, unknown>)[QUIZ_FORMAT_METADATA_KEY];
  if (!Array.isArray(value)) return [];

  const items: QuizFormatBankItem[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    if (typeof record.id !== "string" || record.format !== format) continue;
    items.push(record as unknown as QuizFormatBankItem);
  }
  return items;
}
