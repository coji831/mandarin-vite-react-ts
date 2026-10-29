/**
 * Integration Tests for Dashboard Page
 * Wireframe Sections 8.3/8.5
 *
 * Rework (§8): the dashboard is ONE primary CTA + the BM-2 wedge card + one
 * resume row. The four QuickTiles and the Current Phase card are gone (the rail
 * already carries every one of those destinations), so these tests pin the new
 * shape instead: one primary, the wedge, and no tile grid.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { DashboardPage } from "../dashboard/DashboardPage";
import { usePhaseGate } from "shared/hooks";

// Mock usePhaseGate
vi.mock("shared/hooks", () => ({
  usePhaseGate: vi.fn(),
}));

// Mock features/auth — provide a pass-through AuthProvider and a mock useAuth
// returning an authenticated user (the default state for registered users).
vi.mock("features/auth", () => {
  const MockAuthProvider = ({ children }: { children: ReactNode }) => <>{children}</>;
  const mockUseAuth = () => ({
    user: { id: "test-user", email: "test@test.com", displayName: "Test User" },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshTokens: vi.fn(),
  });
  return {
    AuthProvider: MockAuthProvider,
    useAuth: mockUseAuth,
  };
});

const renderWithProviders = (component: ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("Dashboard Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show loading skeleton when phase gate is loading", () => {
    (usePhaseGate as ReturnType<typeof vi.fn>).mockReturnValue({
      phaseGate: null,
      isLoading: true,
    });

    const { container } = renderWithProviders(<DashboardPage />);

    // Loading branch renders the data-resilient Skeleton shell (D.8), not the
    // old LoadingScreen. Assert the shell (aria-busy) + status skeletons exist.
    expect(container.querySelector(".page-shell[aria-busy='true']")).not.toBeNull();
    expect(screen.getAllByRole("status", { name: "Loading" }).length).toBeGreaterThan(0);

    // A11y (axe page-has-heading-one): the loading branch keeps exactly one
    // <h1> — the sr-only "Dashboard" title — so the page never loses its
    // single heading while loading (Storybook Loading story a11y check).
    expect(screen.getByRole("heading", { level: 1, name: "Dashboard" })).toBeInTheDocument();
  });

  it("should show Phase 1 welcome with the Blueprint CTA", async () => {
    (usePhaseGate as ReturnType<typeof vi.fn>).mockReturnValue({
      phaseGate: { currentPhase: 1, updatedAt: "2026-01-01" },
      isLoading: false,
    });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome to PinyinPal/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Start with Pinyin Basics" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Hear your tone" })).toBeInTheDocument();
  });

  it("should show Phase 2+ with ONE primary CTA and no tile grid", async () => {
    (usePhaseGate as ReturnType<typeof vi.fn>).mockReturnValue({
      phaseGate: { currentPhase: 2, updatedAt: "2026-01-01" },
      isLoading: false,
    });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    });
    // The phase title is an eyebrow, not a card.
    expect(screen.getByText("The Core 300")).toBeInTheDocument();
    // Exactly one primary action on the page.
    const primaries = document.querySelectorAll(".btn-primary");
    expect(primaries).toHaveLength(1);
  });

  it("should not render the removed QuickTile destinations", async () => {
    (usePhaseGate as ReturnType<typeof vi.fn>).mockReturnValue({
      phaseGate: { currentPhase: 2, updatedAt: "2026-01-01" },
      isLoading: false,
    });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Review Characters/i)).toBeNull();
    expect(screen.queryByText(/Take Phase Quiz/i)).toBeNull();
    expect(screen.queryByText(/Study Radicals/i)).toBeNull();
    expect(screen.queryByText(/View Progress/i)).toBeNull();
  });

  it("should lead with the BM-2 wedge card", async () => {
    (usePhaseGate as ReturnType<typeof vi.fn>).mockReturnValue({
      phaseGate: { currentPhase: 3, updatedAt: "2026-01-01" },
      isLoading: false,
    });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Hear your tone" })).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /Continue:/ })).toBeInTheDocument();
  });
});
