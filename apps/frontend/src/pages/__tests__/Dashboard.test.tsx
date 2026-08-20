/**
 * Integration Tests for Dashboard Page
 * Wireframe Sections 8.3/8.5
 *
 * Tests Dashboard phase-aware display:
 * - Phase 1 empty state: welcome prompt with "Start with Pinyin Basics" CTA
 * - Phase 2+: phase progress, quick access buttons, recent activity
 * - Loading state via the Skeleton shell (D.8 — no CLS)
 * - Navigation via quick access buttons
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
    expect(container.querySelector(".dashboard[aria-busy='true']")).not.toBeNull();
    expect(screen.getAllByRole("status", { name: "Loading" }).length).toBeGreaterThan(0);

    // A11y (axe page-has-heading-one): the loading branch keeps exactly one
    // <h1> — the sr-only "Dashboard" title — so the page never loses its
    // single heading while loading (Storybook Loading story a11y check).
    expect(screen.getByRole("heading", { level: 1, name: "Dashboard" })).toBeInTheDocument();
  });

  it("should show Phase 1 empty state by default", async () => {
    (usePhaseGate as ReturnType<typeof vi.fn>).mockReturnValue({
      phaseGate: { currentPhase: 1, updatedAt: "2026-01-01" },
      isLoading: false,
    });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome to PinyinPal/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Let's start learning/i)).toBeInTheDocument();
    expect(screen.getByText(/Start with Pinyin Basics/i)).toBeInTheDocument();
  });

  it("should show Phase 2+ dashboard with phase card", async () => {
    (usePhaseGate as ReturnType<typeof vi.fn>).mockReturnValue({
      phaseGate: { currentPhase: 2, updatedAt: "2026-01-01" },
      isLoading: false,
    });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Phase 2: The Core 300/i)).toBeInTheDocument();
  });

  it("should show quick access buttons for Phase 2+", async () => {
    (usePhaseGate as ReturnType<typeof vi.fn>).mockReturnValue({
      phaseGate: { currentPhase: 2, updatedAt: "2026-01-01" },
      isLoading: false,
    });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Review Characters/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Take Phase Quiz/i)).toBeInTheDocument();
    expect(screen.getByText(/Study Radicals/i)).toBeInTheDocument();
    expect(screen.getByText(/View Progress/i)).toBeInTheDocument();
  });

  it("should show Continue Learning button", async () => {
    (usePhaseGate as ReturnType<typeof vi.fn>).mockReturnValue({
      phaseGate: { currentPhase: 2, updatedAt: "2026-01-01" },
      isLoading: false,
    });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Continue Learning/i)).toBeInTheDocument();
    });
  });
});
