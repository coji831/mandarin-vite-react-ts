/**
 * @file HubInfoLine.test.tsx
 * @description Tests for HubInfoLine component
 * Story 18.5: Character Detail Hub (Phase 1 Minimal)
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { HubInfoLine } from "../HubInfoLine";

describe("HubInfoLine", () => {
  it("renders character and pinyin", () => {
    render(<HubInfoLine character="好" pinyin="hǎo" />);

    expect(screen.getByText("好")).toBeInTheDocument();
    expect(screen.getByText("(hǎo)")).toBeInTheDocument();
    expect(screen.getByText("HSK level coming soon")).toBeInTheDocument();
  });

  it("renders placeholder when pinyin is null", () => {
    render(<HubInfoLine character="好" pinyin={null} />);

    expect(screen.getByText("(...)")).toBeInTheDocument();
  });

  it('renders "HSK level coming soon" text', () => {
    render(<HubInfoLine character="好" pinyin="hǎo" />);

    expect(screen.getByText("HSK level coming soon")).toBeInTheDocument();
  });
});
