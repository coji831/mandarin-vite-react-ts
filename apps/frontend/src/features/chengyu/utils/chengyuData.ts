/**
 * @file utils/chengyuData.ts
 * @description Pure mapping / derivation helpers for the Chengyu feature.
 * Story 23.3: Chengyu UI
 *
 * All functions here are side-effect free and unit-tested:
 *   - `mapChengyuApiToData`  — API summary → display model for list cards.
 *   - `segmentToEntityRef`   — example segment → hub EntityRef (linked vs plain text).
 */
import type { EntityRef } from "shared/types";
import type { ChengyuSummary, ChengyuData, ChengyuSegment } from "../types";

/**
 * Map an API list item to the feature's display model.
 * Optional fields (previewExample, ...) are dropped when absent so cards render
 * without optional-data gaps.
 */
export function mapChengyuApiToData(item: ChengyuSummary): ChengyuData {
  return {
    id: item.id,
    chengyu: item.chengyu,
    pinyin: item.pinyin,
    literalMeaning: item.literalMeaning,
    figurativeMeaning: item.figurativeMeaning,
    era: item.era,
    theme: item.theme,
    exampleCount: item.exampleCount,
    previewExample: item.previewExample ?? undefined,
  };
}

/**
 * Map an example segment to a hub EntityRef when the token is cross-linked.
 * Tokens without an `entityId` (or `entityType`) render as plain text — return
 * null so callers skip the hub navigation.
 *
 * Entity-id contract: the character/word hubs and their APIs are GLYPH-keyed
 * (书, 桌子) while the chengyu seed/API stores the DB content_id (ch_20070,
 * w_00487). This util translates to the glyph (`segment.text`) for
 * `character`/`word`; all other entity types (grammar, radical, …) are
 * content_id-keyed and pass `segment.entityId` through unchanged.
 */
export function segmentToEntityRef(segment: ChengyuSegment): EntityRef | null {
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
