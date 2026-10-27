/**
 * @file __tests__/HubRouteBridge.test.tsx
 * @description Unit tests for the openHub → route bridge (S2 "session = route,
 * not modal"): the hub intent must produce a real navigation to the detail
 * surface, must not loop when the route already names that entity, and — the
 * epic-25 regression — must NEVER pull the learner back once they leave a hub
 * route.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useHubStore } from "shared/store";
import { openHub } from "../hubEntryPoint";
import { readHubRouteState } from "../hubPath";
import { HubRouteBridge } from "../HubRouteBridge";

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname + location.search}</div>;
}

function StateProbe() {
  const location = useLocation();
  return <div data-testid="state">{JSON.stringify(readHubRouteState(location.state))}</div>;
}

/** Stands in for any departure the shell offers — Back, a rail link, Login. */
function PopButton() {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate(-1)}>
      pop
    </button>
  );
}

type Entry = string | { pathname: string; search?: string; state?: unknown };

function renderShell(entries: Entry | Entry[] = "/learn/grammar") {
  const initialEntries = Array.isArray(entries) ? entries : [entries];
  return render(
    <MemoryRouter initialEntries={initialEntries} initialIndex={initialEntries.length - 1}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              <HubRouteBridge />
              <LocationProbe />
              <StateProbe />
              <PopButton />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useHubStore.setState({ isOpen: false, currentEntity: null, requestedEntity: null });
});

describe("HubRouteBridge", () => {
  it("navigates to the routed detail surface when openHub() fires", () => {
    renderShell("/learn/grammar");
    expect(screen.getByTestId("location")).toHaveTextContent("/learn/grammar");

    act(() => {
      openHub({ entityType: "grammar", entityId: "gr_0018", label: "把" });
    });

    expect(screen.getByTestId("location")).toHaveTextContent("/learn/hub/grammar/gr_0018");
    expect(screen.getByTestId("location")).toHaveTextContent("label=");
  });

  it("percent-encodes non-ASCII entity ids", () => {
    renderShell("/learn/readers");
    act(() => {
      openHub({ entityType: "word", entityId: "喜欢" });
    });
    expect(screen.getByTestId("location").textContent).toContain(
      "/learn/hub/word/" + encodeURIComponent("喜欢"),
    );
  });

  it("does not navigate while the hub is closed", () => {
    renderShell("/learn/radicals");
    expect(screen.getByTestId("location")).toHaveTextContent("/learn/radicals");
  });

  it("does not re-navigate when the route already names the entity", () => {
    renderShell("/learn/hub/grammar/gr_0018");

    act(() => {
      useHubStore.getState().syncFromRoute({
        entityType: "grammar",
        entityId: "gr_0018",
        label: "把",
      });
    });

    // Same pathname, and no `?label=` query was appended by a needless nav.
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/learn\/hub\/grammar\/gr_0018$/);
  });

  it("never navigates from the route mirror alone", () => {
    renderShell("/learn/foundations");

    // This is what LexicalEntityPage does while a hub route is mounted; it must
    // not act as an intent (it used to set `isOpen` and trap every departure).
    act(() => {
      useHubStore.getState().syncFromRoute({ entityType: "character", entityId: "喜" });
    });

    expect(screen.getByTestId("location")).toHaveTextContent(/^\/learn\/foundations$/);
    expect(useHubStore.getState().isOpen).toBe(true);
  });

  it("does not pull the learner back after they leave a hub route", () => {
    renderShell(["/learn/chengyu", "/learn/hub/chengyu/cy_0001?label=%E7%A0%B4%E9%87%9C"]);

    // The page mirrors the route it is showing — the old trap's trigger.
    act(() => {
      useHubStore.getState().syncFromRoute({ entityType: "chengyu", entityId: "cy_0001" });
    });

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "pop" }));
    });

    expect(screen.getByTestId("location")).toHaveTextContent(/^\/learn\/chengyu$/);

    // ...and it stays left: no late re-navigation after further renders.
    act(() => {
      useHubStore.getState().syncFromRoute(null);
    });
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/learn\/chengyu$/);
  });

  it("hops hub → hub and records the visited entity as the session trail", () => {
    renderShell([`/learn/hub/chengyu/cy_0001?label=${encodeURIComponent("破釜沉舟")}`]);

    act(() => {
      openHub({ entityType: "character", entityId: "破", label: "pò" });
    });

    expect(screen.getByTestId("location").textContent).toContain(
      "/learn/hub/character/" + encodeURIComponent("破"),
    );
    // The trail keeps the label hint the learner actually saw, not the content id.
    expect(JSON.parse(screen.getByTestId("state").textContent ?? "{}")).toEqual({
      trail: [{ entityType: "chengyu", entityId: "cy_0001", label: "破釜沉舟" }],
    });
  });

  it("keeps the entry origin across a hop", () => {
    renderShell([
      "/learn/chengyu",
      { pathname: "/learn/hub/chengyu/cy_0001", state: { from: "/learn/chengyu", trail: [] } },
    ]);

    act(() => {
      openHub({ entityType: "character", entityId: "破" });
    });

    expect(JSON.parse(screen.getByTestId("state").textContent ?? "{}")).toEqual({
      from: "/learn/chengyu",
      trail: [{ entityType: "chengyu", entityId: "cy_0001" }],
    });
  });

  it("spends the intent exactly once", () => {
    renderShell("/learn/grammar");

    act(() => {
      openHub({ entityType: "grammar", entityId: "gr_0018" });
    });

    expect(useHubStore.getState().requestedEntity).toBeNull();

    // A re-render of the same tree must not navigate a second time.
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "pop" }));
    });
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/learn\/grammar$/);
  });
});
