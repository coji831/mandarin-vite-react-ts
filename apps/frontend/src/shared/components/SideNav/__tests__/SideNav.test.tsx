/**
 * @file shared/components/SideNav/__tests__/SideNav.test.tsx
 * @description Tests for SideNav — nav-only (auth-free), phase-gated Learn
 * group, and desktop collapsed rail. Story 22.4.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import type { SideNavProps } from "../SideNav";
import { SideNav } from "../SideNav";
import { LEARN_NAV_ITEMS, LEARN_REQUIRED_PHASE } from "shared/constants";

const navItems: SideNavProps["navItems"] = [
  { path: "/", label: "Dashboard", icon: "🏠", exact: true },
  { path: "/learn", label: "Learn", icon: "📚", exact: false, children: LEARN_NAV_ITEMS },
  { path: "/practices", label: "Practices", icon: "🎯", exact: false },
];

function renderSideNav(props: Partial<SideNavProps> = {}) {
  const merged: SideNavProps = {
    navItems,
    currentPath: "/",
    phaseGate: 4,
    requiredPhase: (id) => LEARN_REQUIRED_PHASE[id] ?? 1,
    onToggleCollapse: () => {},
    ...props,
  };
  return render(
    <MemoryRouter initialEntries={[merged.currentPath]}>
      <SideNav {...merged} />
    </MemoryRouter>,
  );
}

/** Renders the current router path so tests can assert (non-)navigation. */
function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

describe("SideNav", () => {
  it("renders the top-level nav links", () => {
    renderSideNav();
    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Dashboard/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Practices/ })).toBeInTheDocument();
  });

  it("renders the Learn group children when expanded", () => {
    renderSideNav({ currentPath: "/learn/grammar" });
    expect(screen.getByRole("link", { name: /Grammar/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Foundations/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Chengyu/ })).toBeInTheDocument();
  });

  it("collapses the Learn children when the group header is toggled", () => {
    renderSideNav();
    const header = screen.getByRole("button", { name: /Learn/ });
    fireEvent.click(header);
    expect(screen.queryByRole("link", { name: /Grammar/ })).not.toBeInTheDocument();
  });

  describe("phase gating", () => {
    it("marks children above the phase gate as locked with a lock indicator", () => {
      renderSideNav({ currentPath: "/learn/foundations", phaseGate: 1 });
      const grammar = screen.getByRole("link", { name: /Grammar/ });
      expect(grammar).toHaveAttribute("aria-disabled", "true");
      expect(grammar).toHaveAttribute("title", "Complete Phase 2 to unlock");
      expect(grammar).toHaveAttribute("tabindex", "-1");
      expect(within(grammar).getByLabelText("locked")).toBeInTheDocument();
    });

    it("keeps locked children non-navigable (click does not navigate)", () => {
      render(
        <MemoryRouter initialEntries={["/learn/foundations"]}>
          <SideNav
            navItems={navItems}
            currentPath="/learn/foundations"
            phaseGate={1}
            requiredPhase={(id) => LEARN_REQUIRED_PHASE[id] ?? 1}
          />
          <LocationProbe />
        </MemoryRouter>,
      );
      const grammar = screen.getByRole("link", { name: /Grammar/ });
      expect(grammar).toHaveAttribute("aria-disabled", "true");
      fireEvent.click(grammar);
      expect(screen.getByTestId("location")).toHaveTextContent("/learn/foundations");
    });

    it("keeps unlocked children navigable (real href, no lock)", () => {
      renderSideNav({ currentPath: "/learn/foundations", phaseGate: 1 });
      const foundations = screen.getByRole("link", { name: /Foundations/ });
      expect(foundations).not.toHaveAttribute("aria-disabled");
      expect(foundations).not.toHaveAttribute("tabindex");
      expect(foundations).toHaveAttribute("href", "/learn/foundations");
    });
  });

  describe("collapsed rail", () => {
    it("hides Learn children and labels in rail mode", () => {
      renderSideNav({ collapsed: true });
      expect(screen.queryByRole("link", { name: /Grammar/ })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeInTheDocument();
    });

    it("marks the collapsed group header current and titles it with the active child", () => {
      const { container } = renderSideNav({ currentPath: "/learn/grammar", collapsed: true });
      // Collapsed rail renders the group header as a static div (not a button).
      const header = container.querySelector(".side-nav__group-header");
      expect(header).toHaveAttribute("aria-current", "page");
      expect(header).toHaveAttribute("title", "Learn — Grammar");
      // Children are unmounted in rail mode — the active child is only
      // recoverable via the header's title tooltip.
      expect(screen.queryByRole("link", { name: /Grammar/ })).not.toBeInTheDocument();
    });

    it("calls onToggleCollapse when the collapse toggle is clicked", () => {
      const onToggleCollapse = vi.fn();
      renderSideNav({ onToggleCollapse });
      fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));
      expect(onToggleCollapse).toHaveBeenCalled();
    });
  });

  describe("bottom collapse toggle (footer slot)", () => {
    it("shows the icon + Collapse label when expanded", () => {
      renderSideNav();
      const toggle = screen.getByRole("button", { name: "Collapse sidebar" });
      expect(toggle).toHaveAttribute("aria-expanded", "true");
      expect(within(toggle).getByText("Collapse")).toBeInTheDocument();
      expect(within(toggle).getByText("◂")).toBeInTheDocument();
    });

    it("shows an icon-only toggle (no label) when collapsed", () => {
      renderSideNav({ collapsed: true });
      const toggle = screen.getByRole("button", { name: "Expand sidebar" });
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      expect(within(toggle).getByText("▸")).toBeInTheDocument();
      expect(within(toggle).queryByText("Collapse")).not.toBeInTheDocument();
    });
  });

  describe("child hierarchy", () => {
    it('marks the active child with aria-current="page"', () => {
      renderSideNav({ currentPath: "/learn/grammar" });
      const grammar = screen.getByRole("link", { name: /Grammar/ });
      expect(grammar).toHaveAttribute("aria-current", "page");
    });

    it('marks the Learn group header current when a child is active (expanded)', () => {
      renderSideNav({ currentPath: "/learn/grammar" });
      const header = screen.getByRole("button", { name: /Learn/ });
      expect(header).toHaveAttribute("aria-current", "page");
      const grammar = screen.getByRole("link", { name: /Grammar/ });
      expect(grammar).toHaveAttribute("aria-current", "page");
    });

    it("does not mark the Learn group header current on unrelated routes", () => {
      renderSideNav({ currentPath: "/library" });
      const header = screen.getByRole("button", { name: /Learn/ });
      expect(header).not.toHaveAttribute("aria-current");
    });

    it("dims locked children (locked class) and does not mark them current", () => {
      renderSideNav({ currentPath: "/learn/foundations", phaseGate: 1 });
      const grammar = screen.getByRole("link", { name: /Grammar/ });
      expect(grammar).toHaveClass("side-nav__child--locked");
      expect(grammar).toHaveAttribute("aria-disabled", "true");
      expect(grammar).not.toHaveAttribute("aria-current");
      // The unlocked, active Foundations child is NOT dimmed and IS current.
      const foundations = screen.getByRole("link", { name: /Foundations/ });
      expect(foundations).not.toHaveClass("side-nav__child--locked");
      expect(foundations).toHaveAttribute("aria-current", "page");
    });

    it("keeps a deep-linked locked child dimmed (no active pill) even when aria-current is set", () => {
      // Deep-link to a locked URL: Grammar (Phase 2) at phaseGate 1. NavLink
      // auto-sets aria-current="page" on the matching URL, but the locked guard
      // must keep it dimmed — no ACTIVE_LINK_CLASS pill classes. The CSS
      // `:not(.side-nav__child--locked)` guard backs this up in real styles.
      renderSideNav({ currentPath: "/learn/grammar", phaseGate: 1 });
      const grammar = screen.getByRole("link", { name: /Grammar/ });
      expect(grammar).toHaveAttribute("aria-current", "page");
      expect(grammar).toHaveClass("side-nav__child--locked");
      expect(grammar).not.toHaveClass("bg-primary-bg");
      expect(grammar).not.toHaveClass("fw-600");
    });
  });
});
