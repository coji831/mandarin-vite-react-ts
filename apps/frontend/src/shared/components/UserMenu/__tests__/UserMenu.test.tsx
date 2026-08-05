/**
 * @file shared/components/UserMenu/__tests__/UserMenu.test.tsx
 * @description Tests for UserMenu — the single account control
 * (login/user-info/logout surface) hosted in the AppTopBar. Story 22.4.
 *
 * Review N1: auth is threaded in via props (no `features/auth` import).
 * Review N6: popover is a disclosure-style `role="list"` of buttons.
 */
import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { renderWithProviders } from "src/test-utils";
import type { RenderWithProvidersOptions } from "src/test-utils";
import { UserMenu, type UserMenuProps } from "../UserMenu";

function renderUserMenu(
  props: Partial<UserMenuProps> = {},
  options: Partial<RenderWithProvidersOptions> = {},
) {
  const merged: UserMenuProps = {
    user: { id: "test-user", email: "user@example.com", displayName: "Test User" },
    isAuthenticated: true,
    logout: vi.fn().mockResolvedValue(undefined),
    ...props,
  };
  return renderWithProviders(
    <Routes>
      {/* Wildcard so UserMenu renders at any initial route (e.g. "/learn/grammar")
       * for the "from" navigation test; specific routes below take precedence. */}
      <Route path="*" element={<UserMenu {...merged} />} />
      <Route path="/auth/login" element={<div>Login Page</div>} />
      <Route path="/profile" element={<div>Profile Page</div>} />
      <Route path="/settings" element={<div>Settings Page</div>} />
    </Routes>,
    options,
  );
}

const guestProps = { isAuthenticated: false, user: null };

describe("UserMenu", () => {
  describe("guest state", () => {
    it("renders Login and Register CTAs", () => {
      renderUserMenu(guestProps);
      expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Register" })).toBeInTheDocument();
      expect(screen.queryByLabelText(/Account menu for/)).not.toBeInTheDocument();
    });

    it("navigates to /auth/login with the current location as `from`", async () => {
      renderUserMenu(guestProps, { route: "/learn/grammar" });
      fireEvent.click(screen.getByRole("button", { name: "Login" }));
      expect(await screen.findByText("Login Page")).toBeInTheDocument();
    });
  });

  describe("authed state", () => {
    it("renders an avatar trigger with the user's short name", () => {
      renderUserMenu();
      expect(screen.getByLabelText(/Account menu for Test User/)).toBeInTheDocument();
      expect(screen.getByText("Test User")).toBeInTheDocument();
    });

    it("opens the menu on trigger click and shows Profile / Settings / Logout", () => {
      renderUserMenu();
      fireEvent.click(screen.getByLabelText(/Account menu for/));
      expect(screen.getByRole("list", { name: "User menu" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Profile" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
    });

    it("closes the menu on Escape", () => {
      renderUserMenu();
      fireEvent.click(screen.getByLabelText(/Account menu for/));
      expect(screen.getByRole("list", { name: "User menu" })).toBeInTheDocument();
      fireEvent.keyDown(document.body, { key: "Escape" });
      expect(screen.queryByRole("list", { name: "User menu" })).not.toBeInTheDocument();
    });

    it("navigates to /profile when Profile is clicked", async () => {
      renderUserMenu();
      fireEvent.click(screen.getByLabelText(/Account menu for/));
      fireEvent.click(screen.getByRole("button", { name: "Profile" }));
      expect(await screen.findByText("Profile Page")).toBeInTheDocument();
    });

    it("navigates to /settings when Settings is clicked", async () => {
      renderUserMenu();
      fireEvent.click(screen.getByLabelText(/Account menu for/));
      fireEvent.click(screen.getByRole("button", { name: "Settings" }));
      expect(await screen.findByText("Settings Page")).toBeInTheDocument();
    });

    it("calls logout on Logout", async () => {
      const logout = vi.fn().mockResolvedValue(undefined);
      renderUserMenu({ logout });
      fireEvent.click(screen.getByLabelText(/Account menu for/));
      fireEvent.click(screen.getByRole("button", { name: "Logout" }));
      await waitFor(() => expect(logout).toHaveBeenCalled());
    });
  });
});
