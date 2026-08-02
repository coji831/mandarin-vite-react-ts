/**
 * @file MnemonicCard.stories.tsx
 * @description Storybook stories for MnemonicCard — 4 layouts × 3 states.
 * Story 21.20: Classification-Aware Mnemonic UI
 *
 * Covers: populated, loading, and error states for each layout type.
 */

import type { Meta, StoryObj } from "@storybook/react-vite";
import { MnemonicCard } from "../MnemonicCard";

const meta: Meta<typeof MnemonicCard> = {
  title: "Shared/MnemonicCard",
  component: MnemonicCard,
  parameters: {
    backgrounds: { default: "dark" },
  },
};

export default meta;
type Story = StoryObj<typeof MnemonicCard>;

// ── Pictograph ─────────────────────────────────

export const PictographPopulated: Story = {
  args: {
    character: "日",
    classification: "pictograph",
    radicalIds: [],
    story:
      "The character **日** (rì) depicts the sun. The outer rectangle represents the circular shape of the sun, and the horizontal line in the middle represents the sun's equator or a cloud passing across its face.",
    isEdited: false,
  },
};

export const PictographEmpty: Story = {
  args: {
    character: "山",
    classification: "pictograph",
    radicalIds: [],
    story: "",
    isEdited: false,
  },
};

// ── Phono-semantic ────────────────────────────

export const PhonoSemanticPopulated: Story = {
  args: {
    character: "江",
    classification: "phono_semantic",
    radicalIds: ["氵", "工"],
    story:
      "The character **江** (jiāng) means 'river'. The **氵** (water radical) on the left gives the meaning clue — it relates to water. The **工** (gōng) on the right gives the sound clue.",
    isEdited: false,
  },
};

export const PhonoSemanticLoading: Story = {
  args: {
    character: "河",
    classification: "phono_semantic",
    radicalIds: ["氵", "可"],
    story: "",
    isEdited: false,
    isLoading: true,
  },
};

// ── Compound Ideograph ────────────────────────

export const CompoundIdeographPopulated: Story = {
  args: {
    character: "明",
    classification: "ideograph",
    radicalIds: ["日", "月"],
    story:
      "The character **明** (míng) means 'bright'. It combines **日** (sun) and **月** (moon) — the two brightest celestial bodies. Together they represent brightness and light.",
    isEdited: false,
  },
};

export const CompoundIdeographLoading: Story = {
  args: {
    character: "林",
    classification: "ideograph",
    radicalIds: ["木", "木"],
    story: "",
    isEdited: false,
    isLoading: true,
  },
};

// ── Simple Ideograph ──────────────────────────

export const SimpleIdeographPopulated: Story = {
  args: {
    character: "上",
    classification: "ideograph",
    radicalIds: ["一"],
    story:
      "The character **上** (shàng) means 'above' or 'up'. The horizontal line represents a reference point, and the short line above it indicates a position above that reference.",
    isEdited: false,
  },
};

export const SimpleIdeographLoading: Story = {
  args: {
    character: "下",
    classification: "ideograph",
    radicalIds: ["一"],
    story: "",
    isEdited: false,
    isLoading: true,
  },
};

// ── Default ───────────────────────────────────

export const DefaultLayout: Story = {
  args: {
    character: "猫",
    classification: null,
    radicalIds: [],
    story:
      "The character **猫** (māo) means 'cat'. The **犭** (animal radical) hints at its meaning, and **苗** (miáo) provides the pronunciation.",
    isEdited: false,
  },
};

export const ErrorState: Story = {
  args: {
    character: "无",
    classification: null,
    radicalIds: [],
    story: "",
    isEdited: false,
    onRegenerate: () => {},
  },
};

// ── Generating state ──────────────────────────

export const PhonoSemanticGenerating: Story = {
  args: {
    character: "河",
    classification: "phono_semantic",
    radicalIds: ["氵", "可"],
    story: "",
    isEdited: false,
    isGenerating: true,
  },
};
