/**
 * Integration Tests for Dashboard Page
 * Wireframe Sections 8.3/8.5
 *
 * Tests Dashboard phase-aware display:
 * - Phase 1 empty state: welcome prompt with "Start with Pinyin Basics" CTA
 * - Phase 2+: phase progress, quick access buttons, recent activity
 * - Loading state via LoadingScreen
 * - Navigation via quick access buttons
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { DashboardPage } from "../DashboardPage";
import { usePhaseGate } from "shared/hooks";

// Mock usePhaseGate
vi.mock("shared/hooks", () => ({
  usePhaseGate: vi.fn(),
}));

// Helper to render with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("Dashboard Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show loading state when phase gate is loading", () => {
    (usePhaseGate as ReturnType<typeof vi.fn>).mockReturnValue({
      phaseGate: null,
      isLoading: true,
    });

    renderWithRouter(<DashboardPage />);

    expect(screen.getByText(/Loading your dashboard/i)).toBeInTheDocument();
  });

  it("should show Phase 1 empty state by default", async () => {
    (usePhaseGate as ReturnType<typeof vi.fn>).mockReturnValue({
      phaseGate: { currentPhase: 1, updatedAt: "2026-01-01" },
      isLoading: false,
    });

    renderWithRouter(<DashboardPage />);

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

    renderWithRouter(<DashboardPage />);

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

    renderWithRouter(<DashboardPage />);

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

    renderWithRouter(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Continue Learning/i)).toBeInTheDocument();
    });
  });
});
