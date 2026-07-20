/**
 * withGuestAuth — Storybook decorator for guest (unauthenticated) state
 *
 * Wraps stories with the real AuthContext.Provider set to a logged-out state
 * so that components render as they would for an unauthenticated guest user.
 *
 * Because this decorator's provider is nested inside the global
 * AuthProvider (from preview.tsx), React context resolution reads
 * from the nearest provider — i.e. this decorator's values win.
 */
import type { Decorator } from "@storybook/react-vite";
import { AuthContext } from "features/auth";
import type { AuthContextValue } from "features/auth";

const guestAuthValue: AuthContextValue = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshTokens: async () => "",
};

export const withGuestAuth: Decorator = (Story) => (
  <AuthContext.Provider value={guestAuthValue}>
    <Story />
  </AuthContext.Provider>
);
