/**
 * @file pages/learn/chengyu/__tests__/ChengyuPage.integration.test.tsx
 * @description Integration test (Testing Trophy, INTEGRATION tier) — page-level
 * render with MSW-mocked API data.
 * Story 23.3: Chengyu UI
 *
 * Renders the REAL ChengyuPage and lets it fetch idiom data through the real
 * service + `apiClient`, intercepted by the MSW node server. Covers era / theme
 * / search filtering, and loading / empty / error+retry states. The page is
 * route-gated (not self-gated), so no phase-gate handler is needed here.
 */
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { server, chengyuHandlers } from "src/mocks/server";
import { renderWithProviders } from "src/test-utils";
import { ChengyuPage } from "../ChengyuPage";
import { chengyuService } from "features/chengyu";

const CHENGYU_URL = "http://localhost:3001/api/v1/chengyu/idioms";

const SEARCH_LABEL = "Search idioms by keyword, pinyin, or meaning...";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  chengyuService.clearCache();
});
afterAll(() => server.close());

describe("ChengyuPage (integration + MSW)", () => {
  it("renders idioms fetched from the API (loading → grid)", async () => {
    server.use(...chengyuHandlers.default());

    renderWithProviders(<ChengyuPage />, { route: "/learn/chengyu" });

    // Loading skeleton first
    expect(screen.getByLabelText("Loading chengyu idioms")).toBeInTheDocument();

    // Grid populated from the MSW-mocked API data
    await waitFor(() => expect(screen.getByText("破釜沉舟")).toBeInTheDocument());
    expect(screen.getByText("叶公好龙")).toBeInTheDocument();
    expect(screen.getByText("背水一战")).toBeInTheDocument();
  });

  it("filters by era when an era chip is clicked", async () => {
    server.use(...chengyuHandlers.default());

    renderWithProviders(<ChengyuPage />, { route: "/learn/chengyu" });
    await waitFor(() => expect(screen.getByText("破釜沉舟")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Han" }));

    // Only the Han-era idiom remains (fetch refires on filter change)
    await waitFor(() => expect(screen.getByText("背水一战")).toBeInTheDocument());
    expect(screen.queryByText("破釜沉舟")).not.toBeInTheDocument();
    expect(screen.queryByText("叶公好龙")).not.toBeInTheDocument();
  });

  it("filters by theme when a theme option is selected from the Dropdown", async () => {
    server.use(...chengyuHandlers.default());

    renderWithProviders(<ChengyuPage />, { route: "/learn/chengyu" });
    await waitFor(() => expect(screen.getByText("破釜沉舟")).toBeInTheDocument());

    // Open the theme Dropdown and pick "hypocrisy" (only 叶公好龙 carries it)
    fireEvent.click(screen.getByRole("button", { name: "Filter by theme" }));
    fireEvent.click(screen.getByRole("option", { name: "hypocrisy" }));

    await waitFor(() => expect(screen.getByText("叶公好龙")).toBeInTheDocument());
    expect(screen.queryByText("破釜沉舟")).not.toBeInTheDocument();
    expect(screen.queryByText("背水一战")).not.toBeInTheDocument();
  });

  it("filters by search query (debounced) when text is typed", async () => {
    // The default MSW handler already filters by search — the two idioms with
    // "破" in chengyu/pinyin/meaning: 破釜沉舟 + 背水一战(no) — use a custom
    // handler so the debounce → refetch → filtered-set behavior is explicit.
    server.use(
      http.get(CHENGYU_URL, ({ request }) => {
        const url = new URL(request.url);
        const search = url.searchParams.get("search") ?? "";
        const all = [
          {
            id: "cy_0001",
            chengyu: "破釜沉舟",
            pinyin: "pò fǔ chén zhōu",
            literalMeaning: "Break the pots and sink the boats",
            figurativeMeaning: "To burn one's bridges",
            era: "Qin–Han transition",
            theme: "determination",
            sortOrder: 1,
            exampleCount: 1,
            previewExample: "他已经决定要破釜沉舟，全力投入新的工作。",
          },
          {
            id: "cy_0005",
            chengyu: "叶公好龙",
            pinyin: "yè gōng hào lóng",
            literalMeaning: "Lord Ye loves dragons",
            figurativeMeaning: "To profess love for something one actually fears",
            era: "Spring & Autumn",
            theme: "hypocrisy",
            sortOrder: 5,
            exampleCount: 1,
            previewExample: "他嘴上说喜欢爬山，其实叶公好龙，一次也没去过。",
          },
        ].filter(
          (item) =>
            item.chengyu.toLowerCase().includes(search.toLowerCase()) ||
            item.pinyin.toLowerCase().includes(search.toLowerCase()) ||
            item.literalMeaning.toLowerCase().includes(search.toLowerCase()) ||
            item.figurativeMeaning.toLowerCase().includes(search.toLowerCase()),
        );
        return HttpResponse.json(
          { items: all, total: all.length, page: 1, pageSize: 20 },
          { status: 200 },
        );
      }),
    );

    renderWithProviders(<ChengyuPage />, { route: "/learn/chengyu" });
    await waitFor(() => expect(screen.getByText("破釜沉舟")).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(SEARCH_LABEL), { target: { value: "叶公好龙" } });

    // Debounce (500ms) → refetch with ?search=叶公好龙 → only 叶公好龙 remains.
    // Waiting for 破釜沉舟 to DISAPPEAR proves the debounced refetch completed.
    await waitFor(() => expect(screen.queryByText("破釜沉舟")).not.toBeInTheDocument(), {
      timeout: 2000,
    });
    expect(screen.getByText("叶公好龙")).toBeInTheDocument();
  });

  it("renders the empty state when no idioms match", async () => {
    server.use(...chengyuHandlers.empty());

    renderWithProviders(<ChengyuPage />, { route: "/learn/chengyu" });

    await waitFor(() => expect(screen.getByText("No idioms found")).toBeInTheDocument());
  });

  it("renders the error state with a working retry", async () => {
    server.use(...chengyuHandlers.error());

    renderWithProviders(<ChengyuPage />, { route: "/learn/chengyu" });

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Failed to load chengyu idioms" }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText("Try Again")).toBeInTheDocument();

    // Retry after switching to the populated handlers → data loads
    server.use(...chengyuHandlers.default());
    fireEvent.click(screen.getByText("Try Again"));

    await waitFor(() => expect(screen.getByText("破釜沉舟")).toBeInTheDocument());
  });
});
