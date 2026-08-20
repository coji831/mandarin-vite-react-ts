/**
 * @file components/ClassificationBadge.test.tsx
 * @description Tests for ClassificationBadge — shared pill badge for character classification types
 * Story 21.15: Pictograph Classification Badges
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ClassificationBadge } from "./ClassificationBadge";

describe("ClassificationBadge", () => {
  describe("renders each classification type with correct icon + label", () => {
    it("renders pictograph badge", () => {
      const { container } = render(<ClassificationBadge classification="pictograph" />);
      expect(container.querySelector("svg")).toBeInTheDocument();
      expect(screen.getByText("Pictograph")).toBeInTheDocument();
    });

    it("renders phono_semantic badge", () => {
      const { container } = render(<ClassificationBadge classification="phono_semantic" />);
      expect(container.querySelector("svg")).toBeInTheDocument();
      expect(screen.getByText("Phono-semantic")).toBeInTheDocument();
    });

    it("renders compound_ideograph badge", () => {
      const { container } = render(<ClassificationBadge classification="compound_ideograph" />);
      expect(container.querySelector("svg")).toBeInTheDocument();
      expect(screen.getByText("Compound ideograph")).toBeInTheDocument();
    });

    it("renders ideograph badge", () => {
      const { container } = render(<ClassificationBadge classification="ideograph" />);
      expect(container.querySelector("svg")).toBeInTheDocument();
      expect(screen.getByText("Simple ideograph")).toBeInTheDocument();
    });
  });

  describe("handles null, undefined, and unknown gracefully", () => {
    it("returns null for null classification", () => {
      const { container } = render(<ClassificationBadge classification={null} />);
      expect(container.innerHTML).toBe("");
    });

    it("returns null for undefined classification", () => {
      const { container } = render(<ClassificationBadge classification={undefined} />);
      expect(container.innerHTML).toBe("");
    });

    it("returns null for unknown classification value", () => {
      const { container } = render(<ClassificationBadge classification="unknown_type" />);
      expect(container.innerHTML).toBe("");
    });
  });

  it("has aria-label attribute", () => {
    render(<ClassificationBadge classification="pictograph" />);
    const badge = screen.getByRole("status");
    expect(badge).toHaveAttribute("aria-label", "Classification: Pictograph");
  });

  describe("title attribute", () => {
    it("uses etymology for pictograph classification", () => {
      render(
        <ClassificationBadge classification="pictograph" etymology="Depicts a sun in the sky" />,
      );
      const badge = screen.getByRole("status");
      expect(badge).toHaveAttribute("title", "Depicts a sun in the sky");
    });

    it("uses generic description when no etymology", () => {
      render(<ClassificationBadge classification="pictograph" />);
      const badge = screen.getByRole("status");
      expect(badge).toHaveAttribute("title", "This character is a pictograph");
    });

    it("uses generic description for non-pictograph classifications", () => {
      render(<ClassificationBadge classification="phono_semantic" />);
      const badge = screen.getByRole("status");
      expect(badge).toHaveAttribute("title", "This character is a phono-semantic");
    });
  });

  describe("size variants apply correct CSS classes", () => {
    it("renders sm size by default", () => {
      render(<ClassificationBadge classification="pictograph" />);
      const badge = screen.getByRole("status");
      expect(badge.className).toContain("classification-badge--sm");
    });

    it("renders md size", () => {
      render(<ClassificationBadge classification="pictograph" size="md" />);
      const badge = screen.getByRole("status");
      expect(badge.className).toContain("classification-badge--md");
    });

    it("renders lg size", () => {
      render(<ClassificationBadge classification="pictograph" size="lg" />);
      const badge = screen.getByRole("status");
      expect(badge.className).toContain("classification-badge--lg");
    });
  });

  it("hides label when showLabel is false", () => {
    const { container } = render(
      <ClassificationBadge classification="pictograph" showLabel={false} />,
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(screen.queryByText("Pictograph")).not.toBeInTheDocument();
  });
});
