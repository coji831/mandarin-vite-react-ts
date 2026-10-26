/**
 * @file shared/store/hubStore.ts
 * @description Zustand store for the lexical hub's open INTENT (generalized).
 * Story 18.5: Character Detail Hub (Phase 1 Minimal)
 * Story 21.4: Reading UI + LexicalHub Phase 1 — generalized to support any entity type
 * S2 (session = route, not modal): the hub is a routed detail surface, so this
 *   store no longer renders anything and no longer keeps a hop stack — the
 *   ROUTER owns history (one entry per hop, browser Back walks it).
 *   `open()` records where the learner wants to go, HubRouteBridge turns that
 *   into a navigation, and LexicalEntityPage mirrors the route back through
 *   `syncFromRoute()`. The URL owns which session is showing.
 *
 * Each hub section fetches its own data independently via dedicated hooks/services.
 * Follows patterns from shared/store/uiStore.ts.
 */

import { create } from "zustand";
import type { EntityRef } from "../types";

// ─── Store type ────────────────────────────────────────────────────
export type HubState = {
  isOpen: boolean;
  /** null = no entity selected; EntityRef = currently viewed entity */
  currentEntity: EntityRef | null;

  /**
   * @internal Use openHub() from shared/hub-entry instead.
   * Records the intent to open the hub with the given entity reference.
   */
  open: (entityRef: EntityRef) => void;

  /**
   * @internal Called by LexicalEntityPage — the route is the source of truth.
   * Adopts the entity the URL names.
   */
  syncFromRoute: (entityRef: EntityRef | null) => void;

  /** Close the hub and reset all state. */
  close: () => void;
};

// ─── Initial state ─────────────────────────────────────────────────
const initialState = {
  isOpen: false,
  currentEntity: null as EntityRef | null,
};

export const useHubStore = create<HubState>()((set) => ({
  ...initialState,

  open: (entityRef) => set({ isOpen: true, currentEntity: entityRef }),

  close: () => set({ isOpen: false, currentEntity: null }),

  syncFromRoute: (entityRef) => set({ isOpen: entityRef != null, currentEntity: entityRef }),
}));
