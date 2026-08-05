/**
 * @file pages/__tests__/RegisterPage.test.tsx
 * @description Tests for RegisterPage return-to-origin behavior (Story 22.4
 * follow-up, Issue 1): after a successful registration the user returns to
 * `location.state.from`, with a dashboard fallback when `from` is absent,
 * non-relative, or points back at /auth/*; the Register ⇄ Login switch
 * forwards `from`; authed users are redirected away from /auth/register.
 *
 * `features/auth` is mocked with a MUTABLE store. The stub RegisterForm flips
 * `isAuthenticated` false→true (replacing the snapshot so useSyncExternalStore
 * re-renders consumers) before firing `onSuccess` — the same ordering as the
 * real AuthContext (`setUser` before the form's success callback). This models
 * the race the previous static-false mock hid: a render-level `<Navigate>`
 * would fire against `from`, and the effect must be the single navigation
 * source.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSyncExternalStore } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { RegisterPage } from "../RegisterPage";

type AuthState = { isAuthenticated: boolean };

let authState: AuthState = { isAuthenticated: false };
const listeners = new Set<() => void>();

const authStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: () => authState,
  setAuthenticated(value: boolean) {
    authState = { isAuthenticated: value }; // new identity → consumers re-render
    listeners.forEach((l) => l());
  },
  reset() {
    authState = { isAuthenticated: false };
    listeners.clear();
  },
};

vi.mock("features/auth", () => ({
  RegisterForm: ({
    onSuccess,
    onSwitchToLogin,
  }: {
    onSuccess?: () => void;
    onSwitchToLogin?: () => void;
  }) => (
    <div>
      <button
        type="button"
        onClick={() => {
          authStore.setAuthenticated(true);
          onSuccess?.();
        }}
      >
        register-success
      </button>
      <button type="button" onClick={onSwitchToLogin}>
        switch-to-login
      </button>
    </div>
  ),
  useAuth: () => ({
    isAuthenticated: useSyncExternalStore(authStore.subscribe, authStore.getSnapshot)
      .isAuthenticated,
  }),
}));

/** Reads location.state on the login route so switch-forward is assertable. */
function LoginStateProbe() {
  const location = useLocation();
  return <div>Login Page {location.state?.from ?? ""}</div>;
}

function renderRegisterPage(entry: string | { pathname: string; state?: { from?: string } }) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/auth/login" element={<LoginStateProbe />} />
        <Route path="/" element={<div>Dashboard Page</div>} />
        <Route path="/learn/grammar" element={<div>Grammar Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RegisterPage return-to-origin", () => {
  beforeEach(() => {
    authStore.reset();
  });

  it("navigates to `location.state.from` on the false→true auth transition", async () => {
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

  it("falls back to the dashboard when `from` is non-relative (//host or http://…)", async () => {
    const user = userEvent.setup();
    renderRegisterPage({ pathname: "/auth/register", state: { from: "//evil.example" } });
    await user.click(screen.getByRole("button", { name: "register-success" }));
    expect(await screen.findByText("Dashboard Page")).toBeInTheDocument();
  });

  it("forwards `location.state` (from) when switching to Login", async () => {
    const user = userEvent.setup();
    renderRegisterPage({ pathname: "/auth/register", state: { from: "/learn/grammar" } });
    await user.click(screen.getByRole("button", { name: "switch-to-login" }));
    expect(await screen.findByText("Login Page /learn/grammar")).toBeInTheDocument();
  });

  it("redirects already-authenticated users away from /auth/register on mount", async () => {
    authStore.setAuthenticated(true);
    renderRegisterPage("/auth/register");
    expect(await screen.findByText("Dashboard Page")).toBeInTheDocument();
  });
});
