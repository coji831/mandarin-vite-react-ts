/**
 * @file __tests__/LexicalEntityPage.test.tsx
 * @description Unit tests for the routed lexical session page (S2 — "session =
 * route, not modal"). The entity body (LexicalHubRouter + registry) is stubbed
 * so these tests cover only what the route owns: which entity is rendered, the
 * invalid-entity guard, the Back control, and store mirroring.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
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
  LexicalHubRouter: ({ entity }: { entity?: { entityType: string; entityId: string } }) => (
    <div data-testid="hub-router">
      {entity ? `${entity.entityType}:${entity.entityId}` : "no-entity"}
    </div>
  ),
}));

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname + location.search}</div>;
}

/**
 * Renders the session route. Passing an array seeds in-app history (the deep
 * link case is the plain single-entry form).
 */
function renderPage(history: string | string[]) {
  const entries = (Array.isArray(history) ? history : [history]).map((entry) => {
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

beforeEach(() => {
  useHubStore.setState({ isOpen: false, currentEntity: null });
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

  it("falls back to the entity's Browse surface when deep-linked", () => {
    renderPage("/learn/hub/radical/rad_0001");
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.getByTestId("location")).toHaveTextContent("/learn/radicals");
  });

  it("ends the session in the store when the route is left", () => {
    const { unmount } = renderPage("/learn/hub/word/喜欢");
    expect(useHubStore.getState().currentEntity).not.toBeNull();
    unmount();
    expect(useHubStore.getState().currentEntity).toBeNull();
    expect(useHubStore.getState().isOpen).toBe(false);
  });
});
