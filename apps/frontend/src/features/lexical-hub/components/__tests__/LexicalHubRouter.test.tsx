/**
 * @file components/__tests__/LexicalHubRouter.test.tsx
 * @description Tests for LexicalHubRouter component
 * Story 21.4: Reading UI + LexicalHub Phase 1
 * Story 21.7: Phase 3 — no props, reads entirely from hubStore
 * Story 21.4 (refactor): Updated for registry-based routing, uses back() + open()
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { LexicalHubRouter } from "../LexicalHubRouter";

// ----- Mock state -----
let mockCurrentEntity: Record<string, unknown> | null = null;
let mockNavigationStack: Array<Record<string, unknown>> = [];

const mockStoreState = () => ({
  currentEntity: mockCurrentEntity,
  close: vi.fn(),
  open: vi.fn(),
  back: vi.fn(),
  navigationStack: mockNavigationStack,
});

// Mock hub store
vi.mock("shared/store", async () => {
  const actual = await vi.importActual("shared/store");
  return {
    ...actual,
    useHubStore: Object.assign(
      (selector?: (s: Record<string, unknown>) => unknown) => {
        const state = mockStoreState();
        return selector ? selector(state) : state;
      },
      {
        getState: () => ({
          back: vi.fn(),
          close: vi.fn(),
          open: vi.fn(),
        }),
      },
    ),
  };
});

// Mock the entity hub registry with sync (non-lazy) components
vi.mock("../../entityHubRegistry", () => ({
  entityHubRegistry: {
    word: ({ entityId }: { entityId?: string }) => (
      <div data-testid="word-hub-content">WordHub: {entityId}</div>
    ),
    character: ({ entityId }: { entityId?: string }) => (
      <div data-testid="char-hub-content">CharacterHub: {entityId}</div>
    ),
    radical: () => <div>Radical detail coming in a future story.</div>,
    chengyu: () => <div>Detail coming in a future story.</div>,
    grammar: () => <div>Detail coming in a future story.</div>,
    phoneticCluster: () => <div>Detail coming in a future story.</div>,
  },
}));

describe("LexicalHubRouter", () => {
  beforeEach(() => {
    mockCurrentEntity = null;
    mockNavigationStack = [];
  });

  it("renders WordHub for word entity type", () => {
    mockCurrentEntity = { entityType: "word", entityId: "好", label: "hǎo" };
    render(<LexicalHubRouter />);
    expect(screen.getByTestId("word-hub-content")).toBeInTheDocument();
    expect(screen.getByText("WordHub: 好")).toBeInTheDocument();
  });

  it("renders CharacterHub for character entity type", () => {
    mockCurrentEntity = { entityType: "character", entityId: "女", label: "nǚ" };
    render(<LexicalHubRouter />);
    expect(screen.getByTestId("char-hub-content")).toBeInTheDocument();
    expect(screen.getByText("CharacterHub: 女")).toBeInTheDocument();
  });

  it("renders radical placeholder for radical entity type", () => {
    mockCurrentEntity = { entityType: "radical", entityId: "rad_001", label: "yī" };
    render(<LexicalHubRouter />);
    expect(screen.getByText(/Radical detail coming in a future story/)).toBeInTheDocument();
  });

  it("renders NotImplemented placeholder for unknown entity type via registry", () => {
    mockCurrentEntity = { entityType: "grammar", entityId: "le-particle", label: "了" };
    render(<LexicalHubRouter />);
    expect(screen.getByText("Detail coming in a future story.")).toBeInTheDocument();
  });

  it("renders placeholder when no currentEntity", () => {
    render(<LexicalHubRouter />);
    expect(screen.getByText("Select a character or word to view details.")).toBeInTheDocument();
  });

  it("renders back button when navigation stack has entries", () => {
    mockNavigationStack = [{ entityType: "character", entityId: "女" }];
    mockCurrentEntity = { entityType: "word", entityId: "好", label: "hǎo" };
    render(<LexicalHubRouter />);
    expect(screen.getByText("← Back")).toBeInTheDocument();
  });

  it("does not render back button when navigation stack is empty", () => {
    mockCurrentEntity = { entityType: "word", entityId: "好", label: "hǎo" };
    render(<LexicalHubRouter />);
    expect(screen.queryByText("← Back")).not.toBeInTheDocument();
  });
});
