/**
 * @file shared/store/hubStore.ts
 * @description Zustand store for the lexical hub: a single-use open INTENT plus a
 * MIRROR of the routed session. The two are deliberately separate fields.
 * Story 18.5: Character Detail Hub (Phase 1 Minimal)
 * Story 21.4: Reading UI + LexicalHub Phase 1 — generalized to support any entity type
 * S2 (session = route, not modal): the hub is a routed detail surface, so this
 *   store renders nothing and keeps no hop stack — the ROUTER owns history.
 * Regression fix (epic-25): `open()` and `syncFromRoute()` used to write the SAME
 *   `isOpen` flag, so a hub ROUTE (a permanent "open" state) read as a permanent
 *   pending intent and HubRouteBridge rewrote every departure back to the hub.
 *   `isOpen`/`currentEntity` are now a mirror of the route and MUST NOT drive
 *   navigation; only `requestedEntity` does, and it is consumed once.
 *
 * Invariant: navigating away from a hub route is never corrected back. Only an
 * explicit `open()` records an intent, and an intent is spent the moment the
 * bridge acts on it.
 *
 * Each hub section fetches its own data independently via dedicated hooks/services.
 * Follows patterns from shared/store/uiStore.ts.
 */

import { create } from "zustand";
import type { EntityRef } from "../types";

// ─── Store type ────────────────────────────────────────────────────

/**
 * One consumable open request. `token` makes two opens of the SAME entity
 * distinct, so a repeat click still navigates while a re-render does not.
 */
export type HubRequest = {
  ref: EntityRef;
  token: number;
};

export type HubState = {
  /** Mirror: a hub session route is showing. Display only — never a nav trigger. */
  isOpen: boolean;
  /** Mirror: the entity the ROUTE names (null = no session route). */
  currentEntity: EntityRef | null;
  /** Intent: the pending, single-use request to open a hub route. */
  requestedEntity: HubRequest | null;

  /**
   * @internal Use openHub() from shared/hub-entry instead.
   * Records the intent to open the hub with the given entity reference.
   */
  open: (entityRef: EntityRef) => void;

  /**
   * @internal Called by HubRouteBridge once it has acted on the intent.
   * A stale token (the intent was superseded) is ignored.
   */
  consumeRequest: (token: number) => void;

  /**
   * @internal Called by LexicalEntityPage — the route is the source of truth.
   * Adopts the entity the URL names. Writes the mirror ONLY.
   */
  syncFromRoute: (entityRef: EntityRef | null) => void;

  /** Close the hub session: clear the mirror and any unspent intent. */
  close: () => void;
};

// ─── Initial state ─────────────────────────────────────────────────
const initialState = {
  isOpen: false,
  currentEntity: null as EntityRef | null,
  requestedEntity: null as HubRequest | null,
};

let nextRequestToken = 1;

export const useHubStore = create<HubState>()((set) => ({
  ...initialState,

  open: (entityRef) =>
    set({
      isOpen: true,
      currentEntity: entityRef,
      requestedEntity: { ref: entityRef, token: nextRequestToken++ },
    }),

  consumeRequest: (token) =>
    set((state) => (state.requestedEntity?.token === token ? { requestedEntity: null } : {})),

  syncFromRoute: (entityRef) => set({ isOpen: entityRef != null, currentEntity: entityRef }),

  close: () => set({ isOpen: false, currentEntity: null, requestedEntity: null }),
}));
