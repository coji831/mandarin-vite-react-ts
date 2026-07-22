/**
 * @file renderMarkdown.test.tsx
 * @description Tests for renderMarkdown utility
 * Story 20.2: Mnemonic Display UI
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { renderMarkdown } from "../../../utils/renderMarkdown";

describe("renderMarkdown", () => {
  it("renders plain text unchanged", () => {
    const result = renderMarkdown("A simple story without markdown.");
    const { container } = render(<>{result}</>);
    expect(container.textContent).toBe("A simple story without markdown.");
  });

  it("renders **bold** text as <strong>", () => {
    const result = renderMarkdown("Character: **江** (jiāng)");
    const { container } = render(<>{result}</>);
    expect(container.innerHTML).toContain("<strong>江</strong>");
  });

  it("renders multiple bold segments", () => {
    const result = renderMarkdown("**氵** (water) + **工** (work)");
    const { container } = render(<>{result}</>);
    const strongs = container.querySelectorAll("strong");
    expect(strongs).toHaveLength(2);
    expect(strongs[0].textContent).toBe("氵");
    expect(strongs[1].textContent).toBe("工");
  });

  it("handles newlines with <br>", () => {
    const result = renderMarkdown("Line one.\nLine two.");
    const { container } = render(<>{result}</>);
    const br = container.querySelectorAll("br");
    expect(br.length).toBeGreaterThanOrEqual(1);
  });

  it("handles mixed content: bold + newlines", () => {
    const story = "Character: **江** (jiāng)\nComponents: **氵** + **工**";
    const result = renderMarkdown(story);
    const { container } = render(<>{result}</>);
    expect(container.querySelectorAll("strong").length).toBeGreaterThanOrEqual(2);
    expect(container.querySelectorAll("br").length).toBeGreaterThanOrEqual(1);
  });

  it("handles empty string", () => {
    const result = renderMarkdown("");
    const { container } = render(<>{result}</>);
    expect(container.textContent).toBe("");
  });

  it("handles string with no markdown syntax", () => {
    const result = renderMarkdown("Just some regular text with no special formatting.");
    const { container } = render(<>{result}</>);
    const strongs = container.querySelectorAll("strong");
    expect(strongs).toHaveLength(0);
  });
});
