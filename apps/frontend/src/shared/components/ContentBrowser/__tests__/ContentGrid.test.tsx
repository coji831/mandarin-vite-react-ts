/**
 * ContentGrid Component Tests
 * Story 17.7: Content Browser Infrastructure.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ContentGrid } from "../ContentGrid";
import type { ContentItem } from "../types";

describe("ContentGrid", () => {
  const createItems = (count: number): ContentItem[] =>
    Array.from({ length: count }, (_, i) => ({
      id: `item-${i + 1}`,
      contentType: "vocabulary" as const,
      title: `Word ${i + 1}`,
      subtitle: `pinyin ${i + 1}`,
      translation: `Translation ${i + 1}`,
      hskLevel: 1,
      phase: 1,
      isLocked: false,
    }));

  it("renders items", () => {
    const items = createItems(3);
    render(<ContentGrid items={items} total={3} page={1} pageSize={10} onPageChange={() => {}} />);

    expect(screen.getByText("Word 1")).toBeInTheDocument();
    expect(screen.getByText("Word 2")).toBeInTheDocument();
    expect(screen.getByText("Word 3")).toBeInTheDocument();
  });

  it("shows empty state when no items", () => {
    render(<ContentGrid items={[]} total={0} page={1} pageSize={10} onPageChange={() => {}} />);

    expect(screen.getByText(/no content found/i)).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(
      <ContentGrid
        items={[]}
        total={0}
        page={1}
        pageSize={10}
        onPageChange={() => {}}
        isLoading={true}
      />,
    );

    expect(screen.getByText(/loading content/i)).toBeInTheDocument();
  });

  it("shows pagination when multiple pages", () => {
    const items = createItems(10);
    render(<ContentGrid items={items} total={25} page={1} pageSize={10} onPageChange={() => {}} />);

    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(screen.getByLabelText("Next page")).toBeInTheDocument();
    expect(screen.getByLabelText("Previous page")).toBeInTheDocument();
  });

  it("calls onPageChange on next button click", () => {
    const handlePageChange = vi.fn();
    render(
      <ContentGrid
        items={createItems(10)}
        total={25}
        page={1}
        pageSize={10}
        onPageChange={handlePageChange}
      />,
    );

    fireEvent.click(screen.getByLabelText("Next page"));
    expect(handlePageChange).toHaveBeenCalledWith(2);
  });

  it("calls onPageChange on prev button click", () => {
    const handlePageChange = vi.fn();
    render(
      <ContentGrid
        items={createItems(10)}
        total={25}
        page={2}
        pageSize={10}
        onPageChange={handlePageChange}
      />,
    );

    fireEvent.click(screen.getByLabelText("Previous page"));
    expect(handlePageChange).toHaveBeenCalledWith(1);
  });

  it("disables prev button on first page", () => {
    render(
      <ContentGrid
        items={createItems(10)}
        total={25}
        page={1}
        pageSize={10}
        onPageChange={() => {}}
      />,
    );

    expect(screen.getByLabelText("Previous page")).toBeDisabled();
  });

  it("disables next button on last page", () => {
    render(
      <ContentGrid
        items={createItems(10)}
        total={25}
        page={3}
        pageSize={10}
        onPageChange={() => {}}
      />,
    );

    expect(screen.getByLabelText("Next page")).toBeDisabled();
  });

  it("shows results info", () => {
    render(
      <ContentGrid
        items={createItems(10)}
        total={25}
        page={1}
        pageSize={10}
        onPageChange={() => {}}
      />,
    );

    expect(screen.getByText(/Showing 1–10 of 25/)).toBeInTheDocument();
  });
});
