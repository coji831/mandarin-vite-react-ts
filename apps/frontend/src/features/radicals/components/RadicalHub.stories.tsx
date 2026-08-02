/**
 * @file RadicalHub.stories.tsx
 * @description Storybook stories for RadicalHub — radical detail in the lexical hub.
 * Story 21.x (visual wave): registered `radical` hub.
 *
 * Covers: default (mocked radical prop + MSW characters), self-fetch via MSW,
 * loading, and error states.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { RadicalHub } from "./RadicalHub";
import { mswHandlers } from "../../../../.storybook/msw-handlers";
import type { RadicalData } from "../types";

const MOCK_RADICAL: RadicalData = {
  id: "rad_0030",
  glyph: "口",
  alternate_glyphs: [],
  name_pinyin: "kǒu",
  name_chinese: "口",
  meaning: "mouth",
  stroke_count: 3,
  is_recommended: true,
  kangxi_index: 30,
  metadata: {
    etymology: "Pictograph of an open mouth",
    frequency_rank: 4,
    notes:
      "One of the most common radicals. Found in hundreds of characters related to speech, eating, and sound.",
    is_also_character: true,
  },
};

const meta = {
  title: "Features/Radicals/RadicalHub",
  component: RadicalHub,
  parameters: { layout: "centered" },
} satisfies Meta<typeof RadicalHub>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { entityId: "rad_0030", entityLabel: "口 (kǒu)", radical: MOCK_RADICAL },
  parameters: { msw: { handlers: [mswHandlers.radicals.characters("rad_0030")] } },
};

export const SelfFetch: Story = {
  args: { entityId: "rad_0030", entityLabel: "口 (kǒu)" },
  parameters: {
    msw: {
      handlers: [mswHandlers.radicals.byId(), mswHandlers.radicals.characters("rad_0030")],
    },
  },
};

export const Loading: Story = {
  args: { entityId: "rad_0030" },
  parameters: { msw: { handlers: [mswHandlers.radicals.byIdLoading()] } },
};

export const Error: Story = {
  args: { entityId: "rad_0030" },
  parameters: { msw: { handlers: [mswHandlers.radicals.byIdError()] } },
};
