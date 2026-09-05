/**
 * LockedSurface stories — Epic 25 S2 shared locked-surface route-gate fallback.
 *
 * Neutral, CTA-free gate screen ("X unlocks in Phase N") shown on below-phase
 * direct Learn-route navigation (guest or authed) — replaces the silent
 * redirect-to-foundations. Pure presentational (label + requiredPhase props),
 * so no MSW/decorators are needed.
 *
 * States (registry): default (Grammar → Phase 2) · edge (Chengyu → Phase 4).
 * Guest and authed below-phase share this identical surface by design.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { LockedSurface } from "./LockedSurface";

const meta: Meta<typeof LockedSurface> = {
  title: "Shared/LockedSurface",
  component: LockedSurface,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Neutral locked-surface fallback for below-phase routes — lock icon + 'X unlocks in Phase N' copy, no CTA (epic-26 GuestUpsell owns the upsell).",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof LockedSurface>;

export const GrammarLocked: Story = {
  name: "Grammar — unlocks in Phase 2",
  args: { label: "Grammar", requiredPhase: 2 },
};

export const ChengyuLocked: Story = {
  name: "Chengyu — unlocks in Phase 4",
  args: { label: "Chengyu", requiredPhase: 4 },
};
