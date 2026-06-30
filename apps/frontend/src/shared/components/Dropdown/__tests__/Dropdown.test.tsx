import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Dropdown } from "../Dropdown";

describe("Dropdown Component", () => {
  const options = [
    { value: null, label: "All strokes" },
    { value: 1, label: "1 stroke" },
    { value: 3, label: "3 strokes" },
  ];

  it("renders with placeholder when no value selected", () => {
    render(
      <Dropdown value={null} onChange={() => {}} options={options} placeholder="All strokes" />,
    );
    expect(screen.getByText("All strokes")).toBeInTheDocument();
  });

  it("renders selected value label", () => {
    render(<Dropdown value={3} onChange={() => {}} options={options} />);
    expect(screen.getByText("3 strokes")).toBeInTheDocument();
  });

  it("opens menu on trigger click", () => {
    render(<Dropdown value={null} onChange={() => {}} options={options} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("calls onChange and closes menu on option click", () => {
    const handleChange = vi.fn();
    render(<Dropdown value={null} onChange={handleChange} options={options} />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("3 strokes"));
    expect(handleChange).toHaveBeenCalledWith(3);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("renders with label", () => {
    render(<Dropdown value={null} onChange={() => {}} options={options} label="Stroke count" />);
    expect(screen.getByText("Stroke count")).toBeInTheDocument();
  });

  it("marks selected option with aria-selected", () => {
    render(<Dropdown value={1} onChange={() => {}} options={options} />);
    fireEvent.click(screen.getByRole("button"));
    const selectedOption = screen.getByRole("option", { selected: true });
    expect(selectedOption).toHaveTextContent("1 stroke");
  });
});
