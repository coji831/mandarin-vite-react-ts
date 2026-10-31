/**
 * ToneJudgmentView.stories.tsx — the 12 states of §26.1 item 3 / §26.3.5.
 *
 * No audio anywhere in this format: the stimulus is WRITTEN sandhi. The
 * `Edge` story is the no-change case (a syllable whose base tone already equals
 * its surface tone), which is where a rule-only learner usually slips.
 */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { userEvent, within } from "storybook/test";
import { ToneJudgmentView } from "./ToneJudgmentView";
import type { ToneJudgmentViewProps, ToneSyllable } from "./ToneJudgmentView";

const SYLLABLES: ToneSyllable[] = [
  { text: "nǐ", baseTone: 3, target: true },
  { text: "hǎo", baseTone: 3 },
];

const TONE_OPTIONS = [
  { value: "0", label: "Neutral" },
  { value: "1", label: "First" },
  { value: "2", label: "Second" },
  { value: "3", label: "Third" },
  { value: "4", label: "Fourth" },
];

const BASE: ToneJudgmentViewProps = {
  ruleName: "rule-3rd-sandhi",
  syllables: SYLLABLES,
  question: "What tone does 你 surface as here?",
  options: TONE_OPTIONS,
  onSelect: fn(),
  onSubmit: fn(),
};

function Harness(args: ToneJudgmentViewProps) {
  const [selected, setSelected] = useState<string | null>(args.selected ?? null);

  return (
    <ToneJudgmentView
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
  title: "Features/Practices/Quiz/Formats/ToneJudgment",
  component: ToneJudgmentView,
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
} satisfies Meta<typeof ToneJudgmentView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Hover: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByText("Second"));
  },
};

export const FocusVisible: Story = {
  play: async () => {
    await userEvent.tab();
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
  },
};

export const Active: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.pointer([{ target: canvas.getByText("Third"), keys: "[MouseLeft>]" }]);
  },
};

export const Selected: Story = {
  args: { selected: "2" },
};

export const Disabled: Story = {
  args: { locked: true },
};

export const Submitting: Story = {
  args: { submitting: true, locked: true, selected: "2" },
};

export const Pass: Story = {
  args: {
    selected: "2",
    outcome: {
      correct: true,
      chosenLabel: "second tone",
      answerLabel: "second tone",
      reveal: "ní hǎo · 2-3",
      ruleTitle: "A third tone before another third tone becomes second.",
    },
  },
};

export const Fail: Story = {
  args: {
    selected: "3",
    outcome: {
      correct: false,
      chosenLabel: "third tone",
      answerLabel: "second tone",
      reveal: "ní hǎo · 2-3",
      ruleTitle: "A third tone before another third tone becomes second.",
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
    ruleName: "rule-bu-sandhi",
    syllables: [
      { text: "bù", baseTone: 4 },
      { text: "shì", baseTone: 4, target: true },
      { text: "hěn", baseTone: 3 },
      { text: "hǎo", baseTone: 3 },
    ],
    question: "What tone does 是 surface as in 不是很好?",
  },
};
