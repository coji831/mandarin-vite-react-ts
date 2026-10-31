/**
 * SentenceBuilderView.stories.tsx — the 12 states of §26.1 item 3 / §26.3.3.
 *
 * The `Selected` and `Edge` stories are driven by a harness that really appends,
 * removes and reorders tokens with the same callbacks the engine will pass — so
 * the "no drag, tap-to-place" contract is visible in the story, not asserted in
 * a comment.
 */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { userEvent, within } from "storybook/test";
import { SentenceBuilderView } from "./SentenceBuilderView";
import type { SentenceBuilderViewProps, SentenceToken } from "./SentenceBuilderView";

const BANK: SentenceToken[] = [
  { id: "wo", text: "我" },
  { id: "da", text: "打" },
  { id: "ren", text: "人" },
  { id: "le", text: "了" },
];

const BASE: SentenceBuilderViewProps = {
  gloss: "I hit the person.",
  bank: BANK,
  answer: [],
  onAppend: fn(),
  onRemove: fn(),
  onMove: fn(),
  onReset: fn(),
  onSubmit: fn(),
};

function Harness(args: SentenceBuilderViewProps) {
  const [answer, setAnswer] = useState<SentenceToken[]>(args.answer);

  const append = (id: string) => {
    const token = args.bank.find((candidate) => candidate.id === id);
    if (!token || answer.some((placed) => placed.id === id)) return;
    setAnswer([...answer, token]);
    args.onAppend?.(id);
  };

  const remove = (id: string) => {
    setAnswer(answer.filter((token) => token.id !== id));
    args.onRemove?.(id);
  };

  const move = (id: string, direction: "left" | "right") => {
    const index = answer.findIndex((token) => token.id === id);
    const target = direction === "left" ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= answer.length) return;
    const next = [...answer];
    [next[index], next[target]] = [next[target], next[index]];
    setAnswer(next);
    args.onMove?.(id, direction);
  };

  return (
    <SentenceBuilderView
      {...args}
      answer={answer}
      onAppend={append}
      onRemove={remove}
      onMove={move}
      onReset={() => {
        setAnswer([]);
        args.onReset?.();
      }}
    />
  );
}

const meta = {
  title: "Features/Practices/Quiz/Formats/SentenceBuilder",
  component: SentenceBuilderView,
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
} satisfies Meta<typeof SentenceBuilderView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Hover: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByRole("button", { name: "打" }));
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
      { target: canvas.getByRole("button", { name: "打" }), keys: "[MouseLeft>]" },
    ]);
  },
};

export const Selected: Story = {
  args: { answer: [{ id: "wo", text: "我" }] },
};

export const Disabled: Story = {
  args: { locked: true },
};

export const Submitting: Story = {
  args: {
    submitting: true,
    locked: true,
    answer: [
      { id: "wo", text: "我" },
      { id: "da", text: "打" },
    ],
  },
};

export const Pass: Story = {
  args: {
    answer: [
      { id: "wo", text: "我" },
      { id: "da", text: "打" },
      { id: "ren", text: "人" },
    ],
    outcome: { correct: true, canonical: ["我", "打", "人"] },
  },
};

export const Fail: Story = {
  args: {
    answer: [
      { id: "da", text: "打" },
      { id: "wo", text: "我" },
      { id: "ren", text: "人" },
    ],
    outcome: { correct: false, canonical: ["我", "打", "人"] },
  },
};

export const Empty: Story = {
  args: { empty: true, onExit: fn() },
};

export const Error: Story = {
  args: { error: "We could not build this sentence.", onRetry: fn() },
};

export const Edge: Story = {
  args: {
    gloss: "Today I went to the library with my younger sister to study Chinese.",
    answer: [
      { id: "jintian", text: "今天" },
      { id: "wo", text: "我" },
    ],
    bank: [
      { id: "jintian", text: "今天" },
      { id: "wo", text: "我" },
      { id: "he", text: "和" },
      { id: "meimei", text: "妹妹" },
      { id: "yiqi", text: "一起" },
      { id: "qu", text: "去" },
      { id: "tushuguan", text: "图书馆" },
      { id: "xuexi", text: "学习" },
    ],
  },
};
