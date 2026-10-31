/**
 * DictationQuestionView.stories.tsx — the 12 states of §26.1 item 3 / §26.3.4.
 *
 * `Error` is the format's own error: a playback/TTS failure shown INLINE with a
 * Replay retry, because the question survives. `ErrorGeneration` is the
 * page-level `ErrorScreen` case, shown separately so the two are never confused.
 */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { userEvent, within } from "storybook/test";
import { DictationQuestionView } from "./DictationQuestionView";
import type { DictationQuestionViewProps } from "./DictationQuestionView";

const BASE: DictationQuestionViewProps = {
  instruction: "Type the pinyin you hear. Tone numbers are fine: ma3.",
  fieldLabel: "Your transcription",
  answer: "",
  replayCount: 0,
  onAnswerChange: fn(),
  onReplay: fn(),
  onSubmit: fn(),
};

function Harness(args: DictationQuestionViewProps) {
  const [answer, setAnswer] = useState(args.answer);

  return (
    <DictationQuestionView
      {...args}
      answer={answer}
      onAnswerChange={(value) => {
        setAnswer(value);
        args.onAnswerChange?.(value);
      }}
    />
  );
}

const meta = {
  title: "Features/Practices/Quiz/Formats/Dictation",
  component: DictationQuestionView,
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
} satisfies Meta<typeof DictationQuestionView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Hover: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByRole("button", { name: /Play|Replay/ }));
  },
};

export const FocusVisible: Story = {
  play: async () => {
    await userEvent.tab();
  },
};

export const Active: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.pointer([
      { target: canvas.getByRole("button", { name: /Play|Replay/ }), keys: "[MouseLeft>]" },
    ]);
  },
};

export const Selected: Story = {
  args: { answer: "ni3 hao3", replayCount: 1 },
};

export const Disabled: Story = {
  args: { locked: true },
};

export const Submitting: Story = {
  args: { submitting: true, locked: true, answer: "ni3 hao3", replayCount: 2 },
};

export const Pass: Story = {
  args: {
    answer: "ni3 hao3",
    replayCount: 2,
    outcome: {
      correct: true,
      expected: "nǐ hǎo",
      displayPinyin: "nǐ hǎo — third tone then third tone",
    },
  },
};

export const Fail: Story = {
  args: {
    answer: "ni hao",
    replayCount: 3,
    outcome: {
      correct: false,
      expected: "nǐ hǎo",
      displayPinyin: "nǐ hǎo — third tone then third tone",
    },
  },
};

export const Empty: Story = {
  args: { empty: true, onExit: fn() },
};

export const Error: Story = {
  args: {
    audioError: "Audio could not load. Press Replay to try again.",
    onReplay: fn(),
  },
};

export const ErrorGeneration: Story = {
  args: { error: "We could not load this question.", onRetry: fn() },
};

export const Edge: Story = {
  args: {
    answer: "wo3 men5 ming2 tian1 yi4 qi3 qu4 tu2 shu1 guan3 xue2 xi2 zhong1 wen2",
    replayCount: 7,
    playing: true,
  },
};
