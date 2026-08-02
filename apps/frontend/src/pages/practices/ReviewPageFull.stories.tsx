/**
 * ReviewPageFull.stories.tsx
 * Storybook stories for the REAL ReviewPage — picker and URL-driven session.
 *
 * Data states (Default / Loading / Error / Empty) are driven by MSW handlers
 * for /review/items. The auto-advance timing behavior previously implemented
 * inline here (the ReviewAutoAdvance wrapper — duplicated business logic +
 * layout, violating the storybook-production-alignment instruction) was removed
 * and moved to an integration test:
 *   apps/frontend/src/features/review/components/__tests__/ReviewAutoAdvance.test.tsx
 * Transient result/complete steps are covered there rather than as static
 * stories (no business logic in stories).
 */
import type { Meta, StoryObj, Decorator } from "@storybook/react-vite";
import { http, HttpResponse } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "../../shared/layouts/AppLayout";
import { ReviewPage } from "./ReviewPage";
import type { ReviewItem } from "../../features/review";
import { withGuestAuth } from "../../../.storybook/decorators";

const API_BASE = "http://localhost:3001/api/v1";

// ── Mock data ──────────────────────────────────────────────────────

const MOCK_PINYIN_ITEMS: ReviewItem[] = [
  {
    id: "r1",
    itemType: "pinyin-syllable",
    itemId: "ch_1001",
    front: "nǐ hǎo",
    back: "hello",
    character: "你好",
    pinyinPlain: "ni",
    correctTone: 3,
    meaning: "hello",
  },
  {
    id: "r2",
    itemType: "pinyin-syllable",
    itemId: "ch_1002",
    front: "xiè xie",
    back: "thank you",
    character: "谢谢",
    pinyinPlain: "xie",
    correctTone: 4,
    meaning: "thank you",
  },
  {
    id: "r3",
    itemType: "pinyin-syllable",
    itemId: "ch_27809",
    front: "xué xí",
    back: "study",
    character: "学习",
    pinyinPlain: "xue",
    correctTone: 2,
    meaning: "study",
  },
];

const MOCK_TONE_ITEMS: ReviewItem[] = [
  {
    id: "r4",
    itemType: "tone-syllable",
    itemId: "ch_1001",
    front: "nǐ hǎo",
    back: "hello",
    character: "你好",
    pinyinPlain: "ni",
    correctTone: 3,
    meaning: "hello",
  },
];

const MOCK_RADICAL_ITEMS: ReviewItem[] = [
  {
    id: "r5",
    itemType: "radical",
    itemId: "rad_0001",
    front: "⼀",
    back: "one",
    character: "⼀",
    pinyinPlain: "one",
    meaning: "one",
    options: [
      { glyph: "⼀", meaning: "one", id: "rad_0001" },
      { glyph: "⼆", meaning: "two", id: "rad_0002" },
      { glyph: "⼈", meaning: "man", id: "rad_0009" },
      { glyph: "⼊", meaning: "enter", id: "rad_0011" },
    ],
  },
];

// ── Meta ───────────────────────────────────────────────────────────

const meta: Meta<typeof ReviewPage> = {
  title: "Pages/Practices/Review",
  component: ReviewPage,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof ReviewPage>;

// ── Decorators ─────────────────────────────────────────────────────

/**
 * withAppLayoutAt — wraps the story in AppLayout at the given path.
 * Needed because the global decorator's Route path doesn't handle query strings.
 */
const withAppLayoutAt = (initialPath: string): Decorator => {
  const pathname = initialPath.split("?")[0];
  return (Story) => (
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path={pathname} element={<Story />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
};

// ── Stories ────────────────────────────────────────────────────────

/**
 * PickerMode — no search params, shows ReviewPicker component.
 */
export const PickerMode: Story = {
  parameters: {
    layoutType: "app",
    layoutPath: "/practices/review",
  },
};

/**
 * SessionPinyin — ?type=pinyin&filter=all routes to the ReviewView session and
 * auto-starts (both params present), landing on the pinyin text-input step.
 */
export const SessionPinyin: Story = {
  name: "Session — Pinyin Input",
  decorators: [withAppLayoutAt("/practices/review?type=pinyin&filter=all")],
  parameters: {
    msw: {
      handlers: [
        http.get(`${API_BASE}/review/items`, () =>
          HttpResponse.json(MOCK_PINYIN_ITEMS, { status: 200 }),
        ),
      ],
    },
  },
};

/**
 * SessionTones — tone-syllable items land on the tone-select step.
 */
export const SessionTones: Story = {
  name: "Session — Tone Select",
  decorators: [withAppLayoutAt("/practices/review?type=tones&filter=all")],
  parameters: {
    msw: {
      handlers: [
        http.get(`${API_BASE}/review/items`, () =>
          HttpResponse.json(MOCK_TONE_ITEMS, { status: 200 }),
        ),
      ],
    },
  },
};

/**
 * SessionRadicals — radical items land on the multiple-choice option step.
 */
export const SessionRadicals: Story = {
  name: "Session — Option Select",
  decorators: [withAppLayoutAt("/practices/review?type=radicals&filter=all")],
  parameters: {
    msw: {
      handlers: [
        http.get(`${API_BASE}/review/items`, () =>
          HttpResponse.json(MOCK_RADICAL_ITEMS, { status: 200 }),
        ),
      ],
    },
  },
};

/**
 * SessionLoading — the items request never resolves (MSW), so the session
 * stays in its loading state.
 */
export const SessionLoading: Story = {
  decorators: [withAppLayoutAt("/practices/review?type=pinyin&filter=all")],
  parameters: {
    msw: {
      handlers: [http.get(`${API_BASE}/review/items`, () => new Promise(() => {}))],
    },
  },
};

/**
 * SessionError — the items request fails (500 via MSW), rendering ErrorScreen.
 */
export const SessionError: Story = {
  decorators: [withAppLayoutAt("/practices/review?type=pinyin&filter=all")],
  parameters: {
    msw: {
      handlers: [
        http.get(`${API_BASE}/review/items`, () =>
          HttpResponse.json({ error: "Failed to load review items" }, { status: 500 }),
        ),
      ],
    },
  },
};

/**
 * SessionEmpty — the items request returns [], rendering the
 * "No items available" empty state.
 */
export const SessionEmpty: Story = {
  decorators: [withAppLayoutAt("/practices/review?type=pinyin&filter=all")],
  parameters: {
    msw: {
      handlers: [
        http.get(`${API_BASE}/review/items`, () => HttpResponse.json([], { status: 200 })),
      ],
    },
  },
};

/**
 * Guest — unauthenticated user on /practices/review. The ProtectedRoute
 * wrapper redirects to /auth/login. Uses withGuestAuth to simulate a guest.
 */
export const Guest: Story = {
  decorators: [withGuestAuth],
  parameters: {
    layoutType: "app",
    layoutPath: "/practices/review",
  },
};
