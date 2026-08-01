/**
 * @file components/__tests__/RadicalHub.test.tsx
 * @description Tests for RadicalHub component
 * Story 19.2: Radical Detail Card
 * Story 21.x (visual wave): registered `radical` lexical hub — self-fetch + prop mode.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RadicalHub } from "../RadicalHub";
import type { RadicalData } from "../../types";

// Mock the hooks barrel (useRadicalById)
vi.mock("../../hooks", () => ({
  useRadicalById: vi.fn(),
}));

// Mock the shared presentational body
vi.mock("../RadicalDetailContent", () => ({
  RadicalDetailContent: ({ radical }: { radical: RadicalData }) => (
    <div data-testid="radical-detail-content">
      {radical.glyph} ({radical.meaning})
    </div>
  ),
}));

import { useRadicalById } from "../../hooks";

const MOCK_RADICAL: RadicalData = {
  id: "rad_0001",
  glyph: "一",
  alternate_glyphs: [],
  name_pinyin: "yī",
  name_chinese: "一",
  meaning: "one",
  stroke_count: 1,
  is_recommended: true,
  kangxi_index: 1,
  metadata: {},
};

describe("RadicalHub", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading skeleton when loading", () => {
    vi.mocked(useRadicalById).mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
    });

    render(<RadicalHub entityId="rad_0001" />);
    expect(screen.getByLabelText("Loading radical details")).toBeInTheDocument();
  });

  it("renders radical data after self-fetch", () => {
    vi.mocked(useRadicalById).mockReturnValue({
      data: MOCK_RADICAL,
      isLoading: false,
      isError: false,
    });

    render(<RadicalHub entityId="rad_0001" />);
    expect(screen.getByTestId("radical-detail-content")).toHaveTextContent("一 (one)");
    // Self-fetch path — hook called with the entity id
    expect(useRadicalById).toHaveBeenCalledWith("rad_0001");
  });

  it("renders radical from prop directly (Storybook mode)", () => {
    vi.mocked(useRadicalById).mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });

    render(<RadicalHub entityId="" radical={MOCK_RADICAL} />);
    expect(screen.getByTestId("radical-detail-content")).toHaveTextContent("一 (one)");
    // Storybook mode — hook called with null (no self-fetch)
    expect(useRadicalById).toHaveBeenCalledWith(null);
  });

  it("renders error screen when hasError", () => {
    vi.mocked(useRadicalById).mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
    });

    render(<RadicalHub entityId="rad_0001" />);
    expect(screen.getByText("Unable to load radical")).toBeInTheDocument();
  });

  it("renders no-data fallback when radical is null and not loading", () => {
    vi.mocked(useRadicalById).mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });

    render(<RadicalHub entityId="rad_0001" />);
    expect(screen.getByText("No radical data available.")).toBeInTheDocument();
  });
});
