/**
 * @file __tests__/HubRouteBridge.test.tsx
 * @description Unit tests for the openHub → route bridge (S2 "session = route,
 * not modal"): the hub intent must produce a real navigation to the detail
 * surface, and must not loop when the route already names that entity.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { useHubStore } from "shared/store";
import { openHub } from "../hubEntryPoint";
import { HubRouteBridge } from "../HubRouteBridge";

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname + location.search}</div>;
}

function renderShell(path = "/learn/grammar") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              <HubRouteBridge />
              <LocationProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useHubStore.setState({ isOpen: false, currentEntity: null });
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
    render(
      <MemoryRouter initialEntries={["/learn/hub/grammar/gr_0018"]}>
        <Routes>
          <Route
            path="/learn/hub/:entityType/:entityId"
            element={
              <>
                <HubRouteBridge />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

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
});
