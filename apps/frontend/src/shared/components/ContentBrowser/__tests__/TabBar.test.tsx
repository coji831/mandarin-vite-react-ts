/**
 * TabBar Component Tests
 * Story 17.7: Content Browser Infrastructure.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { TabBar } from "../TabBar";
import { CONTENT_TABS } from "../types";

describe("TabBar", () => {
  it("renders all tabs", () => {
    render(
      <BrowserRouter>
        <TabBar activeTab="all" onTabChange={() => {}} />
      </BrowserRouter>,
    );

    CONTENT_TABS.forEach((tab) => {
      expect(screen.getByText(tab.label)).toBeInTheDocument();
    });
  });

  it("highlights the active tab", () => {
    render(
      <BrowserRouter>
        <TabBar activeTab="foundations" onTabChange={() => {}} />
      </BrowserRouter>,
    );

    const activeTab = screen.getByText("Foundations");
    expect(activeTab.closest("button")).toHaveAttribute("aria-selected", "true");
  });

  it("calls onTabChange on click", () => {
    const handleTabChange = vi.fn();
    render(
      <BrowserRouter>
        <TabBar activeTab="all" onTabChange={handleTabChange} />
      </BrowserRouter>,
    );

    fireEvent.click(screen.getByText("Foundations"));
    expect(handleTabChange).toHaveBeenCalledWith("foundations");
  });

  it("renders custom tabs when provided", () => {
    const customTabs = [
      { id: "all" as const, label: "Everything", icon: "📋" },
      { id: "foundations" as const, label: "Foundations", icon: "🔤" },
    ];

    render(
      <BrowserRouter>
        <TabBar activeTab="all" onTabChange={() => {}} tabs={customTabs} />
      </BrowserRouter>,
    );

    expect(screen.getByText("Everything")).toBeInTheDocument();
    expect(screen.getByText("Words")).toBeInTheDocument();
  });
});
