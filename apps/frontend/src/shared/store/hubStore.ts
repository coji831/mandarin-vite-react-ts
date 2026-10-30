/**
 * @file shared/store/hubStore.ts
 * @description Zustand store for the lexical hub PEEK — the standalone
 * cross-page navigator (rework-proposal §0: "a standalone, cross-page lexical
 * drawer in the popover layer — not a routed subpage").
 *
 * The hub is a NAVIGATOR, not a session: it has no task, no completion and no
 * progress, so it may be a transient overlay over any surface (proposal §0.3).
 * The store therefore owns a hop STACK, and the router is never touched for a
 * hop — that is the whole point of the rework: Back closes the peek instead of
 * walking a transcript of peeks.
 *
 * DOM (history, scroll, focus) is deliberately NOT here. `shared/hub-entry`
 * owns it, so this store stays a pure, trivially testable state machine and the
 * entry point stays the single place that talks to the browser.
 */

import { create } from "zustand";
import type { EntityRef } from "../types";

// ─── Store type ────────────────────────────────────────────────────

/** Everything `close()` needs to put the learner back exactly where they were. */
export type HubOrigin = {
  /**
   * `pathname + search` of the surface the peek was opened on, stamped by the
   * sheet (only it knows the ROUTER's location). A different path while the peek
   * is open means a REAL navigation — the peek then closes without restoring.
   * `""` until stamped, and a blank marker never closes anything.
   */
  path: string;
  /** The app content scroller's offset at open (nothing was dismantled, so
   *  closing only has to put it back). */
  scrollTop: number;
  /** The token / chip / glyph that opened the peek — the focus return target. */
  invoker: HTMLElement | null;
};

export type HubPeek = {
  /** Hop stack; `stack[stack.length - 1]` is the entity the sheet shows. */
  stack: EntityRef[];
  origin: HubOrigin;
};

export type HubState = {
  /** The open peek (null = no peek). Hops live here, never in history. */
  peek: HubPeek | null;
  /**
   * Derived from `peek` — kept as a field so every existing reader (stories,
   * entity bodies, feature tests) keeps working. Only `applyPeek` writes it.
   */
  isOpen: boolean;
  /** Derived from `peek`: the entity at the top of the hop stack. */
  currentEntity: EntityRef | null;

  /**
   * Open the hub, or hop when one is already open.
   *
   * `origin` is captured by the caller (only hub-entry can read scroll/focus)
   * and is IGNORED on a hop: a hop is not a new peek, so the entry origin and
   * the single history entry both survive. Re-opening the entity already on top
   * of the stack is a no-op.
   */
  open: (entityRef: EntityRef, origin: HubOrigin) => void;
  /**
   * Pop one hop. At the stack root this is a no-op rather than a close: the
   * route-less peek's ← is disabled there and Close is the only exit, so the
   * history drain in hub-entry can never be skipped.
   */
  hopBack: () => void;
  /** Truncate the stack to `index` — a trail chip click. An index that would
   *  remove nothing (the current chip) is a no-op. */
  jumpTo: (index: number) => void;
  /**
   * Record where the peek was opened, once. The sheet calls this on its first
   * render after an open, because `pathname + search` must come from the ROUTER
   * (window.location can legitimately differ, e.g. under MemoryRouter).
   */
  stampOriginPath: (path: string) => void;
  /** Drop the peek. Focus/scroll restore belongs to the caller. */
  close: () => void;
};

// ─── Derivation ────────────────────────────────────────────────────

type PeekFields = Pick<HubState, "peek" | "isOpen" | "currentEntity">;

/** The ONLY place `peek`, `isOpen` and `currentEntity` are written together. */
function applyPeek(peek: HubPeek): PeekFields {
  return {
    peek,
    isOpen: true,
    currentEntity: peek.stack.length > 0 ? peek.stack[peek.stack.length - 1] : null,
  };
}

function sameEntity(a: EntityRef, b: EntityRef): boolean {
  return a.entityType === b.entityType && a.entityId === b.entityId;
}

// ─── Initial state ─────────────────────────────────────────────────

export const initialHubState: PeekFields = {
  peek: null,
  isOpen: false,
  currentEntity: null,
};

// ─── Store ─────────────────────────────────────────────────────────

export const useHubStore = create<HubState>()((set) => ({
  ...initialHubState,

  open: (entityRef, origin) =>
    set((state) => {
      if (!state.peek) return applyPeek({ stack: [entityRef], origin });

      const top = state.peek.stack[state.peek.stack.length - 1];
      if (top && sameEntity(top, entityRef)) return {};
      return applyPeek({ ...state.peek, stack: [...state.peek.stack, entityRef] });
    }),

  hopBack: () =>
    set((state) => {
      const { peek } = state;
      if (!peek || peek.stack.length < 2) return {};
      return applyPeek({ ...peek, stack: peek.stack.slice(0, -1) });
    }),

  jumpTo: (index) =>
    set((state) => {
      const { peek } = state;
      if (!peek || index < 0 || index >= peek.stack.length - 1) return {};
      return applyPeek({ ...peek, stack: peek.stack.slice(0, index + 1) });
    }),

  stampOriginPath: (path) =>
    set((state) => {
      const { peek } = state;
      if (!peek || peek.origin.path !== "") return {};
      return { peek: { ...peek, origin: { ...peek.origin, path } } };
    }),

  close: () => set({ ...initialHubState }),
}));
