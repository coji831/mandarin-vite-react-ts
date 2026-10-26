/**
 * @file hubPath.ts
 * @description URL builders for the lexical hub — the session-as-route contract.
 *
 * A lexical detail (character / word / radical / chengyu / grammar) IS a
 * learning session, so it is a routed `detail`/Focus surface, never an overlay
 * (design-revalidation-guide.md §4 "session = route, not modal"). Everything
 * that used to open the hub overlay now navigates to `hubPathFor(ref)`.
 */

import {
  learn_chengyu,
  learn_foundations,
  learn_grammar,
  learn_lexical_hub,
  learn_phonetic_clusters,
  learn_readers,
  learn_radicals,
} from "shared/constants";
import type { EntityRef, EntityType } from "shared/types";

/**
 * Path of the routed Focus surface hosting the given entity's session.
 *
 * `label` is a display hint only (e.g. a character's pinyin): the entity body
 * self-fetches its own data, so a detail reached by a bare URL still renders —
 * the hint just avoids an empty pinyin line on first paint.
 */
export function hubPathFor(
  ref: Pick<EntityRef, "entityType" | "entityId">,
  label?: string | null,
): string {
  const path = `${learn_lexical_hub}/${encodeURIComponent(ref.entityType)}/${encodeURIComponent(
    ref.entityId,
  )}`;
  return label ? `${path}?label=${encodeURIComponent(label)}` : path;
}

/**
 * The Browse surface an entity is normally met on — the Back target when a
 * detail is deep-linked and therefore has no in-app `from` location.
 */
const ENTITY_ORIGIN: Record<EntityType, string> = {
  character: learn_foundations,
  word: learn_readers,
  radical: learn_radicals,
  grammar: learn_grammar,
  chengyu: learn_chengyu,
  phoneticCluster: learn_phonetic_clusters,
};

export function hubOriginFor(entityType: EntityType): string {
  return ENTITY_ORIGIN[entityType];
}
