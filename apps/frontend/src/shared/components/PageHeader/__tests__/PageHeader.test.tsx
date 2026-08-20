/**
 * Unit tests for PageHeader
 *
 * Verifies the header contract: single <h1>, optional eyebrow/description,
 * and the top-right CTA slot.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHeader } from "../PageHeader";

describe("PageHeader", () => {
  it("renders the title as the page's single h1", () => {
    render(<PageHeader title="Dashboard" />);
    const heading = screen.getByRole("heading", { level: 1, name: "Dashboard" });
    expect(heading).toBeInTheDocument();
  });

  it("renders the eyebrow above the title", () => {
    render(<PageHeader title="Welcome back" eyebrow="Phase 2 · The Core 300" />);
    expect(screen.getByText("Phase 2 · The Core 300")).toBeInTheDocument();
  });

  it("renders the description below the title", () => {
    render(<PageHeader title="Welcome to PinyinPal!" description="Start learning Mandarin" />);
    expect(screen.getByText("Start learning Mandarin")).toBeInTheDocument();
  });

  it("renders children in the top-right CTA slot", () => {
    render(
      <PageHeader title="Welcome back">
        <button type="button">Continue Learning ▸</button>
      </PageHeader>,
    );
    expect(screen.getByRole("button", { name: /continue learning/i })).toBeInTheDocument();
  });

  it("omits eyebrow/description/CTA when not provided", () => {
    render(<PageHeader title="Dashboard" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getAllByRole("heading")).toHaveLength(1);
  });
});
