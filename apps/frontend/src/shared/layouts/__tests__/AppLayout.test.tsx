/**
 * @file shared/layouts/__tests__/AppLayout.test.tsx
 * @description Tests for AppLayout (Story 22.4 composition: AppTopBar +
 * auth-free SideNav with phase-gated Learn group + Outlet + HubModal).
 *
 * Auth-page behavior (VisFix W5): Login AND Register must both render
 * standalone (no main nav sidebar), but the AppTopBar/UserMenu remain.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "../AppLayout";

vi.mock("features/auth", () => ({
  useAuth: () => ({
    user: { displayName: "Alex", email: "alex@example.com" },
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}));

vi.mock("features/lexical-hub/components", () => ({
  LexicalHubRouter: () => null,
}));

const { mockUsePhaseGate } = vi.hoisted(() => ({ mockUsePhaseGate: vi.fn() }));

vi.mock("shared/hooks", () => ({
  usePhaseGate: mockUsePhaseGate,
}));

vi.mock("shared/store", () => ({
  useHubStore: () => ({
    isOpen: false,
    currentEntity: null,
    close: vi.fn(),
  }),
}));

function renderAppLayout(initialPath: string, initialCollapsed?: boolean) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<AppLayout initialCollapsed={initialCollapsed} />}>
          <Route path="*" element={<div>page content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

const mainNav = () => screen.queryByRole("navigation", { name: "Main navigation" });
const userMenu = () => screen.queryByLabelText(/Account menu for/);

beforeEach(() => {
  mockUsePhaseGate.mockReturnValue({ phaseGate: { currentPhase: 4 }, isLoading: false });
});

describe("AppLayout auth-page sidebar behavior", () => {
  it("hides the sidebar on the login page but keeps the AppTopBar UserMenu (standalone)", () => {
    renderAppLayout("/auth/login");
    expect(mainNav()).not.toBeInTheDocument();
    expect(userMenu()).toBeInTheDocument();
    expect(screen.getByText("page content")).toBeInTheDocument();
  });

  it("hides the sidebar on the register page — matches login (VisFix W5)", () => {
    renderAppLayout("/auth/register");
    expect(mainNav()).not.toBeInTheDocument();
    expect(screen.getByText("page content")).toBeInTheDocument();
  });

  it("shows the sidebar on non-auth pages", () => {
    renderAppLayout("/");
    expect(mainNav()).toBeInTheDocument();
  });
});

describe("AppLayout composition (Story 22.4)", () => {
  it("renders the AppTopBar UserMenu on non-auth pages", () => {
    renderAppLayout("/");
    expect(userMenu()).toBeInTheDocument();
  });

  it("renders the phase-gated Learn group in the sidebar (children present)", () => {
    renderAppLayout("/learn/grammar");
    expect(screen.getByRole("link", { name: /Grammar/ })).toBeInTheDocument();
  });

  it("renders the collapsed rail when initialized collapsed (no Learn children, has expand toggle)", () => {
    renderAppLayout("/", true);
    expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Grammar/ })).not.toBeInTheDocument();
  });

  it("keeps the Learn group unlocked while the phase gate is loading (no false phase-1 lock)", () => {
    // Review N7: on in-flight/failed gate fetch, authed users default to "all unlocked".
    mockUsePhaseGate.mockReturnValue({ phaseGate: null, isLoading: true });
    renderAppLayout("/");
    const grammar = screen.getByRole("link", { name: /Grammar/ });
    expect(grammar).not.toHaveAttribute("aria-disabled");
  });
});
