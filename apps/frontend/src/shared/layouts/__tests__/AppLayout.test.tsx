/**
 * @file shared/layouts/__tests__/AppLayout.test.tsx
 * @description Tests for AppLayout (Story 22.4 composition: AppTopBar +
 * auth-free SideNav with phase-gated Learn group + Outlet; lexical sessions are
 * routed detail pages, so the shell mounts a navigation bridge and no overlay).
 *
 * Auth-page behavior (VisFix W5): Login AND Register must both render
 * standalone (no main nav sidebar), but the AppTopBar/UserMenu remain.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "../AppLayout";

const { mockUseAuth, mockUsePhaseGate } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUsePhaseGate: vi.fn(),
}));

vi.mock("features/auth", () => ({
  useAuth: mockUseAuth,
}));

// The bridge only navigates (renders nothing) — stub it so the shell is isolated.
vi.mock("shared/hub-entry", async () => {
  const actual = await vi.importActual<typeof import("shared/hub-entry")>("shared/hub-entry");
  return { ...actual, HubRouteBridge: () => null };
});

vi.mock("shared/hooks", () => ({
  usePhaseGate: mockUsePhaseGate,
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

  it("renders the calibrated Phase-1 identity for a guest — Phase-2+ Learn items locked (Story 24-7)", () => {
    // Guest: no auth + the calibrated guest gate ({currentPhase: 1, isGuest: true}).
    // The shell must NOT fall back to the old all-unlocked `: 4` override.
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: vi.fn(),
    });
    mockUsePhaseGate.mockReturnValue({
      phaseGate: { currentPhase: 1, isGuest: true },
      isLoading: false,
    });
    renderAppLayout("/learn/grammar");

    // Phase-1 (Foundations) stays unlocked for the guest…
    expect(screen.getByRole("link", { name: /Foundations/ })).not.toHaveAttribute("aria-disabled");
    // …but Phase-2+ items (Radicals/Grammar/…) render locked, not all-unlocked.
    const grammar = screen.getByRole("link", { name: /Grammar/ });
    expect(grammar).toHaveAttribute("aria-disabled");
    expect(grammar).toHaveAttribute("title", "Complete Phase 2 to unlock");
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
