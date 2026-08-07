/**
 * LoginPage stories.
 *
 * Story 22.4: LoginPage is a static form page (no fetch on mount) — the
 * Loading/Error/Empty API states are unreachable, so only guest + authed
 * states are covered:
 *   - Default: guest (withGuestAuth) — the login form inside the app layout.
 *   - AuthedRedirect: an authenticated user landing on /auth/login is
 *     redirected off the auth page (redirect target route provided).
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LoginPage } from "./LoginPage";
import { withGuestAuth } from "../../.storybook/decorators";

const meta: Meta<typeof LoginPage> = {
  title: "Pages/Login",
  component: LoginPage,
  parameters: { layout: "fullscreen", layoutType: "app", layoutPath: "/auth/login" },
};

export default meta;
type Story = StoryObj<typeof LoginPage>;

export const Default: Story = {
  name: "Guest — login form",
  decorators: [withGuestAuth],
};

export const AuthedRedirect: Story = {
  name: "Authed — redirected off /auth/*",
  // Rendered standalone (layoutType: "none" disables the global app-layout
  // router wrapper) so this story's own MemoryRouter + redirect target route
  // exist without nesting a second <Router>.
  parameters: { layoutType: "none" },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/auth/login"]}>
        <Routes>
          <Route path="/auth/login" element={<Story />} />
          <Route
            path="/"
            element={<div className="p-xl text-secondary font-md">Dashboard (redirect target)</div>}
          />
        </Routes>
      </MemoryRouter>
    ),
  ],
};
