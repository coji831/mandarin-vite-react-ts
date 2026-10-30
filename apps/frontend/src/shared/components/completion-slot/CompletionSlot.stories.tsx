/**
 * CompletionSlot.stories.tsx — the closed set of §26.2.2.
 *
 * The slot has NO variants: one shape, identity decides the content (§26.2.3).
 * These stories are therefore identities, not variants — registered with
 * misses, registered perfect, and guest — plus the stacked (`edge`) layout.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { Button } from "shared/components";
import { CompletionSlot } from "./CompletionSlot";

const meta = {
  title: "Shared/CompletionSlot",
  component: CompletionSlot,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="w-full max-w-480">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CompletionSlot>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Registered learner, missed answers — the review queue is the real next step. */
export const RegisteredWithMisses: Story = {
  args: {
    label: "Next step",
    note: "3 of 10 answers were wrong. The review queue holds exactly those.",
    primary: (
      <Button variant="primary" onClick={fn()}>
        Review what you missed
      </Button>
    ),
    secondary: (
      <Button variant="ghost" onClick={fn()}>
        Back to Practices
      </Button>
    ),
  },
};

/** Registered learner, perfect score — nothing to review, so one action. */
export const RegisteredPerfect: Story = {
  args: {
    label: "Next step",
    primary: (
      <Button variant="primary" onClick={fn()}>
        Back to Practices
      </Button>
    ),
  },
};

/** Guest — the score is real but local, so persistence owns the primary. */
export const Guest: Story = {
  args: {
    label: "Next step",
    note: "Your score is not saved yet. Create an account to keep it.",
    primary: (
      <Button variant="primary" onClick={fn()}>
        Create an account to save your progress
      </Button>
    ),
    secondary: (
      <Button variant="ghost" onClick={fn()}>
        Back to Practices
      </Button>
    ),
  },
};

/** Group name is overridable; the default is "Next step". */
export const CustomLabel: Story = {
  args: {
    label: "Session complete",
    primary: (
      <Button variant="primary" onClick={fn()}>
        Continue to Phase 2
      </Button>
    ),
    secondary: (
      <Button variant="ghost" onClick={fn()}>
        Back to Practices
      </Button>
    ),
  },
};

/**
 * Edge — the stacked layout the slot takes below 768px. Resize the canvas to
 * 320px: the primary goes full width and the ghost wraps under it.
 */
export const Edge: Story = {
  args: {
    label: "Next step",
    note: "3 of 10 answers were wrong. The review queue holds exactly those.",
    primary: (
      <Button variant="primary" onClick={fn()}>
        Review what you missed
      </Button>
    ),
    secondary: (
      <>
        <Button variant="ghost" onClick={fn()}>
          Back to Practices
        </Button>
        <Button variant="ghost" onClick={fn()}>
          Share result
        </Button>
      </>
    ),
  },
  parameters: { viewport: { defaultViewport: "mobile1" } },
};
