/**
 * @file shared/hub-entry/hubEntryPoint.ts
 * @description Single entry point for opening/closing the lexical hub PEEK.
 *
 * Consumers call `openHub(entityRef)` — ONE function for ALL entry points, and
 * its signature is unchanged from the routed era, so the ~40 existing call sites
 * (reader tokens, review-card glyphs, radical trees, constituent-character
 * chips, cluster cards, quiz reveals…) change by zero characters. They simply
 * stop navigating: the peek opens over the origin surface, which stays mounted.
 *
 * This module is the only place that talks to the browser on the hub's behalf:
 *  - ONE history entry per OPEN, state-only (`pushState` with the current URL),
 *    so Back closes the peek instead of leaving the page. Hops push NOTHING —
 *    the hop stack is store state (rework-proposal §0.5).
 *  - Close restores the origin's scroll offset and returns focus to the
 *    invoking token. Nothing was dismantled, so there is no navigation to unwind.
 */

import { useHubStore, type HubOrigin } from "shared/store";
import type { EntityRef } from "shared/types";

/** Marks the single history entry a peek owns. */
const PEEK_STATE_KEY = "hubPeek";

/** AppLayout's `.app-content` — THE single scroll container of the app shell. */
const APP_SCROLLER_SELECTOR = ".app-content";

function appScroller(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLElement>(APP_SCROLLER_SELECTOR);
}

/** True while the peek's own history entry is the current one. */
function peekEntryIsCurrent(): boolean {
  if (typeof window === "undefined") return false;
  const state = window.history.state as Record<string, unknown> | null;
  return state?.[PEEK_STATE_KEY] === true;
}

function captureOrigin(): HubOrigin {
  const active = typeof document === "undefined" ? null : document.activeElement;
  return {
    // The sheet stamps the router path on its first render after the open —
    // window.location is not always the router's location.
    path: "",
    scrollTop: appScroller()?.scrollTop ?? 0,
    invoker: active instanceof HTMLElement && active !== document.body ? active : null,
  };
}

/**
 * Push the peek's one history entry. `pushState` keeps the URL unchanged (a peek
 * is an act of reading, not a location) and MERGES the router's own entry state
 * so React Router's back/forward index arithmetic survives the extra entry.
 */
function pushPeekEntry(): void {
  if (typeof window === "undefined" || typeof window.history?.pushState !== "function") return;
  try {
    const current = (window.history.state ?? {}) as Record<string, unknown>;
    window.history.pushState({ ...current, [PEEK_STATE_KEY]: true }, "", window.location.href);
  } catch {
    // A browser that refuses the push still gets a working peek — Back simply
    // leaves the page, as it did before this rework.
  }
}

/**
 * Drop the peek's history entry. Only when it is actually the current entry: a
 * real navigation while the peek was open has already buried it, and going back
 * there would undo the learner's own navigation.
 */
function drainPeekEntry(): void {
  if (typeof window === "undefined" || !peekEntryIsCurrent()) return;
  window.history.back();
}

/** Put the origin surface back exactly as it was: scroll offset, then focus. */
function restoreOrigin(origin: HubOrigin): void {
  const scroller = appScroller();
  if (scroller) scroller.scrollTop = origin.scrollTop;

  const invoker = origin.invoker;
  if (invoker?.isConnected) invoker.focus();
}

/**
 * Open the lexical hub with the given entity — or hop when a peek is already
 * open. Use this EVERYWHERE; nothing renders here, the sheet in AppLayout does.
 */
export function openHub(entityRef: EntityRef): void {
  const store = useHubStore.getState();
  const startingPeek = store.peek === null;

  store.open(entityRef, captureOrigin());

  // One entry per OPEN, never per hop: a hop is store state, not a location.
  if (startingPeek) pushPeekEntry();
}

/**
 * Close the peek and put the learner back where they were.
 *
 * `restore: false` is for a REAL navigation (a rail click, a programmatic
 * `navigate`): the page the learner asked for is the destination, so the origin
 * must not be scrolled or focused back into view.
 */
export function closeHub(options: { restore?: boolean } = {}): void {
  const { peek, close } = useHubStore.getState();
  if (!peek) return;

  close();

  if (options.restore === false) return;
  restoreOrigin(peek.origin);
  drainPeekEntry();
}

/**
 * Close the peek because the browser's own Back / dismiss gesture fired. The
 * entry is already gone, so this must never call `history.back()` again — that
 * would leave the origin surface for the page before it.
 */
export function closeHubFromHistory(): void {
  const { peek, close } = useHubStore.getState();
  if (!peek) return;

  close();
  restoreOrigin(peek.origin);
}
