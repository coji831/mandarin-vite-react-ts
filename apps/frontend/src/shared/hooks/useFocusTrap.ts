/**
 * @file shared/hooks/useFocusTrap.ts
 * @description The shared focus contract for overlays (ADR-013). Owns the four
 * behaviors the WAI-ARIA APG Dialog (Modal) Pattern specifies — focus in, a
 * Tab/Shift+Tab cycle that cannot leave the container, Escape to close, and
 * focus return to the invoking element — transcribed as behavior only.
 *
 * Deliberately dependency-free and portal-free: a session surface is a route,
 * and a transient overlay renders in place unless it must escape an ancestor's
 * overflow/stacking context (ADR-013 §3).
 */
import { useEffect, useRef, type RefObject } from "react";

/** Everything the browser makes reachable with Tab, minus `tabindex="-1"` traps. */
const TABBABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "summary",
  "audio[controls]",
  "video[controls]",
  "[contenteditable]:not([contenteditable='false'])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/**
 * Resolved at keydown time rather than cached: a streaming turn list gains and
 * loses focusable children while the trap is active.
 */
function getTabbables(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR)).filter(
    (el) => !el.hidden && el.getAttribute("aria-hidden") !== "true",
  );
}

export type UseFocusTrapOptions = {
  /** Whether the overlay is open. The trap is inactive while false. */
  active: boolean;
  /** Called when Escape is pressed while the trap is active. */
  onEscape?: () => void;
  /**
   * Where focus lands on open. `"first"` is the APG default; `"container"` is
   * for content that must be read as one block (the container needs to be
   * focusable, which the hook arranges); `"none"` leaves focus placement to the
   * caller.
   */
  initialFocus?: "first" | "container" | "none";
  /** Return focus to the invoking element on close. Defaults to true. */
  restoreFocus?: boolean;
  /** Used when the invoking element is gone (APG: pick a logical next target). */
  fallbackFocus?: RefObject<HTMLElement | null>;
};

/**
 * Attach the returned ref to the overlay container.
 *
 * ```tsx
 * const panelRef = useFocusTrap({ active: isOpen, onEscape: onClose });
 * return <div ref={panelRef} role="dialog" aria-modal="true">…</div>;
 * ```
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>({
  active,
  onEscape,
  initialFocus = "first",
  restoreFocus = true,
  fallbackFocus,
}: UseFocusTrapOptions): RefObject<T | null> {
  const containerRef = useRef<T | null>(null);
  const invokerRef = useRef<HTMLElement | null>(null);

  // Kept in a ref so a new onEscape identity never re-runs the trap effect
  // (which would re-capture the invoker and re-issue the initial focus).
  const escapeHandlerRef = useRef(onEscape);
  useEffect(() => {
    escapeHandlerRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const activeElement = document.activeElement;
    invokerRef.current =
      activeElement instanceof HTMLElement && activeElement !== document.body ? activeElement : null;

    // A container that cannot hold focus cannot be the initial target.
    const addedTabIndex = !container.hasAttribute("tabindex");
    if (addedTabIndex) container.setAttribute("tabindex", "-1");

    const initialTabbables = getTabbables(container);
    if (initialFocus === "first" && initialTabbables.length > 0) {
      initialTabbables[0].focus();
    } else if (initialFocus !== "none") {
      container.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        escapeHandlerRef.current?.();
        return;
      }
      if (event.key !== "Tab") return;

      const tabbables = getTabbables(container);
      const first = tabbables[0];
      const last = tabbables[tabbables.length - 1];

      if (!first) {
        event.preventDefault();
        container.focus();
        return;
      }

      const current = document.activeElement;
      if (!container.contains(current)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }
      if (event.shiftKey && (current === first || current === container)) {
        event.preventDefault();
        last.focus();
        return;
      }
      if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (addedTabIndex) container.removeAttribute("tabindex");
      if (!restoreFocus) return;
      const invoker = invokerRef.current;
      if (invoker?.isConnected) invoker.focus();
      else fallbackFocus?.current?.focus();
    };
  }, [active, initialFocus, restoreFocus, fallbackFocus]);

  return containerRef;
}
