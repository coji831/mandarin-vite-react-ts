/**
 * @file features/lexical-hub/components/HubSheet/HubSheet.tsx
 * @description The lexical hub PEEK — a standalone, cross-page right-edge sheet
 * in the popover layer (rework-proposal §0).
 *
 * Every other surface can open it (a reader token, a review-card glyph, a
 * radical node, a chengyu character, a quiz reveal) because it is mounted ONCE
 * at the app shell and portalled to `document.body`: it therefore floats above
 * the top bar and over the rail, and the origin surface is never unmounted —
 * scroll, audio position and a half-typed answer all survive for free.
 *
 * Not a route, and deliberately not addressable (§0.6): a peek is an act of
 * reading, not a location. Its one history entry carries state only, so Back
 * closes the sheet instead of walking a transcript of peeks, and internal hops
 * (word → character → word) live in the hop stack, never in history.
 *
 * Modality is a WIDTH decision (§0.4):
 *   >767px — `role="dialog"` + `aria-labelledby`, NO `aria-modal`, no scrim, no
 *            `inert`, no focus trap. The origin stays live and visible; a click
 *            outside is a real click on the page, not a dismissed scrim.
 *   ≤767px — `aria-modal="true"`, scrim, the app root goes `inert`, and the
 *            shared `useFocusTrap` hook (ADR-013) traps and restores focus.
 *
 * Content is unchanged: the entity bodies (`CharacterHub`, `WordHub`, …) still
 * self-fetch and render exactly as they did on the routed page; only the shell
 * around them is new.
 */
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { Button } from "shared/components";
import { closeHub, closeHubFromHistory } from "shared/hub-entry";
import { useFocusTrap, useMediaQuery } from "shared/hooks";
import { useHubStore } from "shared/store";
import type { EntityRef } from "shared/types";
import { LexicalHubRouter } from "../LexicalHubRouter";
import { HubErrorBoundary } from "../HubErrorBoundary/HubErrorBoundary";
import "./HubSheet.css";

/** The breakpoint at which the peek becomes modal (§0.4). */
export const HUB_SHEET_MODAL_QUERY = "(max-width: 767px)";

export type HubSheetProps = {
  /**
   * Forces the modal branch. Tests and Storybook need to show both modalities;
   * production reads the viewport.
   */
  forceModal?: boolean;
};

/** The name a learner reads — a label hint when the opener supplied one. */
function entityName(ref: EntityRef): string {
  return ref.label && ref.label.length > 0 ? ref.label : ref.entityId;
}

function entityKey(ref: EntityRef, index: number): string {
  return `${ref.entityType}:${ref.entityId}:${index}`;
}

/** Put the app root out of the tab order while the modal branch is up. */
function setAppRootInert(inert: boolean): void {
  const root = document.getElementById("root");
  if (!root) return;
  if (inert) root.setAttribute("inert", "");
  else root.removeAttribute("inert");
}

export function HubSheet({ forceModal }: HubSheetProps = {}) {
  const peek = useHubStore((s) => s.peek);
  const current = useHubStore((s) => s.currentEntity);
  const hopBack = useHubStore((s) => s.hopBack);
  const jumpTo = useHubStore((s) => s.jumpTo);

  const compact = useMediaQuery(HUB_SHEET_MODAL_QUERY);
  const isModal = forceModal ?? compact;
  const isOpen = peek !== null;

  const titleId = useId();
  const [attempt, setAttempt] = useState(0);
  const panelRef = useFocusTrap<HTMLDivElement>({
    active: isOpen && isModal,
    onEscape: () => closeHub(),
    initialFocus: "container",
    restoreFocus: true,
  });

  const location = useLocation();
  const here = location.pathname + location.search;
  const originPath = peek?.origin.path ?? "";
  const stampOriginPath = useHubStore((s) => s.stampOriginPath);

  // The browser's Back button and its dismiss gesture both arrive here. Back is
  // the CLOSE path, not a hop: one history entry per open (§0.5).
  useEffect(() => {
    if (!isOpen) return;
    const handlePopState = () => closeHubFromHistory();
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isOpen]);

  // Esc = ✕ at both widths. (The trap also handles Esc while it is active; the
  // close is idempotent, so the second call is a no-op.)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeHub();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // The sheet knows the ROUTER's location, so it stamps the origin path on the
  // first render after an open. A different path afterwards is a REAL navigation
  // (a rail click, a programmatic navigate): the peek ends without restoring —
  // never scroll a page the learner has already left.
  useEffect(() => {
    if (!isOpen) return;
    if (originPath === "") {
      stampOriginPath(here);
      return;
    }
    if (here !== originPath) closeHub({ restore: false });
  }, [isOpen, here, originPath, stampOriginPath]);

  // Modal only: the origin is genuinely covered, so it is genuinely inert.
  useEffect(() => {
    if (!isOpen || !isModal) return;
    setAppRootInert(true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      setAppRootInert(false);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, isModal]);

  // Non-modal: focus moves INTO the sheet on open (APG dialog), but nothing is
  // trapped — Tab leaves for the page, which is exactly the point of §0.4.
  useEffect(() => {
    if (!isOpen || isModal) return;
    panelRef.current?.focus();
  }, [isOpen, isModal, panelRef]);

  if (!peek || !current || typeof document === "undefined") return null;

  const ancestors = peek.stack.slice(0, -1);
  const atRoot = peek.stack.length < 2;

  return createPortal(
    <>
      {isModal && (
        <div
          className="hub-sheet__scrim fixed inset-0"
          role="presentation"
          aria-hidden="true"
          onClick={() => closeHub()}
        />
      )}

      <div
        ref={panelRef}
        className="hub-sheet fixed flex flex-col overflow-hidden bg-surface-dark"
        role="dialog"
        aria-modal={isModal ? "true" : undefined}
        aria-labelledby={titleId}
        tabIndex={-1}
        data-modal={isModal ? "true" : "false"}
      >
        <header className="hub-sheet__header flex items-center gap-sm">
          <Button
            variant="icon"
            size="sm"
            className="hub-sheet__hit relative"
            onClick={hopBack}
            disabled={atRoot}
            aria-label="Back to previous entry"
          >
            ←
          </Button>
          <h2
            id={titleId}
            className="hub-sheet__title m-0 font-md fw-600 text-primary whitespace-nowrap overflow-hidden"
          >
            {entityName(current)}
          </h2>
          <Button
            variant="icon"
            size="sm"
            className="hub-sheet__hit relative"
            onClick={() => closeHub()}
            aria-label="Close details"
          >
            ✕
          </Button>
        </header>

        {peek.stack.length > 1 && (
          // Session history of THIS peek, not a breadcrumb: an ancestor chip
          // rewinds the stack, the current chip is text (a link that does
          // nothing is the defect NN/g names) and is never clickable.
          <nav
            className="hub-sheet__trail flex flex-wrap items-center gap-xs"
            aria-label="Peek trail"
          >
            {ancestors.map((ref, index) => (
              <Button
                key={entityKey(ref, index)}
                variant="ghost"
                size="sm"
                onClick={() => jumpTo(index)}
                aria-label={`Return to ${entityName(ref)}`}
              >
                {entityName(ref)}
              </Button>
            ))}
            <span className="font-xs text-tertiary" aria-current="location">
              {entityName(current)}
            </span>
          </nav>
        )}

        <div className="hub-sheet__body flex-1 min-h-0 overflow-y-auto">
          <HubErrorBoundary
            key={`${entityKey(current, peek.stack.length)}:${attempt}`}
            onRetry={() => setAttempt((current) => current + 1)}
          >
            <LexicalHubRouter entity={current} />
          </HubErrorBoundary>
        </div>

        <p role="status" className="sr-only">
          {`Now showing ${entityName(current)} — ${current.entityType}`}
        </p>
      </div>
    </>,
    document.body,
  );
}
