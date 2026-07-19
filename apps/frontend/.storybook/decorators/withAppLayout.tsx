/**
 * withAppLayout — Storybook decorator for full AppLayout context
 *
 * Renders the story inside the production AppLayout (left sidebar
 * navigation). Uses MemoryRouter at "/learn/radicals" as default
 * path so nav active states render correctly.
 *
 * @example
 * // Page story with full app layout
 * export const FullPage: Story = {
 *   decorators: [withAppLayout()],
 *   parameters: { layout: "fullscreen" },
 * };
 *
 * // Page story with custom path
 * export const Dashboard: Story = {
 *   decorators: [withAppLayout("/")],
 *   parameters: { layout: "fullscreen" },
 * };
 */
import type { Decorator } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "../../src/shared/layouts/AppLayout";

/**
 * Decorator factory — wraps story in AppLayout inside MemoryRouter.
 *
 * @param initialPath - URL path for the story (default: "/learn/radicals")
 * @param outletContent - Content for the Outlet (default: the Story itself)
 */
export function withAppLayout(initialPath?: string, outletContent?: ReactNode): Decorator {
  const path = initialPath ?? "/learn/radicals";

  return (Story) => (
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AppLayout />} path={path}>
          <Route index element={outletContent ?? <Story />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}
