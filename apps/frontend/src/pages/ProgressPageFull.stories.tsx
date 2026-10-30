/**
 * ProgressPage stories.
 *
 * The page now renders REAL numbers (rework-proposal §6), so the states are the
 * API states: populated (foundation progress + radical progress), loading (both
 * pending), and empty (a visitor with nothing recorded yet — the single empty
 * state + one CTA branch). MSW handlers are story-local because the two
 * progression endpoints are the only data this surface reads.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { http, HttpResponse } from "msw";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { ProgressPage } from "./ProgressPage";

const API = "http://localhost:3001/api";
const FOUNDATION_URL = `${API}${ROUTE_PATTERNS.progressionFoundationProgress}`;
const RADICAL_URL = `${API}${ROUTE_PATTERNS.progressionRadicalProgress}`;

const FOUNDATION_DONE = [
  { sectionId: "pinyin", completed: true, completedAt: "2026-10-01T00:00:00.000Z" },
  { sectionId: "tones", completed: true, completedAt: "2026-10-05T00:00:00.000Z" },
  { sectionId: "strokes", completed: false, completedAt: null },
  { sectionId: "animations", completed: false, completedAt: null },
];

const RADICAL_MEMORIZED = [
  {
    id: "rp_1",
    userId: "storybook-user",
    radicalId: "rad_0001",
    memorized: true,
    recognitionLevel: 3,
    reviewedAt: "2026-10-20T00:00:00.000Z",
    createdAt: "2026-10-20T00:00:00.000Z",
    updatedAt: "2026-10-20T00:00:00.000Z",
  },
  {
    id: "rp_2",
    userId: "storybook-user",
    radicalId: "rad_0002",
    memorized: true,
    recognitionLevel: 2,
    reviewedAt: "2026-10-21T00:00:00.000Z",
    createdAt: "2026-10-21T00:00:00.000Z",
    updatedAt: "2026-10-21T00:00:00.000Z",
  },
  {
    id: "rp_3",
    userId: "storybook-user",
    radicalId: "rad_0003",
    memorized: false,
    recognitionLevel: 1,
    reviewedAt: null,
    createdAt: "2026-10-22T00:00:00.000Z",
    updatedAt: "2026-10-22T00:00:00.000Z",
  },
];

const meta: Meta<typeof ProgressPage> = {
  title: "Pages/Progress",
  component: ProgressPage,
  tags: ["pages-settings"],
  parameters: {
    layout: "fullscreen",
    layoutType: "app",
    layoutPath: "/progress",
  },
};

export default meta;
type Story = StoryObj<typeof ProgressPage>;

/** Real numbers: 2 of 4 foundation sections, 2 radicals memorized. */
export const Default: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(FOUNDATION_URL, () => HttpResponse.json(FOUNDATION_DONE, { status: 200 })),
        http.get(RADICAL_URL, () => HttpResponse.json(RADICAL_MEMORIZED, { status: 200 })),
      ],
    },
  },
};

/** Both requests still in flight → the skeleton (no layout jump). */
export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(FOUNDATION_URL, () => new Promise(() => {})),
        http.get(RADICAL_URL, () => new Promise(() => {})),
      ],
    },
  },
};

/** Nothing recorded yet → ONE honest empty state with ONE CTA. */
export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(FOUNDATION_URL, () => HttpResponse.json([], { status: 200 })),
        http.get(RADICAL_URL, () => HttpResponse.json([], { status: 200 })),
      ],
    },
  },
};
