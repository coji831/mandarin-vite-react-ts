/**
 * @file components/__tests__/GrammarHub.test.tsx
 * @description Integration tests for GrammarHub (Testing Trophy, INTEGRATION
 * tier) — detail render with MSW, audio play through `useAudioItemPlayback`,
 * and linked-segment clicks opening the Character/Word hub via `openHub`.
 * Story 22.3: Grammar UI
 *
 * The detail fetch runs through the REAL `useGrammarDetail` + service +
 * `apiClient`, intercepted by the MSW node server (`grammar-handlers`).
 * `useAudioItemPlayback` and `openHub` (shared side-effects) are mocked so we
 * assert their invocation without touching the audio engine / hub store.
 */
import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { server, grammarHandlers } from "src/mocks/server";
import { GrammarHub } from "../GrammarHub";
import { grammarService } from "../../services/grammarService";

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
  grammarService.clearCache();
  vi.clearAllMocks();
});
afterAll(() => server.close());

describe("GrammarHub (integration + MSW)", () => {
  it("renders detail (structure, explanation, examples) after self-fetch", async () => {
    server.use(...grammarHandlers.default());

    render(<GrammarHub entityId="gr_0018" />);

    // Loading skeleton first
    expect(screen.getByLabelText("Loading grammar pattern")).toBeInTheDocument();

    // Detail from the MSW-mocked API
    await waitFor(() =>
      expect(screen.getByText("把 (bǎ) disposal construction")).toBeInTheDocument(),
    );
    expect(screen.getByText("Subject + 把 + Object + Verb + Complement")).toBeInTheDocument();
    expect(screen.getByText(/disposal construction/i)).toBeInTheDocument();
    expect(screen.getByText("我把书放在桌子上。")).toBeInTheDocument();
    expect(screen.getByText("他把衣服洗了。")).toBeInTheDocument();
    // Related pattern link
    expect(screen.getByText("被 (bèi) passive construction")).toBeInTheDocument();
  });

  it("plays example audio via useAudioItemPlayback with textIsChinese", async () => {
    server.use(...grammarHandlers.default());

    render(<GrammarHub entityId="gr_0018" />);

    const playButtons = await screen.findAllByRole("button", { name: /Play example audio/ });
    expect(playButtons).toHaveLength(2);

    fireEvent.click(playButtons[0]);

    expect(mockPlay).toHaveBeenCalledTimes(1);
    expect(mockPlay).toHaveBeenCalledWith("我把书放在桌子上。", { textIsChinese: true });
  });

  it("opens the Character hub when a linked character token is clicked", async () => {
    server.use(...grammarHandlers.default());

    render(<GrammarHub entityId="gr_0018" />);

    await waitFor(() =>
      expect(screen.getByText("把 (bǎ) disposal construction")).toBeInTheDocument(),
    );

    // "我" is a linked character token in example 1 (aria-label = text — pinyin — gloss)
    fireEvent.click(screen.getByRole("button", { name: /我 — wǒ — I/ }));

    expect(mockOpenHub).toHaveBeenCalledWith({
      entityType: "character",
      entityId: "ch_25105",
      label: "wǒ",
    });
  });

  it("opens the Word hub when a linked word token is clicked", async () => {
    server.use(...grammarHandlers.default());

    render(<GrammarHub entityId="gr_0018" />);

    await waitFor(() =>
      expect(screen.getByText("把 (bǎ) disposal construction")).toBeInTheDocument(),
    );

    // "桌子" is a linked word token in example 1
    fireEvent.click(screen.getByRole("button", { name: /桌子 — zhuōzi — table/ }));

    expect(mockOpenHub).toHaveBeenCalledWith({
      entityType: "word",
      entityId: "w_00487",
      label: "zhuōzi",
    });
  });

  it("renders the error screen when the detail fetch fails", async () => {
    server.use(...grammarHandlers.error());

    render(<GrammarHub entityId="gr_0018" />);

    await waitFor(() =>
      expect(screen.getByText("Unable to load grammar pattern")).toBeInTheDocument(),
    );
    expect(screen.getByText("Try Again")).toBeInTheDocument();
  });
});
