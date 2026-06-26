/**
 * @file components/FilterBar.test.tsx
 * @description Unit tests for FilterBar component
 * Story 19.1: Radicals Browser Structure
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FilterBar } from "./FilterBar";
import type { RadicalFilter } from "../types";

// Mock the shared Dropdown component
vi.mock("shared/components", () => ({
  Dropdown: ({
    value,
    onChange,
    options,
    label,
    id,
  }: {
    value: unknown;
    onChange: (val: unknown) => void;
    options: Array<{ value: unknown; label: string }>;
    label?: string;
    id?: string;
  }) => (
    <div data-testid={`dropdown-${id ?? label}`}>
      <span>{label}</span>
      <select
        aria-label={label}
        id={id}
        value={String(value ?? "")}
        onChange={(e) => {
          const option = options.find((o) => String(o.value) === e.target.value);
          onChange(option?.value ?? null);
        }}
      >
        {options.map((opt) => (
          <option key={String(opt.value)} value={String(opt.value)}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  ),
}));

const defaultFilter: RadicalFilter = {
  search: "",
  strokeCount: null,
  showTop20Only: false,
  sortBy: "kangxi_index",
};

describe("FilterBar", () => {
  it("renders all filter controls", () => {
    render(<FilterBar filter={defaultFilter} onFilterChange={vi.fn()} onReset={vi.fn()} />);

    expect(screen.getByLabelText("Search")).toBeInTheDocument();
    expect(screen.getByLabelText("Stroke count")).toBeInTheDocument();
    expect(screen.getByLabelText("Sort by")).toBeInTheDocument();
    expect(screen.getByLabelText("Reset all filters")).toBeInTheDocument();
    expect(screen.getByLabelText("Show only top 20 recommended radicals")).toBeInTheDocument();
  });

  it("renders search input with correct value", () => {
    const filter = { ...defaultFilter, search: "water" };
    render(<FilterBar filter={filter} onFilterChange={vi.fn()} onReset={vi.fn()} />);

    const searchInput = screen.getByLabelText("Search") as HTMLInputElement;
    expect(searchInput.value).toBe("water");
  });

  it("calls onFilterChange when search input changes", () => {
    const handleChange = vi.fn();
    render(<FilterBar filter={defaultFilter} onFilterChange={handleChange} onReset={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Search"), {
      target: { value: "fire" },
    });

    expect(handleChange).toHaveBeenCalledWith({ search: "fire" });
  });

  it("renders stroke count dropdown with all options", () => {
    render(<FilterBar filter={defaultFilter} onFilterChange={vi.fn()} onReset={vi.fn()} />);

    const strokeDropdown = screen.getByLabelText("Stroke count");
    expect(strokeDropdown).toBeInTheDocument();

    // Should have "All strokes" + 17 stroke count options
    const options = strokeDropdown.querySelectorAll("option");
    expect(options.length).toBe(18); // "All strokes" + 1..17
    expect(options[0]).toHaveTextContent("All strokes");
    expect(options[1]).toHaveTextContent("1 stroke");
    expect(options[17]).toHaveTextContent("17 +");
  });

  it("calls onFilterChange when stroke count dropdown changes", () => {
    const handleChange = vi.fn();
    render(<FilterBar filter={defaultFilter} onFilterChange={handleChange} onReset={vi.fn()} />);

    const strokeDropdown = screen.getByLabelText("Stroke count");
    fireEvent.change(strokeDropdown, { target: { value: "3" } });

    expect(handleChange).toHaveBeenCalledWith({ strokeCount: 3 });
  });

  it("renders sort dropdown with all sort options", () => {
    render(<FilterBar filter={defaultFilter} onFilterChange={vi.fn()} onReset={vi.fn()} />);

    const sortDropdown = screen.getByLabelText("Sort by");
    expect(sortDropdown).toBeInTheDocument();

    const options = sortDropdown.querySelectorAll("option");
    expect(options).toHaveLength(4);
    expect(options[0]).toHaveTextContent("Kangxi Index");
    expect(options[1]).toHaveTextContent("Stroke Count ↑");
    expect(options[2]).toHaveTextContent("Stroke Count ↓");
    expect(options[3]).toHaveTextContent("Meaning (A–Z)");
  });

  it("calls onFilterChange when sort dropdown changes", () => {
    const handleChange = vi.fn();
    render(<FilterBar filter={defaultFilter} onFilterChange={handleChange} onReset={vi.fn()} />);

    const sortDropdown = screen.getByLabelText("Sort by");
    fireEvent.change(sortDropdown, { target: { value: "meaning" } });

    expect(handleChange).toHaveBeenCalledWith({ sortBy: "meaning" });
  });

  it("renders top-20 toggle switch with correct aria-checked state", () => {
    const { rerender } = render(
      <FilterBar filter={defaultFilter} onFilterChange={vi.fn()} onReset={vi.fn()} />,
    );

    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveAttribute("aria-checked", "false");

    rerender(
      <FilterBar
        filter={{ ...defaultFilter, showTop20Only: true }}
        onFilterChange={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("calls onFilterChange when top-20 toggle is clicked", () => {
    const handleChange = vi.fn();
    render(<FilterBar filter={defaultFilter} onFilterChange={handleChange} onReset={vi.fn()} />);

    fireEvent.click(screen.getByRole("switch"));
    expect(handleChange).toHaveBeenCalledWith({ showTop20Only: true });
  });

  it("calls onFilterChange when top-20 toggle is activated with Enter key", () => {
    const handleChange = vi.fn();
    render(<FilterBar filter={defaultFilter} onFilterChange={handleChange} onReset={vi.fn()} />);

    const toggle = screen.getByRole("switch");
    fireEvent.keyDown(toggle, { key: "Enter" });

    expect(handleChange).toHaveBeenCalledWith({ showTop20Only: true });
  });

  it("calls onFilterChange when top-20 toggle is activated with Space key", () => {
    const handleChange = vi.fn();
    render(<FilterBar filter={defaultFilter} onFilterChange={handleChange} onReset={vi.fn()} />);

    const toggle = screen.getByRole("switch");
    fireEvent.keyDown(toggle, { key: " " });

    expect(handleChange).toHaveBeenCalledWith({ showTop20Only: true });
  });

  it("calls onReset when reset button is clicked", () => {
    const handleReset = vi.fn();
    render(<FilterBar filter={defaultFilter} onFilterChange={vi.fn()} onReset={handleReset} />);

    fireEvent.click(screen.getByLabelText("Reset all filters"));
    expect(handleReset).toHaveBeenCalledTimes(1);
  });

  it("displays top-20 toggle with descriptive text", () => {
    render(<FilterBar filter={defaultFilter} onFilterChange={vi.fn()} onReset={vi.fn()} />);

    expect(screen.getByText("Show top 20 only")).toBeInTheDocument();
  });

  it("has search input with correct placeholder", () => {
    render(<FilterBar filter={defaultFilter} onFilterChange={vi.fn()} onReset={vi.fn()} />);

    const searchInput = screen.getByLabelText("Search");
    expect(searchInput).toHaveAttribute("placeholder", "Search by pinyin, meaning, or glyph…");
  });
});
