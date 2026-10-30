/**
 * ClozeQuestionView.stories.tsx — the 12 states of §26.1 item 3 / §26.3.2.
 *
 * Feature-local on purpose: only `pages/**\/*Full.stories.tsx` is collected by
 * `check:page-inventory`, so a format story lives beside its view and never
 * creates a second `*Full.stories.tsx`.
 *
 * `hover` / `focus-visible` / `active` are real interaction states driven by a
 * `play` function, not a fake class: a story that lies about a pseudo-class is
 * worse than no story.
 */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { userEvent, within } from "storybook/test";
import { ClozeQuestionView } from "./ClozeQuestionView";
import type { ClozeQuestionViewProps } from "./ClozeQuestionView";

const OPTIONS = [
  { value: "ba", label: "把" },
  { value: "bei", label: "被" },
  { value: "le", label: "了" },
  { value: "de", label: "的" },
];

const BASE: ClozeQuestionViewProps = {
  patternName: "把-construction",
  gloss: "I hit him.",
  sentenceBefore: "我 ",
  sentenceAfter: " 打人。",
  options: OPTIONS,
  onSelect: fn(),
  onSubmit: fn(),
};

/** Local selection only — nothing here grades. */
function Harness(args: ClozeQuestionViewProps) {
  const [selected, setSelected] = useState<string | null>(args.selected ?? null);

  return (
    <ClozeQuestionView
      {...args}
      selected={selected}
      onSelect={(value) => {
        setSelected(value);
        args.onSelect?.(value);
      }}
    />
  );
}

const meta = {
  title: "Features/Practices/Quiz/Formats/Cloze",
  component: ClozeQuestionView,
  args: BASE,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="w-full max-w-480">
        <Story />
      </div>
    ),
  ],
  render: (args) => <Harness {...args} />,
} satisfies Meta<typeof ClozeQuestionView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Hover: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByText("被"));
  },
};

export const FocusVisible: Story = {
  play: async () => {
    await userEvent.tab();
    await userEvent.keyboard("{ArrowDown}");
  },
};

export const Active: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.pointer([{ target: canvas.getByText("了"), keys: "[MouseLeft>]" }]);
  },
};

export const Selected: Story = {
  args: { selected: "ba" },
};

export const Disabled: Story = {
  args: { locked: true },
};

export const Submitting: Story = {
  args: { submitting: true, locked: true, selected: "ba" },
};

export const Pass: Story = {
  args: {
    selected: "ba",
    outcome: {
      correct: true,
      chosen: "把",
      answer: "把",
      explanation: "把 moves the object in front of the verb.",
    },
  },
};

export const Fail: Story = {
  args: {
    selected: "bei",
    outcome: {
      correct: false,
      chosen: "被",
      answer: "把",
      explanation: "被 marks the agent in a passive; this sentence is active.",
    },
  },
};

export const Empty: Story = {
  args: { empty: true, onExit: fn() },
};

export const Error: Story = {
  args: { error: "We could not build this question.", onRetry: fn() },
};

export const Edge: Story = {
  args: {
    patternName: "comparative-比-construction-with-measure-words-and-adverbs",
    gloss:
      "My older sister is a little taller than me, and she studies much more carefully than I do.",
    sentenceBefore: "我姐姐比我 ",
    sentenceAfter: " 高一点儿，而且她学习得比我认真得多，所以她每天都比我起得早。",
    options: [
      { value: "a", label: "高一点儿 (a little taller)" },
      { value: "b", label: "很高 (very tall)" },
      { value: "c", label: "不高 (not tall)" },
      { value: "d", label: "最高的 (the tallest)" },
    ],
  },
};
