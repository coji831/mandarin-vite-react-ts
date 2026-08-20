import type { Meta, StoryObj } from "@storybook/react-vite";
import { RadicalsPage } from "./RadicalsPage";
import { mswHandlers } from "../../../../.storybook/msw-handlers";

const PHASE2 = [mswHandlers.progression.phaseGate(2), mswHandlers.radicals.default()];
const PHASE3 = [
  mswHandlers.progression.phaseGate(3),
  mswHandlers.radicals.default(),
  mswHandlers.progression.radicalProgress.default(),
];

/** Radicals marked mastered in the radicalProgress MSW fixture (rad_0030 is NOT mastered). */
const MASTERED_RADICAL_IDS = ["rad_0001", "rad_0002", "rad_0003", "rad_0008", "rad_0009"];

/** Phase 3 + a characters handler for every mastered radical (populates tree branches). */
const PHASE3_TREE = [
  ...PHASE3,
  ...MASTERED_RADICAL_IDS.map((id) => mswHandlers.radicals.characters(id)),
];

const meta: Meta<typeof RadicalsPage> = {
  title: "Pages/Learn/Radicals",
  component: RadicalsPage,
  tags: ["pages-browse-index"],
  parameters: {
    layout: "fullscreen",
    layoutType: "learn",
    layoutPath: "/learn/radicals",
  },
};

export default meta;
type Story = StoryObj<typeof RadicalsPage>;

export const Loading: Story = {
  name: "Loading",
  parameters: {
    msw: { handlers: [mswHandlers.progression.phaseGate(2), mswHandlers.radicals.loading()] },
  },
};

export const Error: Story = {
  name: "Error",
  parameters: {
    msw: { handlers: [mswHandlers.progression.phaseGate(2), mswHandlers.radicals.error()] },
  },
};

export const Browse: Story = {
  name: "Browse tab",
  parameters: { msw: { handlers: PHASE2 } },
};

export const BrowseWithRadical: Story = {
  name: "Browse tab — radical selected",
  parameters: {
    layoutPath: "/learn/radicals?radical=rad_0001",
    msw: {
      // Auto-open now routes through the lexical hub — provide hub data handlers.
      handlers: [
        ...PHASE2,
        mswHandlers.radicals.byId(),
        mswHandlers.radicals.characters("rad_0001"),
      ],
    },
  },
};

export const Trees: Story = {
  name: "Trees tab",
  parameters: {
    layoutPath: "/learn/radicals?view=trees",
    msw: { handlers: PHASE3_TREE },
  },
};

export const TreesLoading: Story = {
  name: "Trees tab — radical progress loading",
  parameters: {
    layoutPath: "/learn/radicals?view=trees",
    msw: {
      handlers: [
        mswHandlers.progression.phaseGate(3),
        mswHandlers.radicals.default(),
        mswHandlers.progression.radicalProgress.loading(),
      ],
    },
  },
};

export const TreesEmpty: Story = {
  name: "Trees tab — no mastered radicals",
  parameters: {
    layoutPath: "/learn/radicals?view=trees",
    msw: {
      handlers: [
        mswHandlers.progression.phaseGate(3),
        mswHandlers.radicals.default(),
        mswHandlers.progression.radicalProgress.empty(),
      ],
    },
  },
};

export const TreesError: Story = {
  name: "Trees tab — radical progress error",
  parameters: {
    layoutPath: "/learn/radicals?view=trees",
    msw: {
      handlers: [
        mswHandlers.progression.phaseGate(3),
        mswHandlers.radicals.default(),
        mswHandlers.progression.radicalProgress.error(),
      ],
    },
  },
};

// ─── Phonetic tree stories ──────────────────────────────────────────────

const PHONETIC_PHASE3 = [...PHASE3, mswHandlers.phoneticClusters.default()];

const PHONETIC_PHASE2 = [...PHASE2, mswHandlers.phoneticClusters.default()];

export const PhoneticTreePhase3: Story = {
  name: "Phonetic Tree — Phase 3",
  parameters: {
    layoutPath: "/learn/radicals?view=trees&mode=phonetic",
    msw: { handlers: PHONETIC_PHASE3 },
  },
};

export const PhoneticTreePhase2: Story = {
  name: "Phonetic Tree — Phase 2 Preview",
  parameters: {
    layoutPath: "/learn/radicals?view=trees&mode=phonetic",
    msw: { handlers: PHONETIC_PHASE2 },
  },
};

export const PhoneticTreeLoading: Story = {
  name: "Phonetic Tree — Loading",
  parameters: {
    layoutPath: "/learn/radicals?view=trees&mode=phonetic",
    msw: {
      handlers: [...PHASE3, mswHandlers.phoneticClusters.loading()],
    },
  },
};

export const PhoneticTreeError: Story = {
  name: "Phonetic Tree — Error",
  parameters: {
    layoutPath: "/learn/radicals?view=trees&mode=phonetic",
    msw: {
      handlers: [...PHASE3, mswHandlers.phoneticClusters.error()],
    },
  },
};

export const PhoneticTreeEmpty: Story = {
  name: "Phonetic Tree — Empty",
  parameters: {
    layoutPath: "/learn/radicals?view=trees&mode=phonetic",
    msw: {
      handlers: [...PHASE3, mswHandlers.phoneticClusters.empty()],
    },
  },
};
