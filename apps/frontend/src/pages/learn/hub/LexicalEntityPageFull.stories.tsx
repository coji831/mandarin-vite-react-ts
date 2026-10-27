/**
 * @file pages/learn/hub/LexicalEntityPageFull.stories.tsx
 * @description Page-level Storybook stories for the routed lexical session.
 * S2 (session = route, not modal): proves the detail renders as a Focus page
 * (rail collapsed + recessed top bar) instead of the retired 720px overlay.
 *
 * Args override the route params because the Storybook preview mounts the story
 * at a literal path; in the app `useParams()` supplies them.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { LexicalEntityPage } from "./LexicalEntityPage";
import { grammarHandlers } from "../../../mocks/handlers/grammar-handlers";
import { mswHandlers } from "../../../../.storybook/msw-handlers";

const meta = {
  title: "Pages/Learn/LexicalEntityPage",
  component: LexicalEntityPage,
  tags: ["pages-detail"],
  args: {
    entityType: "grammar",
    entityId: "gr_0018",
    label: "把 (bǎ) disposal construction",
  },
  parameters: {
    layout: "fullscreen",
    layoutType: "learn",
    layoutPath: "/learn/hub/grammar/gr_0018",
  },
} satisfies Meta<typeof LexicalEntityPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    msw: { handlers: [grammarHandlers.default(), mswHandlers.progression.phaseGate(2)] },
  },
};

export const Loading: Story = {
  parameters: {
    msw: { handlers: [grammarHandlers.loading(), mswHandlers.progression.phaseGate(2)] },
  },
};

export const Error: Story = {
  parameters: {
    msw: { handlers: [grammarHandlers.error(), mswHandlers.progression.phaseGate(2)] },
  },
};

/**
 * A session that HOPPED (radical → grammar): the trail strip is the routed
 * surface's replacement for the retired overlay's in-session navigation.
 */
export const SessionTrail: Story = {
  args: {
    trail: [{ entityType: "radical", entityId: "rad_0001", label: "氵" }],
  },
  parameters: {
    msw: { handlers: [grammarHandlers.default(), mswHandlers.progression.phaseGate(2)] },
  },
};
