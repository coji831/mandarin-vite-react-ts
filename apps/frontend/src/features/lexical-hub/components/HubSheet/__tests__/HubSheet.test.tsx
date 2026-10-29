/**
 * @file HubSheet/__tests__/HubSheet.test.tsx
 * @description Behaviour tests for the lexical hub peek (rework-proposal §0).
 *
 * These cover only what the SHELL owns — the entity body is stubbed:
 *  - open → close returns to the exact origin (scroll offset + focus);
 *  - a hop lives in the store stack and writes NO history entry;
 *  - Back (popstate) closes the peek, once, no matter how many hops happened;
 *  - >767px is non-modal (no `aria-modal`, no `inert`) and ≤767px is modal;
 *  - Esc and ✕ are the same close;
 *  - the trail strip is session history: `aria-current="location"`, and the
 *    current chip is never a link.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { openHub, closeHub, closeHubFromHistory } from "shared/hub-entry";
import { useHubStore, initialHubState } from "shared/store";
import { HubSheet, HUB_SHEET_MODAL_QUERY } from "../HubSheet";

vi.mock("../../LexicalHubRouter", () => ({
  LexicalHubRouter: ({ entity }: { entity?: { entityType: string; entityId: string } }) => (
    <div data-testid="hub-body">{entity ? `${entity.entityType}:${entity.entityId}` : "none"}</div>
  ),
}));

/** Lets a test perform a REAL in-app navigation under the sheet. */
const navigator: { to: ((path: string) => void) | null } = { to: null };

function NavigateProbe() {
  navigator.to = useNavigate();
  return null;
}

function renderSheet(props: { forceModal?: boolean } = {}, route = "/learn/grammar") {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <NavigateProbe />
      <HubSheet {...props} />
    </MemoryRouter>,
  );
}

const grammarRef = { entityType: "grammar" as const, entityId: "gr_0018", label: "把" };
const characterRef = { entityType: "character" as const, entityId: "破", label: "pò" };

let scroller: HTMLDivElement;
let root: HTMLDivElement;
let invoker: HTMLButtonElement;

beforeEach(() => {
  useHubStore.setState({ ...initialHubState });

  // The app shell's single scroll container and the app root the modal branch
  // makes inert.
  scroller = document.createElement("div");
  scroller.className = "app-content";
  let scrollTop = 0;
  Object.defineProperty(scroller, "scrollTop", {
    get: () => scrollTop,
    set: (value: number) => {
      scrollTop = value;
    },
  });
  document.body.appendChild(scroller);

  root = document.createElement("div");
  root.id = "root";
  document.body.appendChild(root);

  invoker = document.createElement("button");
  invoker.textContent = "把";
  root.appendChild(invoker);
});

afterEach(() => {
  scroller.remove();
  root.remove();
  // Drop any peek marker this test left on the live history entry.
  window.history.replaceState(null, "", "/");
});

describe("HubSheet — open and close", () => {
  it("renders nothing until a peek is opened", () => {
    renderSheet();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens over the origin surface with the entity as its accessible name", () => {
    renderSheet();

    act(() => openHub(grammarRef));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAccessibleName("把");
    expect(screen.getByTestId("hub-body")).toHaveTextContent("grammar:gr_0018");
    // The opener is untouched: the origin page is never unmounted.
    expect(invoker.isConnected).toBe(true);
  });

  it("keeps the URL unchanged — a peek is not a location", () => {
    renderSheet();
    const before = window.location.href;

    act(() => openHub(grammarRef));

    expect(window.location.href).toBe(before);
  });

  it("closes on ✕ and restores the origin's scroll offset and focus", async () => {
    renderSheet();
    scroller.scrollTop = 240;
    invoker.focus();
    act(() => openHub(grammarRef));

    scroller.scrollTop = 0;
    fireEvent.click(screen.getByRole("button", { name: "Close details" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(scroller.scrollTop).toBe(240);
    await waitFor(() => expect(document.activeElement).toBe(invoker));
  });

  it("closes on Esc the same way ✕ does", async () => {
    renderSheet();
    act(() => openHub(grammarRef));

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(useHubStore.getState().peek).toBeNull();
  });
});

describe("HubSheet — hops are store state, never history", () => {
  it("writes exactly one history entry per OPEN and none per hop", () => {
    renderSheet();
    const before = window.history.length;

    act(() => openHub(grammarRef));
    const afterOpen = window.history.length;
    expect(afterOpen).toBe(before + 1);

    act(() => openHub(characterRef));
    act(() => openHub(grammarRef));
    expect(window.history.length).toBe(afterOpen);

    // ...and the sheet shows the last hop.
    expect(screen.getByTestId("hub-body")).toHaveTextContent("grammar:gr_0018");
  });

  it("renders the peek trail with the current chip as non-interactive text", () => {
    renderSheet();
    act(() => openHub(grammarRef));
    act(() => openHub(characterRef));

    const trail = screen.getByRole("navigation", { name: "Peek trail" });

    // The current entity is `aria-current="location"` — session history, not a
    // breadcrumb of pages — and it is NOT a link.
    const current = screen.getByText("pò", { selector: "[aria-current]" });
    expect(current).toHaveAttribute("aria-current", "location");
    expect(current.tagName).not.toBe("A");
    expect(current.closest("a")).toBeNull();
    expect(current.closest("button")).toBeNull();
    expect(trail).toContainElement(current);

    // The ancestor IS an affordance: clicking it rewinds the stack.
    fireEvent.click(screen.getByRole("button", { name: "Return to 把" }));
    expect(screen.getByTestId("hub-body")).toHaveTextContent("grammar:gr_0018");
  });

  it("hides the trail at the stack root", () => {
    renderSheet();
    act(() => openHub(grammarRef));
    expect(screen.queryByRole("navigation", { name: "Peek trail" })).not.toBeInTheDocument();
  });

  it("disables ← at the root and enables it after a hop", () => {
    renderSheet();
    act(() => openHub(grammarRef));
    expect(screen.getByRole("button", { name: "Back to previous entry" })).toBeDisabled();

    act(() => openHub(characterRef));
    const back = screen.getByRole("button", { name: "Back to previous entry" });
    expect(back).toBeEnabled();

    fireEvent.click(back);
    expect(screen.getByTestId("hub-body")).toHaveTextContent("grammar:gr_0018");
  });
});

describe("HubSheet — Back closes the peek", () => {
  it("closes on popstate after several hops (one step, not N)", async () => {
    renderSheet();
    act(() => openHub(grammarRef));
    act(() => openHub(characterRef));
    act(() => openHub(grammarRef));

    act(() => window.dispatchEvent(new PopStateEvent("popstate")));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(useHubStore.getState().peek).toBeNull();
  });

  it("drains its own history entry so a real Back leaves one step", async () => {
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    renderSheet();
    act(() => openHub(grammarRef));
    expect(window.history.state?.hubPeek).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Close details" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    // Exactly one drain for the one entry this peek owns.
    expect(back).toHaveBeenCalledTimes(1);
    back.mockRestore();
  });

  it("does not restore focus or scroll when the close is not a restore", async () => {
    renderSheet();
    scroller.scrollTop = 240;
    invoker.focus();
    act(() => openHub(grammarRef));
    scroller.scrollTop = 0;

    act(() => closeHub({ restore: false }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(scroller.scrollTop).toBe(0);
    expect(document.activeElement).not.toBe(invoker);
  });

  it("is idempotent — a second close never re-drains history", async () => {
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    renderSheet();
    act(() => openHub(grammarRef));

    act(() => {
      closeHub();
      closeHub();
      closeHubFromHistory();
    });

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(back).toHaveBeenCalledTimes(1);
    back.mockRestore();
  });
});

describe("HubSheet — modality is a width decision", () => {
  it("is NON-modal above 767px: no aria-modal, no scrim, no inert", () => {
    renderSheet();

    act(() => openHub(grammarRef));

    const dialog = screen.getByRole("dialog");
    expect(dialog).not.toHaveAttribute("aria-modal");
    expect(dialog).toHaveAttribute("data-modal", "false");
    expect(root).not.toHaveAttribute("inert");
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("is modal at ≤767px: aria-modal, scrim and an inert app root", async () => {
    renderSheet({ forceModal: true });

    act(() => openHub(grammarRef));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(root).toHaveAttribute("inert");
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.click(screen.getByRole("button", { name: "Close details" }));
    await waitFor(() => expect(root).not.toHaveAttribute("inert"));
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("reads modality from the viewport query, not a prop", () => {
    const matchMedia = vi.spyOn(window, "matchMedia").mockImplementation(
      (query: string) =>
        ({
          matches: query === HUB_SHEET_MODAL_QUERY,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as unknown as MediaQueryList,
    );

    renderSheet();
    act(() => openHub(grammarRef));

    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
    matchMedia.mockRestore();
  });
});

describe("HubSheet — a real navigation ends the peek", () => {
  it("closes without restoring when the route changes underneath it", async () => {
    renderSheet();
    scroller.scrollTop = 240;
    act(() => openHub(grammarRef));
    scroller.scrollTop = 0;

    // A rail click: the origin path stamped at open is no longer where we are.
    act(() => navigator.to?.("/learn/radicals"));

    await waitFor(() => expect(useHubStore.getState().peek).toBeNull());
    expect(scroller.scrollTop).toBe(0);
  });
});
