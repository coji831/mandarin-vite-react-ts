/**
 * @file pages/learn/chengyu/ChengyuPageFull.stories.tsx
 * @description Page-level Storybook stories for the Chengyu idiom library.
 * Story 23.3: Chengyu UI
 *
 * Covers: populated, populated-paginated (BUG-1 pagination UI), loading,
 * empty, error. Uses the 23.2-owned `chengyuHandlers` (MSW) directly —
 * `msw: { handlers: [chengyuHandlers.default()] }` (pattern:
 * GrammarPageFull.stories.tsx / PhoneticClustersPage.stories.tsx) — plus the
 * shared phase-gate handler at currentPhase 4 so the sidebar Learn group shows
 * the (Phase-4) Chengyu item as active. The paginated story overrides the list
 * handler inline (55 idioms, pageSize 20 → 3 pages) so the pagination controls
 * are visible in Storybook.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { http, HttpResponse } from "msw";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { ChengyuPage } from "./ChengyuPage";
import { chengyuHandlers } from "../../../mocks/handlers/chengyu-handlers";
import { mswHandlers } from "../../../../.storybook/msw-handlers";
import { withAppLayout, withLearnLayout } from "../../../../.storybook/decorators";

const LIST_URL = `http://localhost:3001/api${ROUTE_PATTERNS.chengyuIdioms}`;

/** Summary factory for the paginated story (55 idioms, pageSize 20 → 3 pages). */
function makeSummary(n: number) {
  const era = ["Han", "Qin", "Warring States"][n % 3];
  const theme = ["determination", "perseverance", "caution", "strategy", "wisdom"][n % 5];
  return {
    id: `cy_${String(n).padStart(4, "0")}`,
    chengyu: `成语${n}`,
    pinyin: `chéng yǔ ${n}`,
    literalMeaning: `Literal meaning ${n}`,
    figurativeMeaning: `Figurative meaning for idiom number ${n}.`,
    era,
    theme,
    sortOrder: n,
    exampleCount: 1,
    previewExample: `这是第 ${n} 个成语的例句。`,
  };
}

const meta = {
  title: "Pages/Learn/ChengyuPage",
  component: ChengyuPage,
  decorators: [withAppLayout("/learn/chengyu"), withLearnLayout()],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ChengyuPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {
  parameters: {
    msw: { handlers: [chengyuHandlers.default(), mswHandlers.progression.phaseGate(4)] },
  },
};

export const PopulatedPaginated: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(LIST_URL, ({ request }) => {
          const url = new URL(request.url);
          const page = Number(url.searchParams.get("page") ?? 1);
          const pageSize = Number(url.searchParams.get("pageSize") ?? 20);
          const start = (page - 1) * pageSize;
          const all = Array.from({ length: 55 }, (_, i) => makeSummary(i + 1));
          return HttpResponse.json(
            { items: all.slice(start, start + pageSize), total: all.length, page, pageSize },
            { status: 200 },
          );
        }),
        mswHandlers.progression.phaseGate(4),
      ],
    },
  },
};

export const Loading: Story = {
  parameters: {
    msw: { handlers: [chengyuHandlers.loading(), mswHandlers.progression.phaseGate(4)] },
  },
};

export const Empty: Story = {
  parameters: {
    msw: { handlers: [chengyuHandlers.empty(), mswHandlers.progression.phaseGate(4)] },
  },
};

export const Error: Story = {
  parameters: {
    msw: { handlers: [chengyuHandlers.error(), mswHandlers.progression.phaseGate(4)] },
  },
};
