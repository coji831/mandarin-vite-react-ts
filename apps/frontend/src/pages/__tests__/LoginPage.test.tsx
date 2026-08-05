/**
 * @file pages/__tests__/LoginPage.test.tsx
 * @description Tests for LoginPage return-to-origin behavior (review N2):
 * after a successful login the user returns to `location.state.from`, with a
 * dashboard fallback when `from` is absent or points back at /auth/*; authed
 * users are redirected away from /auth/login.
 *
 * `features/auth` is mocked with a stub LoginForm that surfaces `onSuccess` so
 * the page's routing logic is tested in isolation (no form internals).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LoginPage } from "../LoginPage";

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));

vi.mock("features/auth", () => ({
  LoginForm: ({ onSuccess }: { onSuccess?: () => void }) => (
    <button type="button" onClick={() => onSuccess?.()}>
      login-success
    </button>
  ),
  useAuth: mockUseAuth,
}));

function renderLoginPage(entry: string | { pathname: string; state?: { from?: string } }) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<div>Register Page</div>} />
        <Route path="/" element={<div>Dashboard Page</div>} />
        <Route path="/learn/grammar" element={<div>Grammar Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("LoginPage return-to-origin", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
  });

  it("navigates to `location.state.from` after a successful login", async () => {
    const user = userEvent.setup();
    renderLoginPage({ pathname: "/auth/login", state: { from: "/learn/grammar" } });
    await user.click(screen.getByRole("button", { name: "login-success" }));
    expect(await screen.findByText("Grammar Page")).toBeInTheDocument();
  });

  it("falls back to the dashboard when `from` is absent", async () => {
    const user = userEvent.setup();
    renderLoginPage("/auth/login");
    await user.click(screen.getByRole("button", { name: "login-success" }));
    expect(await screen.findByText("Dashboard Page")).toBeInTheDocument();
  });

  it("falls back to the dashboard when `from` points back at /auth/*", async () => {
    const user = userEvent.setup();
    renderLoginPage({ pathname: "/auth/login", state: { from: "/auth/register" } });
    await user.click(screen.getByRole("button", { name: "login-success" }));
    expect(await screen.findByText("Dashboard Page")).toBeInTheDocument();
  });

  it("redirects already-authenticated users away from /auth/login", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    renderLoginPage("/auth/login");
    expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
  });
});
