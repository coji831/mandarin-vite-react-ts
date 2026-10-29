/**
 * @file shared/layouts/__tests__/AppLayout.test.tsx
 * @description Tests for AppLayout (Story 22.4 composition: AppTopBar +
 * auth-free SideNav with the Learn group + Outlet; lexical sessions are routed
 * detail pages, so the shell mounts a navigation bridge and no overlay).
 *
 * Story 25-3 / A25 (BM-1 §3, L6): the shell renders chrome + <Outlet /> only.
 * It reads NO phase for navigation (the `usePhaseGate`/`effectivePhase` wiring
 * and the SideNav phase props are deleted), every Learn item is an ordinary
 * link for every visitor, and there is no guest region/banner/badge here —
 * guest state lives on the Browse dashboard (`features/dashboard`
 * `DashboardGuest`).
 *
 * Auth-page behavior (VisFix W5): Login AND Register must both render
 * standalone (no main nav sidebar), but the AppTopBar/UserMenu remain.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { LEARN_NAV_ITEMS } from "shared/constants";
import { AppLayout } from "../AppLayout";

const { mockUseAuth } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
}));

vi.mock("features/auth", () => ({
  useAuth: mockUseAuth,
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
  mockUseAuth.mockReturnValue({
    user: { displayName: "Alex", email: "alex@example.com" },
    isAuthenticated: true,
    logout: vi.fn(),
  });
});

const mockGuest = () => {
  mockUseAuth.mockReturnValue({
    user: null,
    isAuthenticated: false,
    logout: vi.fn(),
  });
};

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

  it("renders the Learn group in the sidebar with every child present", () => {
    renderAppLayout("/learn/grammar");
    for (const item of LEARN_NAV_ITEMS) {
      expect(screen.getByRole("link", { name: item.label })).toBeInTheDocument();
    }
  });

  it("renders the collapsed rail when initialized collapsed (no Learn children, has expand toggle)", () => {
    renderAppLayout("/", true);
    expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Grammar/ })).not.toBeInTheDocument();
  });

  it("renders chrome + <Outlet /> only — no guest region, banner, or badge (A25)", () => {
    // Guest state is Browse-only (BM-1 §3 / A25): the shell must never grow a
    // persistent guest affordance, because chrome is inherited by every route
    // and would occupy Focus surfaces permanently. The dashboard owns it.
    mockGuest();
    const { container } = renderAppLayout("/");

    // <main> holds the routed page and nothing else — no injected region.
    const main = screen.getByText("page content").closest("main");
    expect(main).not.toBeNull();
    expect(main!.children).toHaveLength(1);
    expect(main!.querySelector("[class*='guest'], [data-testid*='guest']")).toBeNull();

    // The shell is chrome + <Outlet />: the rail and the main column, nothing else.
    const shell = container.querySelector(".app-layout")!;
    expect(Array.from(shell.children).map((el) => el.className.split(" ")[0])).toEqual([
      "side-nav",
      "app-main",
    ]);

    // The only guest-marked node is the TopBar account control (UserMenu) —
    // no guest banner/badge/region was added to the layout.
    const guestNodes = Array.from(
      container.querySelectorAll("[class*='guest'], [data-testid*='guest']"),
    );
    expect(guestNodes).toHaveLength(1);
    expect(guestNodes[0]).toHaveClass("user-menu--guest");
    expect(screen.queryByText(/^guest$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/sign up/i)).not.toBeInTheDocument();
  });

  it("leaves every Learn item enabled for a guest — no lock, no title prompt (A25)", () => {
    mockGuest();
    renderAppLayout("/learn/chengyu");

    for (const item of LEARN_NAV_ITEMS) {
      const link = screen.getByRole("link", { name: item.label });
      expect(link).toHaveAttribute("href", item.path);
      expect(link).not.toHaveAttribute("aria-disabled");
      expect(link).not.toHaveAttribute("tabindex");
      expect(link.getAttribute("title") ?? "").not.toMatch(/unlock|locked|requires/i);
    }
    // The deep-linked phase-ahead item is current — the pill is not suppressed.
    expect(screen.getByRole("link", { name: "Chengyu" })).toHaveAttribute("aria-current", "page");
  });
});

describe("AppLayout mode-aware chrome (dual-mode chrome law)", () => {
  it("renders a Focus route with a forced-collapsed rail and a recessed top bar", () => {
    const { container } = renderAppLayout("/practices/review");
    // The rail is mounted (non-auth) but forced to the icon rail — Learn
    // children are unmounted and the manual collapse toggle is hidden (Focus
    // chrome is fixed, not user-toggled).
    expect(mainNav()).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Grammar/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /sidebar/i })).not.toBeInTheDocument();
    // The top bar recedes (Focus chrome).
    expect(container.querySelector(".app-top-bar--recessed")).toBeInTheDocument();
  });

  it("renders a Browse route with the expanded rail and a standard top bar", () => {
    const { container } = renderAppLayout("/");
    // Browse keeps the user's collapse toggle and the standard (non-recessed) top bar.
    expect(screen.getByRole("button", { name: "Collapse sidebar" })).toBeInTheDocument();
    expect(container.querySelector(".app-top-bar--recessed")).not.toBeInTheDocument();
  });

  it("keeps auth routes rail-less (no sidebar) with the standard top bar", () => {
    const { container } = renderAppLayout("/auth/login");
    expect(mainNav()).not.toBeInTheDocument();
    expect(container.querySelector(".app-top-bar--recessed")).not.toBeInTheDocument();
  });
});
