/**
 * withRouter — Storybook decorator factory for route-controlled stories
 *
 * Wraps stories with MemoryRouter + Routes + Route so that layout
 * components can control the active URL path. Essential for testing
 * navigation active states (e.g. which nav link is highlighted).
 *
 * @example
 * // Simple component (no Outlet)
 * export const Dashboard: Story = {
 *   decorators: [withRouter(["/"])],
 * };
 *
 * // Layout component with Outlet content
 * export const WithChildren: Story = {
 *   decorators: [withRouter(["/"], { outlet: <div>Page content</div> })],
 * };
 *
 * // Learn page active
 * export const LearnActive: Story = {
 *   decorators: [withRouter(["/learn"], { outlet: <div>Learn content</div> })],
 * };
 */
import type { Decorator } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

export interface WithRouterOptions {
  /** Content rendered inside the layout's <Outlet /> (index route) */
  outlet?: ReactNode;
}

/**
 * Decorator factory — returns a Decorator that renders the story
 * inside a MemoryRouter at the given path.
 *
 * @param initialEntries - Array of URL paths. The first entry becomes the
 *   active route and the path for the story's <Route> element.
 * @param options - Optional configuration for outlet content.
 */
export function withRouter(initialEntries: string[], options?: WithRouterOptions): Decorator {
  return (Story) => (
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        {options?.outlet !== undefined ? (
          // Layout route pattern — story is the layout, outlet is the child
          <Route element={<Story />} path={initialEntries[0]}>
            <Route index element={options.outlet} />
          </Route>
        ) : (
          <Route element={<Story />} path={initialEntries[0]} />
        )}
      </Routes>
    </MemoryRouter>
  );
}
