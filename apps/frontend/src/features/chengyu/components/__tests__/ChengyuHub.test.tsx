/**
 * @file components/__tests__/ChengyuHub.test.tsx
 * @description Integration tests for ChengyuHub (Testing Trophy, INTEGRATION
 * tier) — detail render with MSW, audio play through `useAudioItemPlayback`,
 * related-idiom cross-links opening the chengyu hub, and character/word token
 * clicks opening the Character/Word hub via `openHub`.
 * Story 23.3: Chengyu UI
 *
 * The detail fetch runs through the REAL `useChengyuDetail` + service +
 * `apiClient`, intercepted by the MSW node server (`chengyu-handlers`).
 * `useAudioItemPlayback` and `openHub` (shared side-effects) are mocked so we
 * assert their invocation without touching the audio engine / hub store.
 */
import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { server, chengyuHandlers } from "src/mocks/server";
import { ChengyuHub } from "../ChengyuHub";
import { chengyuService } from "../../services/chengyuService";

const mockOpenHub = vi.hoisted(() => vi.fn());
const mockPlay = vi.hoisted(() => vi.fn());

vi.mock("shared/hub-entry", () => ({
  openHub: mockOpenHub,
  closeHub: vi.fn(),
}));

vi.mock("shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("shared/hooks")>();
  return {
    ...actual,
    useAudioItemPlayback: () => ({
      play: mockPlay,
      pause: vi.fn(),
      stop: vi.fn(),
      status: "idle",
      isPlaying: false,
      isLoading: false,
      error: null,
    }),
  };
});

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  chengyuService.clearCache();
  vi.clearAllMocks();
});
afterAll(() => server.close());

describe("ChengyuHub (integration + MSW)", () => {
  it("renders detail (story → literal → figurative → examples + related) after self-fetch", async () => {
    server.use(...chengyuHandlers.default());

    render(<ChengyuHub entityId="cy_0001" />);

    // Loading skeleton first
    expect(screen.getByLabelText("Loading chengyu idiom")).toBeInTheDocument();

    // Detail from the MSW-mocked API — narrative-first order
    await waitFor(() => expect(screen.getByText("破釜沉舟")).toBeInTheDocument());
    expect(screen.getByText("pò fǔ chén zhōu")).toBeInTheDocument();
    expect(screen.getByText("Story")).toBeInTheDocument();
    expect(screen.getByText(/Xiang Yu led his army/)).toBeInTheDocument();
    expect(screen.getByText("Literal meaning")).toBeInTheDocument();
    expect(screen.getByText("Break the pots and sink the boats")).toBeInTheDocument();
    expect(screen.getByText("Figurative meaning")).toBeInTheDocument();
    expect(screen.getByText(/burn one's bridges/)).toBeInTheDocument();
    expect(screen.getByText("Modern usage")).toBeInTheDocument();
    expect(screen.getByText(/他已经决定要破釜沉舟/)).toBeInTheDocument();
    // Related idioms cross-links
    expect(screen.getByText("孤注一掷")).toBeInTheDocument();
    expect(screen.getByText("背水一战")).toBeInTheDocument();
  });

  it("plays the idiom audio via useAudioItemPlayback with textIsChinese", async () => {
    server.use(...chengyuHandlers.default());

    render(<ChengyuHub entityId="cy_0001" />);

    const idiomButton = await screen.findByRole("button", {
      name: "Play idiom audio: 破釜沉舟",
    });
    fireEvent.click(idiomButton);

    expect(mockPlay).toHaveBeenCalledTimes(1);
    expect(mockPlay).toHaveBeenCalledWith("破釜沉舟", { textIsChinese: true });
  });

  it("plays example audio via useAudioItemPlayback with textIsChinese", async () => {
    server.use(...chengyuHandlers.default());

    render(<ChengyuHub entityId="cy_0001" />);

    const playButtons = await screen.findAllByRole("button", { name: /Play example audio/ });
    expect(playButtons).toHaveLength(1);

    fireEvent.click(playButtons[0]);

    expect(mockPlay).toHaveBeenCalledTimes(1);
    expect(mockPlay).toHaveBeenCalledWith("他已经决定要破釜沉舟，全力投入新的工作。", {
      textIsChinese: true,
    });
  });

  it("opens the Character hub with the GLYPH entityId when a linked character token is clicked", async () => {
    server.use(...chengyuHandlers.default());

    render(<ChengyuHub entityId="cy_0001" />);

    await waitFor(() => expect(screen.getByText("破釜沉舟")).toBeInTheDocument());

    // "破" is a linked character token in the example (aria-label = text — pinyin — gloss)
    fireEvent.click(screen.getByRole("button", { name: /破 — pò — break/ }));

    // openHub receives the GLYPH (破), not the seed's content_id (ch_30772)
    expect(mockOpenHub).toHaveBeenCalledWith({
      entityType: "character",
      entityId: "破",
      label: "pò",
    });
  });

  it("opens the Character hub for a click on the idiom's 4-character strip", async () => {
    server.use(...chengyuHandlers.default());

    render(<ChengyuHub entityId="cy_0001" />);

    await waitFor(() => expect(screen.getByText("破釜沉舟")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Open character hub: 舟" }));

    expect(mockOpenHub).toHaveBeenCalledWith({
      entityType: "character",
      entityId: "舟",
      label: "舟",
    });
  });

  it("opens the chengyu hub when a related-idiom cross-link is clicked", async () => {
    server.use(...chengyuHandlers.default());

    render(<ChengyuHub entityId="cy_0001" />);

    await waitFor(() => expect(screen.getByText("破釜沉舟")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Open related idiom: 孤注一掷 (RELATED)" }));

    expect(mockOpenHub).toHaveBeenCalledWith({
      entityType: "chengyu",
      entityId: "cy_0042",
      label: "孤注一掷",
    });
  });

  it("renders the error state when the detail fetch fails", async () => {
    server.use(...chengyuHandlers.error());

    render(<ChengyuHub entityId="cy_0001" />);

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Unable to load idiom" })).toBeInTheDocument(),
    );
    expect(screen.getByText("Try Again")).toBeInTheDocument();
  });
});
