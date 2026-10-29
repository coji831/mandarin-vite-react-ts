/**
 * Tests for DashboardGuest component
 *
 * Verifies the guest-facing dashboard in its §8 order:
 * - welcome message
 * - the BM-2 wedge card leads (before the register ask)
 * - ONE primary CTA (start the Blueprint); registration is a ghost
 * - phase preview cards
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

  it("renders ONE primary CTA — start the Blueprint", () => {
    renderWithRouter();
    expect(screen.getByRole("button", { name: "Start the Blueprint" })).toBeInTheDocument();
  });

  it("leads with the BM-2 wedge card (§8: prove the delta first)", () => {
    renderWithRouter();
    expect(screen.getByRole("heading", { name: "Hear your tone" })).toBeInTheDocument();
    // The ask is honest: the grading engine is not live yet.
    expect(screen.getByText(/Tone grading is not live yet/i)).toBeInTheDocument();
  });

  it("keeps registration as the ghost, not the entry fee", () => {
    renderWithRouter();
    expect(
      screen.getByRole("button", { name: /Create an account to keep your progress/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Sign Up Free/i)).toBeNull();
  });

  it("renders a single h1 page header", () => {
    renderWithRouter();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("owns the guest-state affordance (A25 — guest state is Browse-only)", () => {
    // The dashboard is the ONE place a guest prompt lives (BM-1 §3 / A25).
    // `AppLayout` renders none of this — the absence is pinned in
    // shared/layouts/__tests__/AppLayout.test.tsx.
    renderWithRouter();
    expect(screen.getByText(/Start learning Mandarin — no account needed/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create an account/i })).toBeInTheDocument();
    expect(screen.getByText(/Phase 4: Advanced/i)).toBeInTheDocument();
  });
});
