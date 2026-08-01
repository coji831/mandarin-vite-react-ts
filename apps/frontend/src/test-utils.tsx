/**
 * @file test-utils.tsx
 * @description Shared test renderer — Testing Trophy INTEGRATION tier.
 *
 * `renderWithProviders` wraps a component in the providers real pages need so
 * `useAuth`, routing, and zustand stores work under test. Mirrors the Storybook
 * decorators (`.storybook/decorators/withAuth.tsx`, `preview.tsx`) so test
 * setup and Storybook stay in parity.
 *
 * - Auth: a mock `AuthContext.Provider` (default: logged-in guest user) — no
 *   network calls, deterministic state. Override per-test via `auth`.
 * - Router: `MemoryRouter` with `initialEntries` from `route` (default `/`).
 * - Stores: zustand stores need no provider; feature stores are exercised
 *   directly or mocked per test.
 *
 * Usage:
 *   renderWithProviders(<ReadersPage mode="library" />);
 *   renderWithProviders(<SomePage />, { route: "/learn/radicals?radical=x", auth: { isAuthenticated: false } });
 */
import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "features/auth";
import type { AuthContextValue, User } from "features/auth";

const mockUser: User = {
  id: "test-user",
  email: "user@example.com",
  displayName: "Test User",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const defaultAuthValue: AuthContextValue = {
  user: mockUser,
  isLoading: false,
  isAuthenticated: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshTokens: async () => "mock-token",
};

export type RenderWithProvidersOptions = {
  /** Initial route for MemoryRouter. Defaults to "/". */
  route?: string;
  /** Partial AuthContext overrides (e.g. isAuthenticated: false). */
  auth?: Partial<AuthContextValue>;
} & Omit<RenderOptions, "wrapper">;

export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {},
): RenderResult {
  const { route = "/", auth, ...renderOptions } = options;
  const authValue: AuthContextValue = { ...defaultAuthValue, ...auth };

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </AuthContext.Provider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
// NOTE: Do not `export *` from @testing-library/react here — react-refresh
// flags it as potentially exporting non-components. Test files import the
// helpers they need (render, screen, waitFor, ...) directly from
// `@testing-library/react` and only import `renderWithProviders` from here.
