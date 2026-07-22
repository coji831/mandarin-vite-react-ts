/**
 * @file HubReadings.test.tsx
 * @description Tests for HubReadings component
 * Story 18.5: Character Detail Hub (Phase 1 Minimal)
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { HubReadings } from "../../HubReadings/HubReadings";
import type { ReadingInfo } from "../../HubReadings/HubReadings";

// Mock the audio playback hook
vi.mock("shared/hooks", () => ({
  useAudioPlayback: () => ({
    playWordAudio: vi.fn(),
  }),
}));

// Mock Skeleton component
vi.mock("shared/components", () => ({
  Skeleton: ({ variant, height, width }: { variant: string; height?: string; width?: string }) => (
    <div data-testid="skeleton" data-variant={variant} style={{ height, width }} />
  ),
  Button: ({ children, onClick, className, ...props }: Record<string, unknown>) => (
    <button onClick={onClick as () => void} className={className as string} {...props}>
      {children as React.ReactNode}
    </button>
  ),
}));

const mockReadings: ReadingInfo[] = [
  { pinyin: "hǎo", tone: 3, type: "adj", coreMeaning: "good" },
  { pinyin: "hào", tone: 4, type: "verb", coreMeaning: "to like" },
];

describe("HubReadings", () => {
  it("renders loading skeleton when loading is true", () => {
    render(<HubReadings loading={true} />);

    const skeletons = screen.getAllByTestId("skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByLabelText("Loading readings")).toBeInTheDocument();
  });

  it("renders null when readings are empty", () => {
    const { container } = render(<HubReadings glyph="好" readings={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders null when readings are undefined", () => {
    const { container } = render(<HubReadings glyph="好" readings={undefined} loading={false} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders readings list with pinyin and meanings", () => {
    render(<HubReadings glyph="好" readings={mockReadings} />);

    expect(screen.getByText("hǎo")).toBeInTheDocument();
    expect(screen.getByText("good")).toBeInTheDocument();
    expect(screen.getByText("hào")).toBeInTheDocument();
    expect(screen.getByText("to like")).toBeInTheDocument();
  });

  it("renders frequency rank when provided", () => {
    render(<HubReadings glyph="好" readings={mockReadings} frequencyRank={42} />);

    expect(screen.getByText("Frequency rank: #42")).toBeInTheDocument();
  });
});
