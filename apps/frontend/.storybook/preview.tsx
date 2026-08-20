import type { Preview } from "@storybook/react-vite";
import { initialize, mswLoader } from "msw-storybook-addon";
import MockDate from "mockdate";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "../src/shared/layouts/AppLayout";
import { LearnLayout } from "../src/shared/layouts/LearnLayout";
import { AuthContext } from "../src/features/auth";
import type { AuthContextValue } from "../src/features/auth";
import { mswHandlers } from "./msw-handlers";
import "../src/index.css";

initialize({ onUnhandledRequest: "bypass" });

/**
 * MockAuthProvider — provides a hardcoded logged-in user for Storybook.
 * No API calls, no token management. Replaces the real AuthProvider since
 * auth is disabled for guest users.
 */
function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const mockUser = {
    id: "storybook-user",
    email: "user@example.com",
    displayName: "Storybook User",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  const value: AuthContextValue = {
    user: mockUser,
    isLoading: false,
    isAuthenticated: true,
    login: async () => {},
    register: async () => {},
    logout: async () => {},
    refreshTokens: async () => "mock-token",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const preview: Preview = {
  decorators: [
    (Story, { parameters }) => {
      const layoutType = parameters.layoutType as string | undefined;
      const layoutPath = (parameters.layoutPath as string) || "/";

      let content = <Story />;

      // Split layoutPath into pathname and search so query params work
      // e.g. "/learn/radicals?radical=rad_0001" → pathname="/learn/radicals", search="?radical=rad_0001"
      const [layoutPathname, layoutSearch] = layoutPath.split("?");
      const layoutSearchParam = layoutSearch ? `?${layoutSearch}` : "";

      if (layoutType === "learn") {
        // AppLayout + LearnLayout in a single MemoryRouter
        content = (
          <MemoryRouter initialEntries={[`${layoutPathname}${layoutSearchParam}`]}>
            <Routes>
              <Route element={<AppLayout />}>
                <Route element={<LearnLayout />}>
                  <Route path={layoutPathname} element={<Story />} />
                </Route>
              </Route>
            </Routes>
          </MemoryRouter>
        );
      } else if (layoutType === "app") {
        // AppLayout only
        content = (
          <MemoryRouter initialEntries={[`${layoutPathname}${layoutSearchParam}`]}>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path={layoutPathname} element={<Story />} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      }

      return <MockAuthProvider>{content}</MockAuthProvider>;
    },
  ],
  loaders: [mswLoader],
  parameters: {
    // Chromatic visual regression (Wave 4 — Q1/Q7): pixel-diff sensitivity,
    // 0 = most accurate, 1 = least. ~0.1 keeps the hairline
    // `--surface-border-subtle` (0.08 white) from generating noise. Tune only
    // if real drift produces false positives. Per-story override is available
    // via `parameters.chromatic.diffThreshold` in any story.
    chromatic: {
      diffThreshold: 0.1,
    },
    // Default phase-gate handler: AppLayout now consumes `usePhaseGate()` to
    // lock the sidebar Learn group, so every layout story resolves the phase
    // gate as "all unlocked" (phase 4) unless a story overrides it.
    msw: {
      handlers: [mswHandlers.progression.phaseGate(4)],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    viewport: {
      viewports: {
        mobileSmall: {
          name: "Mobile S (320px)",
          styles: { width: "320px", height: "568px" },
          type: "mobile",
        },
        mobileLarge: {
          name: "Mobile L (414px)",
          styles: { width: "414px", height: "896px" },
          type: "mobile",
        },
        tablet: {
          name: "Tablet (768px)",
          styles: { width: "768px", height: "1024px" },
          type: "tablet",
        },
        desktop: {
          name: "Desktop (1024px)",
          styles: { width: "1024px", height: "768px" },
          type: "desktop",
        },
      },
    },
    a11y: {
      // A11y gate (Wave-2, Q3 decision): the vitest `storybook` project fails on
      // WCAG 2.2 A/AA violations. The gate is now fully hard — no story uses
      // `parameters.a11y.test: "todo"` (all previously-marked violations were
      // fixed in the 2026-08-20 a11y sweep). The Colors token-reference story
      // disables ONLY color-contrast via a targeted per-story config (all other
      // wcag22a/aa rules still run).
      test: "error",
      config: {
        // axe runOnly — WCAG 2.2 A + AA rule tags (color-contrast is a wcag22aa
        // rule; kept explicitly enabled below).
        runOnly: { type: "tag", values: ["wcag22a", "wcag22aa"] },
        rules: [{ id: "color-contrast", enabled: true }],
      },
    },
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#1C1917" },
        { name: "medium", value: "#262321" },
        { name: "raised", value: "#2D2A27" },
      ],
    },
  },
  async beforeEach() {
    MockDate.set("2026-07-01T12:00:00Z");
  },
};

export default preview;
