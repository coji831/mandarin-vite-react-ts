/**
 * @file __tests__/LexicalEntityPage.test.tsx
 * @description Unit tests for the routed lexical session page (S2 — "session =
 * route, not modal"). The entity body (LexicalHubRouter + registry) is stubbed
 * so these tests cover only what the route owns: which entity is rendered, the
 * invalid-entity guard, the navigator controls (Back / Close / trail), the
 * route-level error boundary, and store mirroring.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { useHubStore } from "shared/store";
import { LexicalEntityPage } from "../LexicalEntityPage";

vi.mock("features/lexical-hub", () => ({
  entityHubRegistry: {
    character: () => null,
    word: () => null,
    radical: () => null,
    chengyu: () => null,
    grammar: () => null,
    phoneticCluster: () => null,
  },
  LexicalHubRouter: ({ entity }: { entity?: { entityType: string; entityId: string } }) => {
    if (entity?.entityId === "boom") throw new Error("hub exploded");
    return (
      <div data-testid="hub-router">
        {entity ? `${entity.entityType}:${entity.entityId}` : "no-entity"}
      </div>
    );
  },
}));

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname + location.search}</div>;
}

type Entry = string | { pathname: string; search?: string; state?: unknown };

/**
 * Renders the session route. Passing several entries seeds in-app history (the
 * deep link case is the plain single-entry form).
 */
function renderPage(history: Entry | Entry[]) {
  const entries = (Array.isArray(history) ? history : [history]).map((entry) => {
    if (typeof entry !== "string") return entry;
    const [pathname, search] = entry.split("?");
    return { pathname, search: search ? `?${search}` : "" };
  });

  return render(
    <MemoryRouter initialEntries={entries} initialIndex={entries.length - 1}>
      <Routes>
        <Route path="/learn/hub/:entityType/:entityId" element={<LexicalEntityPage />} />
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

const chengyuRef = { entityType: "chengyu" as const, entityId: "cy_0001" };

/** History of a session entered from /learn/chengyu that hopped chengyu → 破. */
const hoppedSession: Entry[] = [
  "/learn/chengyu",
  { pathname: "/learn/hub/chengyu/cy_0001", state: { from: "/learn/chengyu", trail: [] } },
  {
    pathname: `/learn/hub/character/${encodeURIComponent("破")}`,
    state: { from: "/learn/chengyu", trail: [chengyuRef] },
  },
];

beforeEach(() => {
  useHubStore.setState({ isOpen: false, currentEntity: null, requestedEntity: null });
});

describe("LexicalEntityPage", () => {
  it("renders the entity named by the route", () => {
    renderPage("/learn/hub/word/喜欢");
    expect(screen.getByTestId("hub-router")).toHaveTextContent("word:喜欢");
  });

  it("decodes percent-encoded entity ids from the URL", () => {
    renderPage(`/learn/hub/word/${encodeURIComponent("喜欢")}`);
    expect(screen.getByTestId("hub-router")).toHaveTextContent("word:喜欢");
  });

  it("mirrors the routed entity into the hub store", () => {
    renderPage("/learn/hub/grammar/gr_0018?label=把");
    const { currentEntity, isOpen } = useHubStore.getState();
    expect(isOpen).toBe(true);
    expect(currentEntity).toEqual({
      entityType: "grammar",
      entityId: "gr_0018",
      label: "把",
    });
  });

  it("renders the not-found notice for an unknown entity type", () => {
    renderPage("/learn/hub/dragon/abc");
    expect(screen.queryByTestId("hub-router")).not.toBeInTheDocument();
    expect(screen.getByText(/could not be found/i)).toBeInTheDocument();
    expect(useHubStore.getState().currentEntity).toBeNull();
  });

  it("sends Back to the previous in-app entry", () => {
    renderPage(["/learn/grammar?phase=2", "/learn/hub/word/喜欢"]);
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.getByTestId("location")).toHaveTextContent("/learn/grammar?phase=2");
  });

  it("sends Back to the previous ENTITY when the session hopped", () => {
    renderPage(hoppedSession);
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    // Back lands on the previous hub entry, so the session route renders again.
    expect(screen.getByTestId("hub-router")).toHaveTextContent("chengyu:cy_0001");
  });

  it("falls back to the entity's Browse surface when deep-linked", () => {
    renderPage("/learn/hub/radical/rad_0001");
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.getByTestId("location")).toHaveTextContent("/learn/radicals");
  });

  it("Close unwinds the whole session to the route it was entered from", () => {
    renderPage(hoppedSession);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/learn\/chengyu$/);
  });

  it("Close on a deep-linked detail returns to the entity's Browse surface", () => {
    renderPage("/learn/hub/radical/rad_0001");
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/learn\/radicals$/);
  });

  it("renders the visited entities as a session trail", () => {
    renderPage(hoppedSession);
    const trail = screen.getByRole("navigation", { name: "Session trail" });
    expect(trail).toHaveTextContent("cy_0001");
    expect(trail).toHaveTextContent("破");
    expect(
      screen.getByRole("button", { name: `Return to ${chengyuRef.entityId}` }),
    ).toBeInTheDocument();
  });

  it("rewinds to that step when a trail chip is clicked", () => {
    renderPage(hoppedSession);
    fireEvent.click(screen.getByRole("button", { name: `Return to ${chengyuRef.entityId}` }));
    // Rewinds instead of pushing a repeat visit, so the trail cannot grow dupes.
    expect(screen.getByTestId("hub-router")).toHaveTextContent("chengyu:cy_0001");
  });

  it("keeps duplicate visits distinct by session position", () => {
    renderPage([
      "/learn/chengyu",
      {
        pathname: `/learn/hub/character/${encodeURIComponent("破")}`,
        state: { from: "/learn/chengyu", trail: [chengyuRef, { ...chengyuRef }] },
      },
    ]);
    const trail = screen.getByRole("navigation", { name: "Session trail" });
    expect(trail.querySelectorAll("button")).toHaveLength(2);
  });

  it("ends the session in the store when the route is left", () => {
    const { unmount } = renderPage("/learn/hub/word/喜欢");
    expect(useHubStore.getState().currentEntity).not.toBeNull();
    unmount();
    expect(useHubStore.getState().currentEntity).toBeNull();
    expect(useHubStore.getState().isOpen).toBe(false);
  });
});

describe("LexicalEntityPage error boundary", () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // A render throw is expected here; keep the suite output readable.
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("renders ErrorScreen inside the page instead of blanking the app", () => {
    renderPage("/learn/hub/character/boom");

    expect(screen.getByRole("heading", { name: "This entry could not be shown" })).toBeVisible();
    expect(screen.getByText("hub exploded")).toBeVisible();

    // The page chrome survives, so the failure is not a dead end.
    expect(screen.getByRole("button", { name: /back/i })).toBeVisible();
    expect(screen.getByRole("button", { name: "Close" })).toBeVisible();
  });

  it("keeps the learner able to leave after a failed render", () => {
    renderPage(["/learn/foundations", "/learn/hub/character/boom"]);
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/learn\/foundations$/);
  });
});
