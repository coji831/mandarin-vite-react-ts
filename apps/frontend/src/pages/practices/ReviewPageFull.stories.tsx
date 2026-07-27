import { useCallback, useEffect, useRef } from "react";
import type { Meta, StoryObj, Decorator } from "@storybook/react-vite";
import { http, HttpResponse } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "../../shared/layouts/AppLayout";
import { ReviewPage } from "./ReviewPage";
import { useReview, ReviewCard, ReviewComplete } from "../../features/review";
import { ReviewPicker } from "../../features/review/components";
import { Button, ErrorScreen, LoadingScreen } from "shared/components";
import { useAudioPlayback } from "shared/hooks";
import type { ReviewItem } from "../../features/review";
import { withGuestAuth } from "../../../.storybook/decorators";

const API_BASE = "http://localhost:3001/api/v1";

// ── Mock data ──────────────────────────────────────────

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

// ── ReviewAutoAdvance wrapper ──────────────────────────
//
// NOTE: The rendering logic below intentionally mirrors ReviewView.tsx
// (apps/frontend/src/features/review/components/ReviewView.tsx).
//
// Unlike ReviewView which calls useReview() internally and accepts
// presetType/presetSource props, ReviewAutoAdvance calls useReview()
// directly so it can programmatically drive the review through each
// step via automation (auto-submitting answers, auto-advancing).
// This means it CANNOT reuse ReviewView component directly.
//
// ⚠️ If you update the rendering layout in ReviewView.tsx, keep this
//    component's layout in sync as well.
// ───────────────────────────────────────────────────────

type ReviewAutoAdvanceProps = {
  mockItems: ReviewItem[];
  targetStep: "input" | "result-correct" | "result-wrong" | "complete";
};

function ReviewAutoAdvance({ mockItems, targetStep }: ReviewAutoAdvanceProps) {
  const {
    step,
    currentItem,
    loading,
    error,
    startReview,
    submitPinyin,
    selectOption,
    selectTone,
    rateItem,
    progress,
    userPinyin,
    pinyinCorrect,
    toneCorrect,
    sessionResult,
    totalItems,
    contentType,
    source,
  } = useReview();

  const { playWordAudio } = useAudioPlayback();
  const autoRef = useRef(false);

  const handlePlayAudio = useCallback(
    (text: string) => {
      playWordAudio({ chinese: text, fallbackToBrowserTTS: true });
    },
    [playWordAudio],
  );

  // Auto-advance through review steps
  useEffect(() => {
    // Step 1: Start the review
    if (step === "pick") {
      autoRef.current = true;
      startReview("all", mockItems[0]?.itemType ?? "pinyin-syllable");
      return;
    }

    // Only proceed with auto-advance after review has started
    if (!autoRef.current) return;

    // Step 2: Auto-submit answer for result stories
    if (
      (step === "pinyin" || step === "tone" || step === "option") &&
      (targetStep === "result-correct" || targetStep === "result-wrong")
    ) {
      const isCorrect = targetStep === "result-correct";
      if (step === "pinyin") {
        submitPinyin(isCorrect ? (mockItems[0]?.pinyinPlain ?? "") : "wrong");
      } else if (step === "tone") {
        selectTone(isCorrect ? (mockItems[0]?.correctTone ?? 1) : 99);
      } else if (step === "option") {
        selectOption(isCorrect ? (mockItems[0]?.options?.[0]?.id ?? "") : "wrong-id");
      }
      return;
    }

    // Step 3: Auto-rate to advance to complete
    if (step === "result" && targetStep === "complete") {
      rateItem("good");
    }
  }, [step, targetStep, mockItems, startReview, submitPinyin, selectTone, selectOption, rateItem]);

  // ── Render (mirrors ReviewView.tsx) ──────────────

  if (loading) {
    return <LoadingScreen message="Loading review items..." />;
  }

  if (error) {
    return <ErrorScreen error={error} onRetry={() => startReview(source, contentType)} />;
  }

  if (step === "complete" && totalItems === 0 && !loading) {
    return (
      <div className="flex-col-center gap-lg p-2xl">
        <h2 className="text-secondary">No items available</h2>
        <p className="text-muted">Try a different content type or source.</p>
        <Button variant="primary" onClick={() => startReview(source, contentType)}>
          Try Again
        </Button>
      </div>
    );
  }

  switch (step) {
    case "pick":
      return <ReviewPicker onStart={startReview} />;

    case "pinyin":
    case "tone":
    case "option":
    case "result":
      return (
        <div className="review-view flex-col gap-lg mx-auto">
          {/* Header */}
          <header className="flex-between">
            <span className="text-secondary fw-600 font-sm">
              {"\uD83C\uDCCF"} Review
              {contentType
                ? ` · ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}s`
                : ""}{" "}
              · {progress.current} of {progress.total}
            </span>
          </header>

          {/* Flip card */}
          <ReviewCard
            item={currentItem!}
            step={step as "pinyin" | "tone" | "option" | "result"}
            userPinyin={userPinyin}
            pinyinCorrect={pinyinCorrect}
            toneCorrect={toneCorrect}
            onSubmitPinyin={submitPinyin}
            onSelectTone={selectTone}
            onSelectOption={selectOption}
            onRate={rateItem}
            onPlayAudio={handlePlayAudio}
          />

          {/* Progress bar */}
          <div className="flex-col gap-xs">
            <div className="progress-bar w-full">
              <div
                className="progress-fill"
                style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
              />
            </div>
            <span className="text-muted font-sm text-center">
              {progress.current} of {progress.total}
            </span>
          </div>
        </div>
      );

    case "complete":
      return (
        <ReviewComplete
          result={sessionResult}
          totalItems={totalItems}
          onReviewAgain={() => startReview(source, contentType)}
          onBack={() => {}}
        />
      );
  }
}

// ── Meta ───────────────────────────────────────────────

const meta: Meta<typeof ReviewPage> = {
  title: "Pages/Practices/Review",
  component: ReviewPage,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof ReviewPage>;

// ── Stories ────────────────────────────────────────────

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
 * SessionMode — ?type=character&filter=all routes to ReviewView session.
 *
 * Uses a custom decorator to set the correct URL with search params,
 * since the global decorator's Route path doesn't handle query strings.
 * Also provides MSW handlers for the review items endpoint.
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

const MOCK_REVIEW_ITEMS = [
  {
    id: "review_item_1",
    chinese: "你好",
    pinyin: "nǐ hǎo",
    meaning: "hello",
    itemType: "character",
    itemId: "ch_1001",
  },
  {
    id: "review_item_2",
    chinese: "谢谢",
    pinyin: "xiè xie",
    meaning: "thank you",
    itemType: "character",
    itemId: "ch_1002",
  },
  {
    id: "review_item_3",
    chinese: "学习",
    pinyin: "xué xí",
    meaning: "study",
    itemType: "character",
    itemId: "ch_27809",
  },
];

export const SessionMode: Story = {
  decorators: [withAppLayoutAt("/practices/review?type=character&filter=all")],
  parameters: {
    msw: {
      handlers: [
        http.get(`${API_BASE}/review/items`, () => {
          return HttpResponse.json(MOCK_REVIEW_ITEMS, { status: 200 });
        }),
      ],
    },
  },
};

/**
 * SessionLoading — shows the loading state while review items are being fetched.
 * Uses a never-resolving MSW handler to keep the request pending indefinitely.
 */
export const SessionLoading: Story = {
  decorators: [withAppLayoutAt("/practices/review?type=character&filter=all")],
  parameters: {
    msw: {
      handlers: [http.get(`${API_BASE}/review/items`, () => new Promise(() => {}))],
    },
  },
};

// ── New Stories: Question Formats & States ─────────────

/**
 * PinyinInput — pinyin-syllable items with pinyin text input step.
 */
export const PinyinInput: Story = {
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
  render: () => <ReviewAutoAdvance mockItems={MOCK_PINYIN_ITEMS} targetStep="input" />,
};

/**
 * ToneSelect — tone-syllable items with 5 tone button selection step.
 */
export const ToneSelect: Story = {
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
  render: () => <ReviewAutoAdvance mockItems={MOCK_TONE_ITEMS} targetStep="input" />,
};

/**
 * OptionSelect — radical items with multiple-choice option selection step.
 */
export const OptionSelect: Story = {
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
  render: () => <ReviewAutoAdvance mockItems={MOCK_RADICAL_ITEMS} targetStep="input" />,
};

/**
 * ResultFeedback — shows the result/rating step after a correct pinyin answer.
 */
export const ResultFeedback: Story = {
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
  render: () => <ReviewAutoAdvance mockItems={MOCK_PINYIN_ITEMS} targetStep="result-correct" />,
};

/**
 * SessionComplete — shows the ReviewComplete summary after finishing a session.
 */
export const SessionComplete: Story = {
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
  render: () => <ReviewAutoAdvance mockItems={MOCK_PINYIN_ITEMS} targetStep="complete" />,
};

/**
 * ResultWrong — shows the result/rating step after a wrong pinyin answer (wrong input "wro").
 */
export const ResultWrong: Story = {
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
  render: () => <ReviewAutoAdvance mockItems={MOCK_PINYIN_ITEMS} targetStep="result-wrong" />,
};

/**
 * SessionError — shows the error state when review items fail to load.
 * MSW handler returns 500 to trigger the error state in useReview.
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
 * SessionEmpty — shows the empty state when no review items are returned.
 * MSW returns an empty array, triggering the "No items available" UI.
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
 * Guest — shows the redirect state when an unauthenticated user navigates
 * to /practices/review. The ProtectedRoute wrapper redirects to /auth/login.
 * Uses withGuestAuth decorator to simulate an unauthenticated user.
 */
export const Guest: Story = {
  decorators: [withGuestAuth],
  parameters: {
    layoutType: "app",
    layoutPath: "/practices/review",
  },
};
