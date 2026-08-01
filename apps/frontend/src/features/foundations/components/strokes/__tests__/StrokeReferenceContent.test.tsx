/**
 * @file components/strokes/__tests__/StrokeReferenceContent.test.tsx
 * @description Heading/count consistency for the Strokes reference content.
 * VisFix W5: headings must reflect the number of items actually rendered from the
 * DB-backed API (5 stroke categories + 5 stroke order rules), not the stale
 * "8 basic strokes / 4 rules" copy carried over from the old content model.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { StrokeReferenceContent } from "../StrokeReferenceContent";
import { foundationsService, clearStrokeDataCache } from "features/foundations";

vi.mock("features/foundations/services/foundationsService", () => ({
  foundationsService: {
    getStrokesReference: vi.fn(),
  },
}));

/** Mirrors the DB seed: 5 stroke categories (点横竖撇折) + 5 stroke order rules.
 * No explicit type annotation — the shape is enforced by mockResolvedValue below. */
const STROKE_DATA = {
  strokes: [
    { id: "dian", glyph: "丶", pinyin: "diǎn", meaning: "dot", order: 1 },
    { id: "heng", glyph: "一", pinyin: "héng", meaning: "horizontal", order: 2 },
    { id: "shu", glyph: "丨", pinyin: "shù", meaning: "vertical", order: 3 },
    { id: "pie", glyph: "丿", pinyin: "piě", meaning: "left-falling", order: 4 },
    { id: "zhe", glyph: "㇍", pinyin: "zhé", meaning: "bend", order: 5 },
  ],
  strokeOrderRules: [
    {
      id: "rule-1",
      number: 1,
      name: "Top to Bottom",
      rule: "Write strokes from top to bottom",
      example: "三",
      description: "Write strokes from top to bottom",
    },
    {
      id: "rule-2",
      number: 2,
      name: "Left to Right",
      rule: "Write strokes from left to right",
      example: "川",
      description: "Write strokes from left to right",
    },
    {
      id: "rule-3",
      number: 3,
      name: "Horizontal Before Vertical",
      rule: "Write horizontal strokes before vertical ones that cross them",
      example: "十",
      description: "Write horizontal strokes before vertical ones that cross them",
    },
    {
      id: "rule-4",
      number: 4,
      name: "Outside Before Inside",
      rule: "Write enclosing strokes before content inside",
      example: "口",
      description: "Write enclosing strokes before content inside",
    },
    {
      id: "rule-5",
      number: 5,
      name: "Middle Before Sides",
      rule: "Write the center stroke before the side strokes",
      example: "小",
      description: "Write the center stroke before the side strokes",
    },
  ],
  suggestedCharacters: ["一", "丨", "人", "大", "口", "水", "火", "木", "日", "月"],
};

describe("StrokeReferenceContent heading/count consistency", () => {
  beforeEach(() => {
    // Reset the module-level data cache so the component starts in loading state,
    // then resolves via the mocked service (config uses mockReset: true).
    clearStrokeDataCache();
    vi.mocked(foundationsService.getStrokesReference).mockResolvedValue(STROKE_DATA);
  });

  it("renders headings that match the actual rendered stroke/rule counts (5/5)", async () => {
    render(<StrokeReferenceContent />);

    // Wait for the loaded state (stroke pinyin only exists once data arrives) —
    // the loading skeleton shares the same "The 5 Basic Strokes" heading, so we
    // anchor on a loaded-only element first.
    expect(await screen.findByText("diǎn")).toBeInTheDocument();

    expect(screen.getByText("The 5 Basic Strokes")).toBeInTheDocument();
    expect(screen.getByText("The 5 Stroke Order Rules")).toBeInTheDocument();

    // Stale copy from the old 8/4 content model must be gone.
    expect(screen.queryByText("The 8 Basic Strokes")).not.toBeInTheDocument();
    expect(screen.queryByText("The 4 Stroke Order Rules")).not.toBeInTheDocument();

    // One card per seeded category.
    for (const stroke of STROKE_DATA.strokes) {
      expect(screen.getByText(stroke.pinyin)).toBeInTheDocument();
    }
    // All 5 rules numbered 1..5.
    for (let i = 1; i <= 5; i += 1) {
      expect(screen.getByText(`${i}.`)).toBeInTheDocument();
    }
  });
});
