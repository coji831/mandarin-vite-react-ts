/**
 * @file pages/__tests__/RegisterPage.test.tsx
 * @description Tests for RegisterPage return-to-origin behavior (review N2):
 * after a successful registration the user returns to `location.state.from`,
 * with a dashboard fallback when `from` is absent or points back at /auth/*;
 * authed users are redirected away from /auth/register.
 *
 * `features/auth` is mocked with a stub RegisterForm that surfaces `onSuccess`
 * so the page's routing logic is tested in isolation (no form internals).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { RegisterPage } from "../RegisterPage";

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));

vi.mock("features/auth", () => ({
  RegisterForm: ({ onSuccess }: { onSuccess?: () => void }) => (
    <button type="button" onClick={() => onSuccess?.()}>
      register-success
    </button>
  ),
  useAuth: mockUseAuth,
}));

function renderRegisterPage(entry: string | { pathname: string; state?: { from?: string } }) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/auth/login" element={<div>Login Page</div>} />
        <Route path="/" element={<div>Dashboard Page</div>} />
        <Route path="/learn/grammar" element={<div>Grammar Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RegisterPage return-to-origin", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
  });

  it("navigates to `location.state.from` after a successful registration", async () => {
    const user = userEvent.setup();
    renderRegisterPage({ pathname: "/auth/register", state: { from: "/learn/grammar" } });
    await user.click(screen.getByRole("button", { name: "register-success" }));
    expect(await screen.findByText("Grammar Page")).toBeInTheDocument();
  });

  it("falls back to the dashboard when `from` is absent", async () => {
    const user = userEvent.setup();
    renderRegisterPage("/auth/register");
    await user.click(screen.getByRole("button", { name: "register-success" }));
    expect(await screen.findByText("Dashboard Page")).toBeInTheDocument();
  });

  it("falls back to the dashboard when `from` points back at /auth/*", async () => {
    const user = userEvent.setup();
    renderRegisterPage({ pathname: "/auth/register", state: { from: "/auth/login" } });
    await user.click(screen.getByRole("button", { name: "register-success" }));
    expect(await screen.findByText("Dashboard Page")).toBeInTheDocument();
  });

  it("redirects already-authenticated users away from /auth/register", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    renderRegisterPage("/auth/register");
    expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
  });
});
