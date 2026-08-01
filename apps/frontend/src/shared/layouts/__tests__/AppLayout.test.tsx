/**
 * @file shared/layouts/__tests__/AppLayout.test.tsx
 * @description Tests for AppLayout auth-page sidebar behavior.
 * VisFix W5: Login AND Register must both render standalone (no main nav sidebar).
 * Previously only /auth/login hid the sidebar, so /auth/register showed the nav
 * when authenticated — an inconsistency. Fix: hide the sidebar on any /auth/* route.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "../AppLayout";

vi.mock("features/auth", () => ({
  useAuth: () => ({
    user: { displayName: "Alex", email: "alex@example.com" },
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}));

vi.mock("features/lexical-hub/components", () => ({
  LexicalHubRouter: () => null,
}));

vi.mock("shared/store", () => ({
  useHubStore: () => ({
    isOpen: false,
    currentEntity: null,
    close: vi.fn(),
  }),
}));

function renderAppLayout(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="*" element={<div>page content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

const mainNav = () => screen.queryByRole("navigation", { name: "Main navigation" });

describe("AppLayout auth-page sidebar behavior", () => {
  it("hides the sidebar on the login page (standalone)", () => {
    renderAppLayout("/auth/login");
    expect(mainNav()).not.toBeInTheDocument();
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
