/**
 * Tests for DashboardGuest component
 *
 * Verifies guest-facing dashboard rendering:
 * - Welcome message
 * - Phase preview cards
 * - Registration CTA
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { DashboardGuest } from "../DashboardGuest";

const renderWithRouter = () =>
  render(
    <BrowserRouter>
      <DashboardGuest />
    </BrowserRouter>,
  );

describe("DashboardGuest", () => {
  it("renders welcome message", () => {
    renderWithRouter();
    expect(screen.getByText(/Welcome to PinyinPal/i)).toBeInTheDocument();
  });

  it("renders phase preview cards", () => {
    renderWithRouter();
    expect(screen.getByText(/Phase 1: Foundations/i)).toBeInTheDocument();
    expect(screen.getByText(/Phase 2: Radicals & Characters/i)).toBeInTheDocument();
    expect(screen.getByText(/Phase 3: Reading & Grammar/i)).toBeInTheDocument();
    expect(screen.getByText(/Phase 4: Advanced/i)).toBeInTheDocument();
  });

  it("renders sign-up CTA button in the header", () => {
    renderWithRouter();
    expect(screen.getByText(/Sign Up Free/i)).toBeInTheDocument();
  });

  it("renders start learning button (hero secondary)", () => {
    renderWithRouter();
    expect(screen.getByText(/Start with Pinyin Basics/i)).toBeInTheDocument();
  });

  it("renders a single h1 page header", () => {
    renderWithRouter();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("owns the guest-state affordance (A25 — guest state is Browse-only)", () => {
    // The dashboard is the ONE place a guest prompt lives (BM-1 §3 / A25):
    // welcome copy + the registration CTA + the all-phase preview of what a
    // guest may browse. `AppLayout` renders none of this — the absence is
    // pinned in shared/layouts/__tests__/AppLayout.test.tsx.
    renderWithRouter();
    expect(screen.getByText(/no account needed/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign Up Free/ })).toBeInTheDocument();
    expect(screen.getByText(/Phase 4: Advanced/i)).toBeInTheDocument();
  });
});
