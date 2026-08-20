/**
 * catalog.ts — additive Storybook preview for the "Pages" catalog.
 *
 * Registers a `parameters.options.storySort` that groups page stories into a
 * "Pages" catalog ordered by page archetype (pages-<archetype> tag). This file
 * is merged by Storybook alongside the existing preview.tsx (parameters are
 * deep-merged, so decorators/loaders in preview.tsx are untouched).
 *
 * Ordering rule:
 *   - Non-page stories (shared components, features) sort before the Pages
 *     catalog, preserving their existing title-based order.
 *   - Page stories sort into the catalog by archetype (hub-launcher →
 *     browse-index → focus-* → utility → auth), then by title.
 */
import type { Preview } from "@storybook/react-vite";

const ARCHETYPE_ORDER = [
  "hub-launcher",
  "browse-index",
  "focus-task",
  "focus-chat",
  "focus-timed",
  "focus-media",
  "utility",
  "auth",
];

/**
 * Structural shape of a Storybook index entry consumed by the comparator.
 * Storybook does not contextually type `storySort` params in this version, so
 * the entry is declared explicitly (only `title`/`tags` are read here).
 */
type StoryEntry = { title: string; tags?: string[] };

/** Extract the archetype id from a story's pages-<archetype> tag. */
function archetypeOf(tags?: string[]): string | null {
  const tag = tags?.find((t) => t.startsWith("pages-"));
  return tag ? tag.slice("pages-".length) : null;
}

const preview: Preview = {
  parameters: {
    options: {
      storySort: (a: StoryEntry, b: StoryEntry) => {
        const aArch = archetypeOf(a.tags);
        const bArch = archetypeOf(b.tags);

        // Non-page stories stay before the Pages catalog.
        if (aArch && !bArch) return 1;
        if (!aArch && bArch) return -1;
        if (!aArch && !bArch) return a.title.localeCompare(b.title);

        // Both are pages — group by archetype, then title.
        // aArch/bArch are truthy here (nulls handled above); guard satisfies TS.
        const aIdx = aArch ? ARCHETYPE_ORDER.indexOf(aArch) : -1;
        const bIdx = bArch ? ARCHETYPE_ORDER.indexOf(bArch) : -1;
        if (aIdx !== bIdx) return aIdx - bIdx;
        return a.title.localeCompare(b.title);
      },
    },
  },
};

export default preview;
