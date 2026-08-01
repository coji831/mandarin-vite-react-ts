/**
 * @file pages/learn/phonetic-clusters/PhoneticClustersPage.test.tsx
 * @description Smoke test for PhoneticClustersPage
 * Story 21.6: Phonetic Clusters
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PhoneticClustersPage } from "./PhoneticClustersPage";

// ─── Mock the hook ───────────────────────────────────────────────────
// Mock the hook inside the feature barrel only
vi.mock("features/phonetic-clusters", async (importOriginal) => {
  const actual = await importOriginal<typeof import("features/phonetic-clusters")>();
  return {
    ...actual,
    usePhoneticClusters: vi.fn(),
  };
});

import { usePhoneticClusters } from "features/phonetic-clusters";

describe("PhoneticClustersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page title and description", () => {
    vi.mocked(usePhoneticClusters).mockReturnValue({
      clusters: [],
      isLoading: true,
      error: null,
      hskFilter: null,
      setHskFilter: vi.fn(),
      retry: vi.fn(),
    });

    render(
      <MemoryRouter>
        <PhoneticClustersPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Phonetic Clusters")).toBeInTheDocument();
    expect(screen.getByText("Characters grouped by shared phonetic elements")).toBeInTheDocument();
  });

  it("renders loading state", () => {
    vi.mocked(usePhoneticClusters).mockReturnValue({
      clusters: [],
      isLoading: true,
      error: null,
      hskFilter: null,
      setHskFilter: vi.fn(),
      retry: vi.fn(),
    });

    render(
      <MemoryRouter>
        <PhoneticClustersPage />
      </MemoryRouter>,
    );

    const skeletons = document.querySelectorAll(".skeleton-loading");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders populated state", () => {
    vi.mocked(usePhoneticClusters).mockReturnValue({
      clusters: [
        {
          id: "pc_0001",
          phoneticPattern: "青",
          pinyin: "qīng",
          description: "Characters containing 青",
          pronunciationNote: null,
          memberCount: 1,
          hskLevels: [1],
          members: [{ glyph: "请", pinyin: "qǐng", meaning: "please", hskLevel: 1 }],
        },
      ],
      isLoading: false,
      error: null,
      hskFilter: null,
      setHskFilter: vi.fn(),
      retry: vi.fn(),
    });

    render(
      <MemoryRouter>
        <PhoneticClustersPage />
      </MemoryRouter>,
    );

    // Cluster cards are collapsed by default (VisFix W6a) — the pattern glyph
    // and member count are visible without expanding.
    expect(screen.getByText("青")).toBeInTheDocument();
    expect(screen.getByText("1 member")).toBeInTheDocument();

    // Expand the card to reveal the member character chips.
    fireEvent.click(screen.getByRole("button", { name: /青/ }));
    expect(screen.getByText("请")).toBeInTheDocument();
  });
});
