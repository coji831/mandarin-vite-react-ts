/**
 * @file __tests__/DefinitionList.test.tsx
 * @description Tests for DefinitionList component
 * Story 21.4: Reading UI + LexicalHub Phase 1
 * Story 21.x: Migrated to word-hub feature
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DefinitionList } from "../components/DefinitionList";

describe("DefinitionList", () => {
  it("renders definitions as list items", () => {
    render(<DefinitionList definitions={["good", "fine", "well"]} />);
    expect(screen.getByText("good")).toBeInTheDocument();
    expect(screen.getByText("fine")).toBeInTheDocument();
    expect(screen.getByText("well")).toBeInTheDocument();
  });

  it("renders as ordered list", () => {
    const { container } = render(<DefinitionList definitions={["first", "second"]} />);
    const ol = container.querySelector("ol");
    expect(ol).toBeInTheDocument();
  });

  it("handles empty definitions", () => {
    const { container } = render(<DefinitionList definitions={[]} />);
    const listItems = container.querySelectorAll("li");
    expect(listItems.length).toBe(0);
  });

  it("handles single definition", () => {
    render(<DefinitionList definitions={["only definition"]} />);
    expect(screen.getByText("only definition")).toBeInTheDocument();
  });
});
