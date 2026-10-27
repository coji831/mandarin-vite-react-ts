/**
 * @file hubPath.ts
 * @description URL builders for the lexical hub — the session-as-route contract.
 *
 * A lexical detail (character / word / radical / chengyu / grammar) IS a
 * learning session, so it is a routed `detail`/Focus surface, never an overlay
 * (design-revalidation-guide.md §4 "session = route, not modal"). Everything
 * that used to open the hub overlay now navigates to `hubPathFor(ref)`.
 *
 * This module also owns the session's NAVIGATOR state: `HubRouteState` (origin +
 * trail) is what makes the routed surface behave like the modal it replaced —
 * Back walks the hops, Close unwinds the session to where it was entered.
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

/**
 * Router state carried by every hub entry, so the routed page can behave like a
 * navigator again (S2 keeps the modal's value without the overlay):
 * - `from`  — where the session was ENTERED from (path + search of the origin
 *             route). Close returns here, unwinding every hop.
 * - `trail` — the entities already visited in this session, most recent last,
 *             excluding the entity the current URL names. Back walks them and
 *             the page renders them as a breadcrumb strip.
 */
export type HubRouteState = {
  from?: string;
  trail?: EntityRef[];
};

/** Normalizes untrusted `location.state` into a HubRouteState. */
export function readHubRouteState(state: unknown): HubRouteState {
  if (!state || typeof state !== "object") return {};
  const { from, trail } = state as HubRouteState;
  return {
    from: typeof from === "string" && from.length > 0 ? from : undefined,
    trail: Array.isArray(trail) ? trail : undefined,
  };
}

function isEntityType(value: string): value is EntityType {
  return Object.prototype.hasOwnProperty.call(ENTITY_ORIGIN, value);
}

/**
 * The entity a hub pathname names, or null when the path is not a hub route.
 * Comparing entity type + id (not the raw pathname) is what lets the bridge tell
 * "the route already shows this entity" from "this is a different route".
 *
 * The route's `?label=` display hint is adopted when present, so a recorded trail
 * entry renders the name a learner saw (破釜沉舟) rather than a content id
 * (cy_0001).
 */
export function hubEntityFromPath(pathname: string, search = ""): EntityRef | null {
  const base = `${learn_lexical_hub}/`;
  if (!pathname.startsWith(base)) return null;

  const segments = pathname.slice(base.length).replace(/\/+$/, "").split("/");
  if (segments.length !== 2) return null;

  try {
    const [entityType, entityId] = segments.map(decodeURIComponent);
    if (!entityType || !entityId || !isEntityType(entityType)) return null;
    const label = new URLSearchParams(search).get("label") ?? undefined;
    return label ? { entityType, entityId, label } : { entityType, entityId };
  } catch {
    // Malformed percent-encoding — treat as "not a hub route" rather than throw.
    return null;
  }
}
