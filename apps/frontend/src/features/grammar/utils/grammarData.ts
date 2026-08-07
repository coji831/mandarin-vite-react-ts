/**
 * @file utils/grammarData.ts
 * @description Pure mapping / derivation helpers for the Grammar feature.
 * Story 22.3: Grammar UI
 *
 * All functions here are side-effect free and unit-tested:
 *   - `mapGrammarApiToData`  — API summary → display model for list cards.
 *   - `isPatternLocked`      — phase-lock derivation (pattern phase vs current phase).
 *   - `segmentToEntityRef`   — example segment → hub EntityRef (linked vs plain text).
 */
import type { EntityRef } from "shared/types";
import type { GrammarPatternSummary, GrammarPatternData, GrammarSegment } from "../types";

/**
 * Map an API list item to the feature's display model.
 * Optional fields (previewExample, ...) are dropped when absent so cards render
 * without optional-data gaps.
 */
export function mapGrammarApiToData(item: GrammarPatternSummary): GrammarPatternData {
  return {
    id: item.id,
    name: item.name,
    structure: item.structure,
    phase: item.phase,
    hskLevel: item.hskLevel,
    exampleCount: item.exampleCount,
    previewExample: item.previewExample ?? undefined,
  };
}

/**
 * Derive whether a pattern is locked for the current learner phase.
 *
 * Phase source: `usePhaseGate()` → currentPhase (numeric 2|3|4; guests = 4).
 * NEVER sourced from userStore. A pattern is locked when its own phase is
 * HIGHER than the learner's current phase (Phase 3/4 patterns → locked/preview
 * cards for Phase-2 users — the platform's "discovery, not gate" stance).
 *
 * @param patternPhase - the pattern's phase (2 | 3 | 4)
 * @param currentPhase - the learner's current phase (from the phase gate)
 */
export function isPatternLocked(patternPhase: number, currentPhase: number): boolean {
  return patternPhase > currentPhase;
}

/**
 * Map an example segment to a hub EntityRef when the token is cross-linked.
 * Tokens without an `entityId` (or `entityType`) render as plain text — return
 * null so callers skip the hub navigation.
 *
 * Entity-id contract: the character/word hubs and their APIs are GLYPH-keyed
 * (书, 桌子) while the grammar seed/API stores the DB content_id (ch_20070,
 * w_00487). This util translates to the glyph for `character`/`word`; all
 * other entity types (grammar, radical, …) are content_id-keyed and pass
 * `segment.entityId` through unchanged.
 */
export function segmentToEntityRef(segment: GrammarSegment): EntityRef | null {
  if (!segment.entityId || !segment.entityType) return null;
  // character/word hubs + APIs are GLYPH-keyed (书, 桌子) while the seed stores
  // content_id (ch_20070, w_00487) — translate to the glyph for those types;
  // other entity types (grammar/radical/…) are content_id-keyed.
  const isGlyphKeyed = segment.entityType === "character" || segment.entityType === "word";
  // Guard: a glyph-keyed token with an empty `text` must not open the hub with a
  // blank entityId — treat it as plain text (skip hub navigation).
  if (isGlyphKeyed && !segment.text) return null;
  return {
    entityType: segment.entityType,
    entityId: isGlyphKeyed ? segment.text : segment.entityId,
    // Empty-string pinyin must fall back to the token text (non-null guard only
    // handles undefined, not "").
    label: segment.pinyin || segment.text,
  };
}
