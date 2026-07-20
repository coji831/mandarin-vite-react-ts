/**
 * withLearnLayout — Storybook decorator for LearnLayout context
 *
 * Wraps story content with LearnLayout (pill tab navigation for
 * learning phases: Radicals, Characters, Words, etc.).
 *
 * LearnLayout renders <Outlet /> internally (not {children}), so this
 * decorator uses MemoryRouter + Routes + Route nesting to provide the
 * outlet content. This allows standalone usage for testing pill tabs,
 * or composition with withAppLayout for full-page stories.
 *
 * @example
 * // Standalone — just LearnLayout pill tabs
 * export const LearnPills: Story = {
 *   decorators: [withLearnLayout()],
 *   parameters: { layout: "fullscreen" },
 * };
 *
 * // Full learn page story (with sidebar + pills)
 * export const FullPage: Story = {
 *   decorators: [withAppLayout("/learn/radicals"), withLearnLayout()],
 *   parameters: { layout: "fullscreen" },
 * };
 */
import type { Decorator } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LearnLayout } from "../../src/shared/layouts/LearnLayout";

/**
 * Decorator factory — wraps story content in LearnLayout via route nesting.
 *
 * Uses MemoryRouter so LearnLayout's <Outlet /> renders the story content.
 *
 * @param outletContent - Content inside LearnLayout's Outlet (default: the Story itself)
 */
export function withLearnLayout(outletContent?: ReactNode): Decorator {
  return (Story) => (
    <MemoryRouter initialEntries={["/learn"]}>
      <Routes>
        <Route element={<LearnLayout />}>
          <Route index element={outletContent ?? <Story />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}
