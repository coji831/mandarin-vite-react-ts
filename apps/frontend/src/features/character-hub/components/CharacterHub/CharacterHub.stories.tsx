import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { CharacterHub } from "./CharacterHub";
import { mswHandlers } from "../../../../../.storybook/msw-handlers";

const API_BASE = "http://localhost:3001/api/v1";

// ─── Shared MSW Handler Constants ──────────────────────────────────────

/** Radicals list — "白" is a self-match radical and returned via API */
const radicalsWithHao = () =>
  http.get(`${API_BASE}/radicals`, () =>
    HttpResponse.json([
      {
        id: "rad_0025",
        glyph: "白",
        meaning: "white",
        stroke_count: 5,
        name_pinyin: "bái",
        kangxi_index: 25,
        is_recommended: true,
        metadata: {
          etymology: "Pictograph of a white rice grain",
          frequency_rank: 45,
          notes: "White radical — 好 contains 白 as a component.",
          is_also_character: true,
        },
      },
    ]),
  );

/** Catch-all handler for radicals/character/* — regex to handle URL-encoded glyphs */
const radicalsByCharacterFallback = http.get(new RegExp(`^${API_BASE}/radicals/character/.+`), () =>
  HttpResponse.json([]),
);

/** Mnemonic handler: returns a sample story for "好" */
const mnemonicForHao = () =>
  http.get(`${API_BASE}/v1/mnemonics/好`, () =>
    HttpResponse.json({
      id: "mne_001",
      characterGlyph: "好",
      story: "A woman (女) with a child (子) is good — a classic compound ideograph.",
      radicalIds: ["rad_0025"],
      isEdited: false,
      isPictograph: false,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    }),
  );

/** Mnemonic handler: returns 404 for other characters (empty state) */
const mnemonicNotFound = http.get(new RegExp(`^${API_BASE}/v1/mnemonics/.+`), () =>
  HttpResponse.json(null, { status: 404 }),
);

/** Mnemonic POST handler: returns a generated story */
const mnemonicGenerate = http.post(new RegExp(`^${API_BASE}/v1/mnemonics/.+`), () =>
  HttpResponse.json({
    id: "mne_gen_001",
    characterGlyph: "好",
    story: "Generated: A woman (女) and a child (子) together represent goodness.",
    radicalIds: ["rad_0025"],
    isEdited: false,
    isPictograph: false,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  }),
);

export const DefaultHandlers = [
  ...mswHandlers.auth,
  mswHandlers.progression.phaseGate(3),
  ...mswHandlers.foundations.default(),
  mswHandlers.characters.fallback,
  radicalsWithHao(),
  radicalsByCharacterFallback,
  mnemonicForHao(),
  mnemonicNotFound,
  mnemonicGenerate,
];

const meta: Meta<typeof CharacterHub> = {
  title: "Features/CharacterHub",
  component: CharacterHub,
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/learn/foundations"]}>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    msw: {
      handlers: DefaultHandlers,
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof CharacterHub>;

export const Loaded: Story = {
  name: "好 — Fully loaded (all features)",
  parameters: {
    msw: {
      handlers: DefaultHandlers,
    },
  },
  render: () => <CharacterHub entityId="好" />,
};

export const Loading: Story = {
  name: "Loading — All skeletons",
  parameters: {
    msw: {
      handlers: [
        ...mswHandlers.auth,
        mswHandlers.progression.phaseGate(3),
        ...mswHandlers.foundations.default(),
        mswHandlers.radicals.default(),
      ],
    },
  },
  render: () => <CharacterHub entityId="" />,
};

/** Story: character with no radicals (empty state) */
export const Empty: Story = {
  name: "Empty — No radicals found",
  render: () => <CharacterHub entityId="爱" />,
};

/** Story: simulating API failure for radicals */
export const Error: Story = {
  name: "Error — Radicals load failure",
  render: () => <CharacterHub entityId="好" />,
  parameters: {
    msw: {
      handlers: [
        ...mswHandlers.auth,
        mswHandlers.progression.phaseGate(3),
        ...mswHandlers.foundations.default(),
        mswHandlers.characters.default("好"),
        http.get(`${API_BASE}/radicals`, () => HttpResponse.error()),
        http.get(new RegExp(`^${API_BASE}/radicals/character/.+`), () => HttpResponse.error()),
        mnemonicForHao(),
        mnemonicNotFound,
        mnemonicGenerate,
      ],
    },
  },
};

export const MnemonicDisplay: Story = {
  name: "好 — Mnemonic Story Display",
  parameters: {
    msw: {
      handlers: [
        ...DefaultHandlers,
        // Override mnemonic GET to return a sample story
        http.get(`${API_BASE}/v1/mnemonics/好`, () =>
          HttpResponse.json({
            id: "mne_001",
            characterGlyph: "好",
            story: "A woman (女) with a child (子) is good — a classic compound ideograph.",
            radicalIds: ["rad_0025"],
            isEdited: false,
            isPictograph: false,
            createdAt: "2025-01-01T00:00:00Z",
            updatedAt: "2025-01-01T00:00:00Z",
          }),
        ),
      ],
    },
  },
  render: () => <CharacterHub entityId="好" />,
};

export const MnemonicEmpty: Story = {
  name: "好 — No Mnemonic Story Yet",
  render: () => <CharacterHub entityId="好" />,
};

export const MnemonicPictograph: Story = {
  name: "水 — Pictograph (no mnemonic needed)",
  render: () => <CharacterHub entityId="水" />,
};
