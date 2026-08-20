/**
 * Unit tests for Icon
 *
 * Verifies the ADR-010 contract: renders the mapped Lucide icon, default
 * aria-hidden (decorative), role="img" + <title> when meaningful, and the
 * name→component mapping / isIconName guard.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Icon, isIconName, ICON_MAP } from "../Icon";

describe("Icon", () => {
  it("renders an svg for a mapped name", () => {
    const { container } = render(<Icon name="dashboard" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("defaults to decorative (aria-hidden) when no label", () => {
    const { container } = render(<Icon name="lock" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).not.toHaveAttribute("role");
  });

  it("renders role=img + <title> when meaningful (label provided)", () => {
    const { container } = render(<Icon name="search" label="Search" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("role", "img");
    expect(svg).not.toHaveAttribute("aria-hidden");
    expect(svg!.querySelector("title")?.textContent).toBe("Search");
  });

  it("applies default strokeWidth 1.5", () => {
    const { container } = render(<Icon name="star" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("stroke-width", "1.5");
  });

  it("applies size from the sanctioned range", () => {
    const { container } = render(<Icon name="play" size={16} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "16");
  });

  it("accepts an explicit aria-hidden override with a label", () => {
    const { container } = render(<Icon name="lock" label="Locked" aria-hidden />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("maps every IconName to a Lucide component", () => {
    const names = Object.keys(ICON_MAP);
    expect(names.length).toBeGreaterThanOrEqual(20);
    for (const name of names) {
      expect(isIconName(name)).toBe(true);
      expect(ICON_MAP[name as keyof typeof ICON_MAP]).toBeTypeOf("object");
    }
  });

  it("isIconName rejects unmapped strings", () => {
    expect(isIconName("🏠")).toBe(false);
    expect(isIconName("not-an-icon")).toBe(false);
  });
});
