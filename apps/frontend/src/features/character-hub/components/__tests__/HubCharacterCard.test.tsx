/**
 * @file HubCharacterCard.test.tsx
 * @description Tests for HubCharacterCard component
 * Story 18.5: Character Detail Hub (Phase 1 Minimal)
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { HubCharacterCard } from "../HubCharacterCard";

// Mock the CharacterStrokePlayer to avoid hanzi-writer dependency
vi.mock("shared/components/CharacterStroke", () => ({
  CharacterStrokePlayer: ({ character, mode }: { character: string; mode: string }) => (
    <div data-testid="character-stroke-player" data-character={character} data-mode={mode} />
  ),
}));

// Mock Skeleton component
vi.mock("shared/components", () => ({
  Skeleton: ({ variant, className }: { variant: string; className: string }) => (
    <div data-testid="skeleton" data-variant={variant} className={className} />
  ),
  CharacterStrokePlayer: ({ character, mode }: { character: string; mode: string }) => (
    <div data-testid="character-stroke-player" data-character={character} data-mode={mode} />
  ),
}));

describe("HubCharacterCard", () => {
  it("renders loading skeleton when loading is true", () => {
    render(<HubCharacterCard character="好" loading={true} />);

    // Should show skeleton elements
    const skeletons = screen.getAllByTestId("skeleton");
    expect(skeletons.length).toBe(4); // 1 canvas skeleton + 3 control skeletons

    // Should have role="status" for accessibility
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByLabelText("Loading character")).toBeInTheDocument();
  });

  it("renders loaded state with CharacterStrokePlayer", () => {
    render(<HubCharacterCard character="好" loading={false} />);

    // CharacterStrokePlayer should be rendered
    const player = screen.getByTestId("character-stroke-player");
    expect(player).toBeInTheDocument();
    expect(player).toHaveAttribute("data-character", "好");
    expect(player).toHaveAttribute("data-mode", "mini");

    // Should have region role for accessibility
    expect(screen.getByRole("region")).toBeInTheDocument();
    expect(screen.getByLabelText("Stroke animation for 好")).toBeInTheDocument();
  });

  it("renders loaded state when loading is undefined (default)", () => {
    render(<HubCharacterCard character="水" />);

    const player = screen.getByTestId("character-stroke-player");
    expect(player).toBeInTheDocument();
    expect(player).toHaveAttribute("data-character", "水");
  });
});
