/**
 * withAuth — Storybook decorator factory for mock auth state
 *
 * Wraps stories with the real AuthContext.Provider so that layout
 * stories can control authentication state (logged in / logged out)
 * without hitting real API endpoints.
 *
 * Because the decorator's provider is nested inside the global
 * AuthProvider (from preview.tsx), React context resolution reads
 * from the nearest provider — i.e. the decorator's values win.
 *
 * @example
 * // Logged-out story
 * export const LoggedOut: Story = {
 *   decorators: [withAuth({ isAuthenticated: false, user: null })],
 * };
 *
 * // Logged-in as specific user
 * export const CustomUser: Story = {
 *   decorators: [withAuth({ user: { id: "42", email: "test@test.com", displayName: "Test" } })],
 * };
 */
import type { Decorator } from "@storybook/react-vite";
import type { AuthContextValue, User } from "features/auth";
import { AuthContext } from "features/auth";

const defaultUser: User = {
  id: "storybook-user",
  email: "user@example.com",
  displayName: "Storybook User",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const defaultAuthValue: AuthContextValue = {
  user: defaultUser,
  isLoading: false,
  isAuthenticated: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshTokens: async () => "mock-token",
};

/**
 * Decorator factory — returns a Decorator that overrides auth state.
 *
 * Pass partial overrides to customize the mock context value.
 * Omitted fields default to a logged-in state with a dummy user.
 */
export function withAuth(overrides?: Partial<AuthContextValue>): Decorator {
  const value: AuthContextValue = { ...defaultAuthValue, ...overrides };

  return (Story) => (
    <AuthContext.Provider value={value}>
      <Story />
    </AuthContext.Provider>
  );
}
