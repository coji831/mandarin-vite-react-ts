/**
 * @file shared/hub-entry/hubEntryPoint.ts
 * @description Single entry point for opening/closing the LexicalHub.
 *
 * Consumers call `openHub(entityRef)` — ONE function for ALL entry points.
 * The function internally determines whether to reset the navigation stack
 * (hub was closed) or preserve it (hub was open — internal navigation).
 *
 * Story 21.4: Unified entry point, replaces scattered direct store calls.
 * Story 21.4 (refactor): Uses single open() method.
 */

import { useHubStore } from "shared/store";
import type { EntityRef } from "shared/types";

/**
 * Single entry point for opening the LexicalHub.
 *
 * - If the hub is already open → preserves navigation history
 * - If the hub is closed → resets the stack
 *
 * Use this EVERYWHERE — from external consumers (WordPopover, radical trees)
 * and from internal navigation (character chip clicks inside WordHub).
 */
export function openHub(entityRef: EntityRef): void {
  const { isOpen, open } = useHubStore.getState();
  open(entityRef, !isOpen);
}

/**
 * Close the LexicalHub.
 * Co-located with openHub so consumers import from one place.
 */
export function closeHub(): void {
  useHubStore.getState().close();
}
