/**
 * keyGuard.ts — keyboard guards shared by the Epic 26 quiz format shells.
 *
 * Two rules that every format view must honour, kept in one place so a new
 * format cannot re-derive them wrongly:
 *
 *  1. Enter must never be treated as a commit while an IME composition is in
 *     flight. Confirm with `isComposingKey` BEFORE acting on `key === "Enter"`.
 *  2. A single-select group answers to number keys as a shortcut on top of the
 *     native radio group's arrow-key movement. `optionIndexFromKey` maps a digit
 *     to an option index; `firstDigit` is the digit that selects the FIRST
 *     option (1 for cloze's 1-4, 0 for tone-judgment's 0-4).
 *
 * Neither function reads component state, so both stay usable in a logic-free
 * shell.
 */

import type { KeyboardEvent } from "react";

/** True while a key event belongs to an IME composition session. */
export function isComposingKey(event: KeyboardEvent): boolean {
  return event.nativeEvent.isComposing || event.keyCode === 229;
}

/**
 * Map a single digit key to a zero-based option index.
 * Returns `null` when the key is not a digit or lands outside the group.
 */
export function optionIndexFromKey(key: string, firstDigit: number): number | null {
  if (key.length !== 1 || key < "0" || key > "9") return null;
  const index = Number(key) - firstDigit;
  return index >= 0 ? index : null;
}
