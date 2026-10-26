/**
 * @file shared/hub-entry/hubEntryPoint.ts
 * @description Single entry point for opening/closing the LexicalHub.
 *
 * Consumers call `openHub(entityRef)` — ONE function for ALL entry points.
 *
 * Story 21.4: Unified entry point, replaces scattered direct store calls.
 * Story 21.4 (refactor): Uses single open() method.
 * S2 (session = route, not modal): this records the INTENT; HubRouteBridge turns
 * it into a navigation to the routed detail surface
 * (`/learn/hub/:entityType/:entityId`). Call sites are unchanged — a session is
 * a route now, and the router owns the hop history (there is no in-memory stack).
 */

import { useHubStore } from "shared/store";
import type { EntityRef } from "shared/types";

/**
 * Single entry point for opening the LexicalHub.
 *
 * Use this EVERYWHERE — from external consumers (WordPopover, radical trees)
 * and from internal navigation (character chip clicks inside WordHub).
 * HubRouteBridge routes the intent to the detail surface; nothing renders here.
 */
export function openHub(entityRef: EntityRef): void {
  useHubStore.getState().open(entityRef);
}

/**
 * Close the LexicalHub.
 * Co-located with openHub so consumers import from one place.
 */
export function closeHub(): void {
  useHubStore.getState().close();
}
