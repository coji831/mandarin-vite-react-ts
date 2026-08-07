/**
 * @file pages/__tests__/LoginPage.test.tsx
 * @description Tests for LoginPage return-to-origin behavior (Story 22.4
 * follow-up, Issue 1): after a successful login the user returns to
 * `location.state.from`, with a dashboard fallback when `from` is absent,
 * non-relative, or points back at /auth/*; the Login ⇄ Register switch
 * forwards `from`; authed users are redirected away from /auth/login.
 *
 * `features/auth` is mocked with a MUTABLE store. The stub LoginForm flips
 * `isAuthenticated` false→true (replacing the snapshot so
 * useSyncExternalStore re-renders consumers) before firing `onSuccess` — the
 * same ordering as the real AuthContext (`setUser` before the form's success
 * callback). This models the race the previous static-false mock hid: a
 * render-level `<Navigate>` would fire against `from`, and the effect must be
 * the single navigation source.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSyncExternalStore } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { LoginPage } from "../LoginPage";

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
  LoginForm: ({
    onSuccess,
    onSwitchToRegister,
  }: {
    onSuccess?: () => void;
    onSwitchToRegister?: () => void;
  }) => (
    <div>
      <button
        type="button"
        onClick={() => {
          authStore.setAuthenticated(true);
          onSuccess?.();
        }}
      >
        login-success
      </button>
      <button type="button" onClick={onSwitchToRegister}>
        switch-to-register
      </button>
    </div>
  ),
  useAuth: () => ({
    isAuthenticated: useSyncExternalStore(authStore.subscribe, authStore.getSnapshot)
      .isAuthenticated,
  }),
}));

/** Reads location.state on the register route so switch-forward is assertable. */
function RegisterStateProbe() {
  const location = useLocation();
  return <div>Register Page {location.state?.from ?? ""}</div>;
}

function renderLoginPage(entry: string | { pathname: string; state?: { from?: string } }) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterStateProbe />} />
        <Route path="/" element={<div>Dashboard Page</div>} />
        <Route path="/learn/grammar" element={<div>Grammar Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("LoginPage return-to-origin", () => {
  beforeEach(() => {
    authStore.reset();
  });

  it("navigates to `location.state.from` on the false→true auth transition", async () => {
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

  it("falls back to the dashboard when `from` is non-relative (//host or http://…)", async () => {
    const user = userEvent.setup();
    renderLoginPage({ pathname: "/auth/login", state: { from: "//evil.example" } });
    await user.click(screen.getByRole("button", { name: "login-success" }));
    expect(await screen.findByText("Dashboard Page")).toBeInTheDocument();
  });

  it("forwards `location.state` (from) when switching to Register", async () => {
    const user = userEvent.setup();
    renderLoginPage({ pathname: "/auth/login", state: { from: "/learn/grammar" } });
    await user.click(screen.getByRole("button", { name: "switch-to-register" }));
    expect(await screen.findByText("Register Page /learn/grammar")).toBeInTheDocument();
  });

  it("redirects already-authenticated users away from /auth/login on mount", async () => {
    authStore.setAuthenticated(true);
    renderLoginPage("/auth/login");
    expect(await screen.findByText("Dashboard Page")).toBeInTheDocument();
  });
});
