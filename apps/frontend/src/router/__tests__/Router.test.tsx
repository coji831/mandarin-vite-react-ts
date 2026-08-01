/**
 * @file router/__tests__/Router.test.tsx
 * @description Tests for the main application router route wiring.
 * VisFix W6b: /dashboard must render the dashboard as an alias of /.
 *
 * AppLayout and page modules are mocked so the test focuses purely on route
 * matching (which element renders for which path) without pulling in auth,
 * nav, or data-fetching dependencies.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MainRoutes from "../Router";

vi.mock("../../shared/layouts/AppLayout", async () => {
  const { Outlet } = await import("react-router-dom");
  return {
    AppLayout: () => (
      <div data-testid="app-layout">
        <Outlet />
      </div>
    ),
  };
});

vi.mock("../../pages/dashboard/DashboardPage", () => ({
  DashboardPage: () => <div data-testid="dashboard-page">Dashboard</div>,
}));

vi.mock("../LearnRoutes", () => ({
  LearnRoutes: () => null,
}));

vi.mock("../PracticesRoutes", () => ({
  PracticesRoutes: () => null,
}));

vi.mock("../../pages/LibraryPage", () => ({
  default: () => null,
}));

vi.mock("../../pages/ProgressPage", () => ({
  ProgressPage: () => null,
}));

vi.mock("../../pages/LoginPage", () => ({
  LoginPage: () => null,
}));

vi.mock("../../pages/RegisterPage", () => ({
  RegisterPage: () => null,
}));

function renderRouter(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <MainRoutes />
    </MemoryRouter>,
  );
}

describe("MainRoutes", () => {
  it("renders the dashboard at /", () => {
    renderRouter("/");
    expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
  });

  it("renders the dashboard at /dashboard (alias)", () => {
    renderRouter("/dashboard");
    expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
  });

  it("wraps routes in the app layout", () => {
    renderRouter("/");
    expect(screen.getByTestId("app-layout")).toBeInTheDocument();
  });
});
