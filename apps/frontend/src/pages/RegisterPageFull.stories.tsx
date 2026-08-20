/**
 * RegisterPage stories.
 *
 * Story 22.4: RegisterPage is a static form page (no fetch on mount) — the
 * Loading/Error/Empty API states are unreachable, so only guest + authed
 * states are covered:
 *   - Default: guest (withGuestAuth) — the registration form inside the app layout.
 *   - AuthedRedirect: an authenticated user landing on /auth/register is
 *     redirected off the auth page (redirect target route provided).
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { RegisterPage } from "./RegisterPage";
import { withGuestAuth } from "../../.storybook/decorators";

const meta: Meta<typeof RegisterPage> = {
  title: "Pages/Register",
  component: RegisterPage,
  tags: ["pages-auth"],
  parameters: {
    layout: "fullscreen",
    layoutType: "app",
    layoutPath: "/auth/register",
  },
};

export default meta;
type Story = StoryObj<typeof RegisterPage>;

export const Default: Story = {
  name: "Guest — registration form",
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
      <MemoryRouter initialEntries={["/auth/register"]}>
        <Routes>
          <Route path="/auth/register" element={<Story />} />
          <Route
            path="/"
            element={<div className="p-xl text-secondary font-md">Dashboard (redirect target)</div>}
          />
        </Routes>
      </MemoryRouter>
    ),
  ],
};
