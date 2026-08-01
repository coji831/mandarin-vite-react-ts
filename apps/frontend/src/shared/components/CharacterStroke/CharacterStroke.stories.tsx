/**
 * CharacterStrokePlayer stories
 *
 * Renders the REAL CharacterStrokePlayer. hanzi-writer is a DOM-manipulating
 * library, so per .github/instructions/react-external-libs.instructions.md the
 * component owns the canvas ref and cleanup; stories only control the data it
 * loads. The hanzi-writer-data CDN fetch is intercepted via MSW:
 *   - Default: valid stroke data → rendered/interactive canvas
 *   - Loading: request never resolves → loading placeholder
 *   - Empty:   empty character (no glyph) → placeholder/fallback state
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { http, HttpResponse } from "msw";
import { CharacterStrokePlayer } from "./CharacterStrokePlayer";

const CDN_BASE = "https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1";

/** Minimal valid hanzi-writer char data (strokes + medians for animation). */
const STROKE_DATA = {
  strokes: [
    "M 102 50 C 102 75, 102 125, 102 150",
    "M 50 102 C 75 102, 125 102, 150 102",
    "M 102 50 C 80 90, 80 130, 102 150",
    "M 60 60 L 144 60 L 102 150 Z",
  ],
  medians: [
    [
      [102, 50],
      [102, 100],
      [102, 150],
    ],
    [
      [50, 102],
      [100, 102],
      [150, 102],
    ],
    [
      [102, 50],
      [90, 100],
      [102, 150],
    ],
    [
      [60, 60],
      [100, 90],
      [144, 60],
      [102, 150],
    ],
  ],
};

/** Resolves with stroke data — drives the rendered state. */
const STROKE_DATA_HANDLER = http.get(`${CDN_BASE}/:char.json`, () =>
  HttpResponse.json(STROKE_DATA, { status: 200 }),
);

/** Never resolves — keeps the player in its loading state. */
const STROKE_DATA_LOADING = http.get(`${CDN_BASE}/:char.json`, () => new Promise(() => {}));

/** 404 — the empty-character CDN lookup fails gracefully (regex matches "/.json"). */
const STROKE_DATA_EMPTY = http.get(new RegExp(`^${CDN_BASE}/.*\\.json$`), () =>
  HttpResponse.json({ error: "Character data not found" }, { status: 404 }),
);

const meta: Meta<typeof CharacterStrokePlayer> = {
  title: "Shared/CharacterStroke",
  component: CharacterStrokePlayer,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    character: { control: "text" },
    mode: { control: "select", options: ["full", "mini"] },
    placeholderSize: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof CharacterStrokePlayer>;

/**
 * Default — full player with stroke data loaded: canvas renders, controls are
 * enabled, and the stroke counter shows.
 */
export const Default: Story = {
  render: () => <CharacterStrokePlayer character="好" mode="full" />,
  parameters: {
    msw: { handlers: [STROKE_DATA_HANDLER] },
  },
};

/**
 * Mini — compact player for embedding (e.g. Character Hub) with loaded data.
 */
export const Mini: Story = {
  render: () => <CharacterStrokePlayer character="好" mode="mini" />,
  parameters: {
    msw: { handlers: [STROKE_DATA_HANDLER] },
  },
};

/**
 * Loading — the character-data request never resolves, so the player shows
 * the "Loading…" placeholder until data arrives.
 */
export const Loading: Story = {
  render: () => <CharacterStrokePlayer character="好" mode="full" />,
  parameters: {
    msw: { handlers: [STROKE_DATA_LOADING] },
  },
};

/**
 * Empty — an empty character (no glyph): the CDN lookup fails gracefully and
 * the player stays in its placeholder/fallback state (no character to animate).
 */
export const Empty: Story = {
  render: () => <CharacterStrokePlayer character="" mode="full" />,
  parameters: {
    msw: { handlers: [STROKE_DATA_EMPTY] },
  },
};
