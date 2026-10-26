/**
 * @file shared/hooks/__tests__/useFocusTrap.test.tsx
 * @description Unit tests for useFocusTrap — the shared focus contract for
 * overlays (ADR-013). Covers the four behaviors the APG Dialog (Modal) Pattern
 * specifies: focus in on open, a Tab/Shift+Tab cycle that cannot leave the
 * container, Escape to close, and focus return to the invoking element — plus
 * the no-tabbable-descendant, detached-invoker and inactive edges.
 */
import { useRef } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useFocusTrap, type UseFocusTrapOptions } from "../useFocusTrap";

type PanelProps = Omit<UseFocusTrapOptions, "active"> & {
  withChildren?: boolean;
};

/** The overlay itself — mounted only while the host is open. */
function Panel({ withChildren = true, ...trapOptions }: PanelProps) {
  const panelRef = useFocusTrap<HTMLDivElement>({ active: true, ...trapOptions });
  return (
    <div ref={panelRef} data-testid="panel" role="dialog" aria-modal="true" aria-label="Trap">
      {withChildren ? (
        <>
          <button type="button">first</button>
          <input aria-label="middle" />
          <button type="button">last</button>
        </>
      ) : (
        <p>read-only content</p>
      )}
    </div>
  );
}

type HostProps = PanelProps & { active: boolean };

/** The invoker lives OUTSIDE the toggled subtree, as it does in the app. */
function Host({ active, ...panelProps }: HostProps) {
  return (
    <div>
      <button data-testid="invoker" type="button">
        open
      </button>
      {active && <Panel {...panelProps} />}
    </div>
  );
}

function openHost(props: PanelProps = {}) {
  const view = render(<Host active={false} {...props} />);
  const invoker = screen.getByTestId("invoker");
  invoker.focus();
  view.rerender(<Host active {...props} />);
  return { ...view, invoker };
}

function tab(shiftKey = false) {
  fireEvent.keyDown(document, { key: "Tab", shiftKey });
}

describe("useFocusTrap", () => {
  it("moves focus to the first tabbable element when it opens", () => {
    openHost();

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "first" }));
  });

  it("cycles forward: Tab on the last element wraps to the first", () => {
    openHost();
    const first = screen.getByRole("button", { name: "first" });

    screen.getByRole("button", { name: "last" }).focus();
    tab();

    expect(document.activeElement).toBe(first);
  });

  it("cycles backward: Shift+Tab on the first element wraps to the last", () => {
    openHost();
    const last = screen.getByRole("button", { name: "last" });

    screen.getByRole("button", { name: "first" }).focus();
    tab(true);

    expect(document.activeElement).toBe(last);
  });

  it("leaves mid-container Tab handling to the browser", () => {
    openHost();
    const first = screen.getByRole("button", { name: "first" });

    first.focus();
    tab();

    // The hook must not steal focus from the middle of the cycle.
    expect(document.activeElement).toBe(first);
  });

  it("calls onEscape when Escape is pressed", () => {
    const onEscape = vi.fn();
    openHost({ onEscape });

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it("returns focus to the invoking element when it closes", () => {
    const { rerender, invoker } = openHost();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "first" }));

    rerender(<Host active={false} />);

    expect(document.activeElement).toBe(invoker);
  });

  it("focuses the container and holds it when there is nothing tabbable", () => {
    openHost({ withChildren: false });
    const panel = screen.getByTestId("panel");

    expect(document.activeElement).toBe(panel);

    // A Tab with no tabbable descendant must not escape the trap.
    tab();
    expect(document.activeElement).toBe(panel);
  });

  it("pulls focus back inside when Tab is pressed from outside the container", () => {
    openHost();

    // Simulates a backdrop click or a stray programmatic focus.
    document.body.focus();
    tab();

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "first" }));
  });

  it("does not trap while inactive", () => {
    const onEscape = vi.fn();
    render(<Host active={false} onEscape={onEscape} />);
    const invoker = screen.getByTestId("invoker");
    invoker.focus();

    tab();
    fireEvent.keyDown(document, { key: "Escape" });

    expect(document.activeElement).toBe(invoker);
    expect(onEscape).not.toHaveBeenCalled();
  });

  it("honours initialFocus='container' for content read as one block", () => {
    openHost({ initialFocus: "container" });

    expect(document.activeElement).toBe(screen.getByTestId("panel"));
  });

  it("honours initialFocus='none' and leaves placement to the caller", () => {
    render(<Host active={false} />);
    const invoker = screen.getByTestId("invoker");
    invoker.focus();
    render(<Host active initialFocus="none" />);

    expect(document.activeElement).toBe(invoker);
  });

  it("skips candidates that are disabled or aria-hidden", () => {
    function FilteredPanel() {
      const panelRef = useFocusTrap<HTMLDivElement>({ active: true });
      return (
        <div ref={panelRef}>
          <button type="button" disabled>
            disabled
          </button>
          <button type="button" aria-hidden="true">
            hidden
          </button>
          <button type="button">real</button>
        </div>
      );
    }

    render(<FilteredPanel />);

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "real" }));
  });

  it("falls back to fallbackFocus when the invoker no longer exists", () => {
    function Trap({ fallbackFocus }: { fallbackFocus: UseFocusTrapOptions["fallbackFocus"] }) {
      const panelRef = useFocusTrap<HTMLDivElement>({ active: true, fallbackFocus });
      return (
        <div ref={panelRef} data-testid="panel" role="dialog" aria-modal="true" aria-label="Trap">
          <button type="button">inside</button>
        </div>
      );
    }

    function Host({ active, showInvoker }: { active: boolean; showInvoker: boolean }) {
      const fallbackRef = useRef<HTMLButtonElement | null>(null);
      return (
        <div>
          <button ref={fallbackRef} type="button">
            fallback
          </button>
          {showInvoker && (
            <button data-testid="invoker" type="button">
              vanishing
            </button>
          )}
          {active && <Trap fallbackFocus={fallbackRef} />}
        </div>
      );
    }

    const view = render(<Host active={false} showInvoker />);
    screen.getByTestId("invoker").focus();
    view.rerender(<Host active showInvoker />); // open: captures the invoker as the return target

    // The invoker detaches while the trap stays active; the effect must not re-run,
    // so focus stays where the trap put it (the first tabbable), not re-issued.
    view.rerender(<Host active showInvoker={false} />);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "inside" }));

    // Close: the invoker is gone, so focus returns to the fallback (which lives
    // outside the toggled trap subtree, exactly as a real fallback would).
    view.rerender(<Host active={false} showInvoker={false} />);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "fallback" }));
  });
});
