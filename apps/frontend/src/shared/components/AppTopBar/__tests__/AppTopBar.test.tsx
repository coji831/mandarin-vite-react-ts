/**
 * @file shared/components/AppTopBar/__tests__/AppTopBar.test.tsx
 * @description Smoke tests for AppTopBar (Story 22.4 / review N8) — renders
 * the UserMenu in both authed and guest states.
 */
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "src/test-utils";
import { AppTopBar } from "../AppTopBar";

const authedProps = {
  user: { id: "u1", email: "user@example.com", displayName: "Test User" },
  isAuthenticated: true,
  logout: vi.fn().mockResolvedValue(undefined),
};

describe("AppTopBar", () => {
  it("renders the authed UserMenu (avatar trigger)", () => {
    renderWithProviders(<AppTopBar {...authedProps} />);
    expect(screen.getByLabelText(/Account menu for Test User/)).toBeInTheDocument();
  });

  it("renders the guest UserMenu (Login / Register CTAs)", () => {
    renderWithProviders(<AppTopBar user={null} isAuthenticated={false} logout={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Register" })).toBeInTheDocument();
  });
});
