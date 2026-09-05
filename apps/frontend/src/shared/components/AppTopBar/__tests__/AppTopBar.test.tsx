/**
 * @file shared/components/AppTopBar/__tests__/AppTopBar.test.tsx
 * @description Smoke tests for AppTopBar (Story 22.4 / review N8) — renders
 * the UserMenu in both authed and guest states, plus the Epic 25 S1 passive
 * Guest identity badge (guest only — never for authed users).
 */
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "src/test-utils";
import { AppTopBar } from "../AppTopBar";

const authedProps = {
  user: { id: "u1", email: "user@example.com", displayName: "Test User" },
  isAuthenticated: true,
  isGuest: false,
  logout: vi.fn().mockResolvedValue(undefined),
};

const guestProps = {
  user: null,
  isAuthenticated: false,
  isGuest: true,
  logout: vi.fn().mockResolvedValue(undefined),
};

describe("AppTopBar", () => {
  it("renders the authed UserMenu (avatar trigger)", () => {
    renderWithProviders(<AppTopBar {...authedProps} />);
    expect(screen.getByLabelText(/Account menu for Test User/)).toBeInTheDocument();
  });

  it("renders the guest UserMenu (Login / Register CTAs)", () => {
    renderWithProviders(<AppTopBar {...guestProps} />);
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Register" })).toBeInTheDocument();
  });

  it("renders the passive Guest identity badge when isGuest is true", () => {
    renderWithProviders(<AppTopBar {...guestProps} />);
    const badge = screen.getByTestId("guest-identity-badge");
    expect(badge).toHaveTextContent("Guest");
    // Passive identity only — no CTA/upsell (epic-26 NON-GOAL).
    expect(
      screen.queryByRole("button", { name: /create an account|sign up/i }),
    ).not.toBeInTheDocument();
  });

  it("does not render the Guest identity badge for an authenticated user", () => {
    renderWithProviders(<AppTopBar {...authedProps} />);
    expect(screen.queryByTestId("guest-identity-badge")).not.toBeInTheDocument();
  });
});
