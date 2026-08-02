/**
 * @file features/review/components/__tests__/ReviewAutoAdvance.test.tsx
 * @description Integration test for the review session's auto-advance timing.
 *
 * Renders the REAL ReviewView + useReview with MSW-mocked /review/items data
 * (Testing Trophy INTEGRATION tier: component + MSW). Verifies the session
 * auto-starts from URL preset params and advances pinyin → result → next item
 * → complete as the user submits answers and rates them.
 *
 * This replaces the removed ReviewAutoAdvance story wrapper (business logic +
 * duplicated layout that used to live in ReviewPageFull.stories.tsx).
 */
import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "src/mocks/server";
import { renderWithProviders } from "src/test-utils";
import { ReviewView } from "../ReviewView";
import type { ReviewItem } from "../../types";

const API_BASE = "http://localhost:3001/api/v1";

const MOCK_ITEMS: ReviewItem[] = [
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
];

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function stubReviewItems(items: ReviewItem[]) {
  server.use(
    http.get(`${API_BASE}/review/items`, () => HttpResponse.json(items, { status: 200 })),
    // Rating POST is non-critical to the flow but avoid unhandled-request noise.
    http.post(`${API_BASE}/review/result`, () => HttpResponse.json({ ok: true }, { status: 200 })),
  );
}

function submitPinyin(value: string) {
  const input = screen.getByPlaceholderText("Type pinyin without tone...");
  fireEvent.change(input, { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: /submit/i }));
}

describe("ReviewView — auto-advance timing (integration)", () => {
  it("auto-starts from preset params and advances pinyin → result → next → complete", async () => {
    stubReviewItems(MOCK_ITEMS);
    renderWithProviders(<ReviewView onBack={vi.fn()} presetType="pinyin" presetSource="all" />);

    // Auto-start (both preset params present) → first pinyin item.
    await waitFor(() => {
      expect(screen.getByText(/1 of 2/)).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText("Type pinyin without tone...")).toBeInTheDocument();

    // Submit an answer → result/rating step.
    submitPinyin("ni3");
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /good/i })).toBeInTheDocument();
    });

    // Rate → advances to the second item.
    fireEvent.click(screen.getByRole("button", { name: /good/i }));
    await waitFor(() => {
      expect(screen.getByText(/2 of 2/)).toBeInTheDocument();
    });

    // Second item → submit → rate → complete.
    submitPinyin("xie4");
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /good/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /easy/i }));

    await waitFor(() => {
      expect(screen.getByText("Review Complete!")).toBeInTheDocument();
    });
    expect(screen.getByText(/You reviewed 2 items/)).toBeInTheDocument();
  });
});
