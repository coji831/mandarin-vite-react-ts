/**
 * @file features/review/components/__tests__/ReviewView.test.tsx
 * @description Tests for ReviewView — session header is a real h1 (WCAG),
 * plus Bug 2 guest-fallback: auth-failure (session expiry) renders the
 * GuestUpsell instead of the generic ErrorScreen.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ReviewView } from "../ReviewView";

const { mockUseReview } = vi.hoisted(() => ({ mockUseReview: vi.fn() }));

const baseReviewState = {
  step: "pinyin",
  currentItem: {
    itemId: "rad_0001",
    itemType: "radical",
    character: "大",
    front: "dà",
    meaning: "big",
    pinyinPlain: "da",
  },
  loading: false,
  error: null,
  startReview: vi.fn(),
  submitPinyin: vi.fn(),
  selectOption: vi.fn(),
  selectTone: vi.fn(),
  rateItem: vi.fn(),
  progress: { current: 1, total: 10 },
  userPinyin: "",
  userTone: 0,
  pinyinCorrect: false,
  toneCorrect: false,
  sessionResult: {
    pinyinCorrect: 0,
    pinyinTotal: 0,
    toneCorrect: 0,
    toneTotal: 0,
    ratings: { easy: 0, good: 0, again: 0 },
  },
  totalItems: 10,
  contentType: "radical",
  source: "due",
};

vi.mock("../../hooks/useReview", () => ({
  useReview: () => mockUseReview(),
}));

vi.mock("shared/hooks", () => ({
  useAudioItemPlayback: () => ({ play: vi.fn() }),
}));

vi.mock("../ReviewCard", () => ({
  ReviewCard: () => <div>review-card</div>,
}));
vi.mock("../ReviewPicker", () => ({
  ReviewPicker: () => <div>review-picker</div>,
}));
vi.mock("../ReviewComplete", () => ({
  ReviewComplete: () => <div>review-complete</div>,
}));

function renderReviewView() {
  return render(
    <MemoryRouter initialEntries={["/practices/review"]}>
      <ReviewView onBack={vi.fn()} presetType="pinyin" presetSource="due" />
    </MemoryRouter>,
  );
}

describe("ReviewView", () => {
  beforeEach(() => {
    mockUseReview.mockReturnValue(baseReviewState);
  });

  it("renders the session header as an h1 with the content type", () => {
    renderReviewView();

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Review");
    expect(heading).toHaveTextContent("Radicals");
    expect(heading).toHaveTextContent("1 of 10");
  });

  // ── Bug 2: session-expiry upsell ────────────────────────────────────

  it("renders GuestUpsell when the error is an auth failure (401)", () => {
    mockUseReview.mockReturnValue({
      ...baseReviewState,
      error: {
        message: "Request failed with status code 401",
        status: 401,
        originalError: { response: { status: 401, data: {} } },
      },
    });

    renderReviewView();

    expect(screen.getByRole("heading", { name: /Your session expired/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in again ▸" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try Again" })).toBeNull();
  });

  it("renders GuestUpsell when the error is 403 INVALID_TOKEN (tampered token)", () => {
    mockUseReview.mockReturnValue({
      ...baseReviewState,
      error: {
        message: "Request failed with status code 403",
        status: 403,
        originalError: { response: { status: 403, data: { code: "INVALID_TOKEN" } } },
      },
    });

    renderReviewView();

    expect(screen.getByRole("heading", { name: /Your session expired/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in again ▸" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try Again" })).toBeNull();
  });

  it("keeps the generic ErrorScreen for non-auth errors (500)", () => {
    mockUseReview.mockReturnValue({
      ...baseReviewState,
      error: {
        message: "Request failed with status code 500",
        status: 500,
        originalError: { response: { status: 500, data: {} } },
      },
    });

    renderReviewView();

    expect(screen.getByText("Request failed with status code 500")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try Again" })).toBeInTheDocument();
    expect(screen.queryByText("Your session expired")).toBeNull();
  });
});
