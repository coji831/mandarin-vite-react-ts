/**
 * @file shared/components/SideNav/__tests__/SideNav.test.tsx
 * @description Tests for SideNav — nav-only (auth-free), the Learn group,
 * desktop collapsed rail, and the Story 22.5 nav/URL sync.
 *
 * Story 25-3 / A25 inverts the old "phase gating" block: the sidebar holds no
 * user phase, so every Learn item navigates for every visitor (BM-1 §3, L6).
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import type { SideNavProps } from "../SideNav";
import { SideNav } from "../SideNav";
import { LEARN_NAV_ITEMS } from "shared/constants";

const navItems: SideNavProps["navItems"] = [
  { path: "/", label: "Dashboard", icon: "dashboard", exact: true },
  { path: "/learn", label: "Learn", icon: "learn", exact: false, children: LEARN_NAV_ITEMS },
  { path: "/practices", label: "Practices", icon: "practice", exact: false },
];

function renderSideNav(props: Partial<SideNavProps> = {}, entries?: string[]) {
  const merged: SideNavProps = {
    navItems,
    currentPath: "/",
    onToggleCollapse: () => {},
    ...props,
  };
  return render(
    <MemoryRouter initialEntries={entries ?? [merged.currentPath]}>
      <SideNav {...merged} />
    </MemoryRouter>,
  );
}

/** Renders the current router path so tests can assert (non-)navigation. */
function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

/** Renders the full URL (pathname + search) so tests can assert sub-state. */
function UrlProbe() {
  const location = useLocation();
  return <span data-testid="url">{location.pathname + location.search}</span>;
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
    // Story 22.5: the chevron is the accordion toggle (the label navigates).
    const chevron = screen.getByRole("button", { name: /Learn section/ });
    fireEvent.click(chevron);
    expect(screen.queryByRole("link", { name: /Grammar/ })).not.toBeInTheDocument();
  });

  describe("no phase gating (A25 — Learn = no lock; BM-1 §3, L6)", () => {
    /** Full-location harness: `location` mirrors the router so clicks are observable. */
    function renderGuestAt(entry: string) {
      const url = new URL(entry, "http://localhost");
      return render(
        <MemoryRouter initialEntries={[entry]}>
          <SideNav
            navItems={navItems}
            currentPath={url.pathname}
            location={{ pathname: url.pathname, search: url.search }}
          />
          <LocationProbe />
        </MemoryRouter>,
      );
    }

    it("holds no user-phase props — deleted, not renamed (compile-time tripwire)", () => {
      // If a phase prop ever returns, under any name, this literal stops
      // erroring and `tsc -b` fails on the now-unused @ts-expect-error.
      // @ts-expect-error — A25: SideNav must never accept a user phase again.
      const legacyProps: SideNavProps = { navItems, currentPath: "/", phaseGate: 1 };
      expect(legacyProps.currentPath).toBe("/");
    });

    it("navigates to every Learn child at phase 1 (no preventDefault, no aria-disabled, no tabIndex=-1)", () => {
      renderGuestAt("/");

      for (const child of LEARN_NAV_ITEMS) {
        const link = screen.getByRole("link", { name: child.label });
        expect(link).toHaveAttribute("href", child.path);
        expect(link).not.toHaveAttribute("aria-disabled");
        expect(link).not.toHaveAttribute("tabindex");
        fireEvent.click(link);
        // The location actually moved — nothing swallowed the click.
        expect(screen.getByTestId("location")).toHaveTextContent(child.path);
      }
    });

    it("presents phase as tooltip metadata only — never as a permission prompt", () => {
      renderGuestAt("/learn/foundations");

      for (const child of LEARN_NAV_ITEMS) {
        const link = screen.getByRole("link", { name: child.label });
        expect(link).toHaveAttribute("title", `${child.label} · Phase ${child.phase} of 4`);
        const title = link.getAttribute("title") ?? "";
        expect(title).not.toMatch(/unlock|locked|complete .* to|requires|available at/i);
      }
    });

    it("gives a deep-linked phase-ahead child the active pill (aria-current survives)", () => {
      // Chengyu is phase 4; a deep link at "phase 1" must still read as the
      // current page — the retired `:not(.side-nav__child--locked)` CSS guard
      // is gone, so nothing suppresses the pill.
      renderGuestAt("/learn/chengyu");

      const chengyu = screen.getByRole("link", { name: "Chengyu" });
      expect(chengyu).toHaveAttribute("aria-current", "page");
      expect(chengyu).toHaveClass("bg-primary-bg");
      expect(chengyu).toHaveClass("fw-600");
      expect(chengyu).not.toHaveClass("side-nav__child--locked");
    });

    it("renders an identical rail at phase 1 and at phase 4 (no phase input exists)", () => {
      // The phase props are deleted, not renamed: the rail is a function of the
      // URL alone, so two mounts of the same location cannot differ by phase.
      const phaseOne = renderGuestAt("/learn/foundations");
      const markupExpanded = phaseOne.container.querySelector("nav")!.innerHTML;
      phaseOne.unmount();

      const phaseFour = renderGuestAt("/learn/foundations");
      expect(phaseFour.container.querySelector("nav")!.innerHTML).toBe(markupExpanded);
      phaseFour.unmount();

      // Same for the collapsed rail.
      const railOne = renderSideNav({ currentPath: "/learn/foundations", collapsed: true });
      const railMarkup = railOne.container.querySelector("nav")!.innerHTML;
      railOne.unmount();
      const railTwo = renderSideNav({ currentPath: "/learn/foundations", collapsed: true });
      expect(railTwo.container.querySelector("nav")!.innerHTML).toBe(railMarkup);
      railTwo.unmount();
    });

    it("keeps the collapsed Learn group tooltip phase-free (Focus chrome stays phase-free)", () => {
      renderSideNav({ currentPath: "/learn/grammar", collapsed: true });
      const header = screen.getByRole("link", { name: "Learn" });
      expect(header).toHaveAttribute("title", "Learn — Grammar");
      expect(header.getAttribute("title")).not.toMatch(/phase/i);
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
      // Collapsed rail renders the group header as a keyboard-reachable link
      // to the Learn default landing (Story: mode-aware chrome a11y — the
      // icon-only rail must stay keyboard/AT reachable).
      const header = container.querySelector(".side-nav__group-header");
      expect(header).not.toBeNull();
      expect(header!.tagName).toBe("A");
      expect(header).toHaveAttribute("href", "/learn/foundations");
      expect(header).toHaveAttribute("aria-label", "Learn");
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
      expect(toggle.querySelector("svg.lucide-chevron-left")).toBeInTheDocument();
    });

    it("shows an icon-only toggle (no label) when collapsed", () => {
      renderSideNav({ collapsed: true });
      const toggle = screen.getByRole("button", { name: "Expand sidebar" });
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      expect(toggle.querySelector("svg.lucide-chevron-right")).toBeInTheDocument();
      expect(within(toggle).queryByText("Collapse")).not.toBeInTheDocument();
    });
  });

  describe("child hierarchy", () => {
    it('marks the active child with aria-current="page"', () => {
      renderSideNav({ currentPath: "/learn/grammar" });
      const grammar = screen.getByRole("link", { name: /Grammar/ });
      expect(grammar).toHaveAttribute("aria-current", "page");
    });

    it("marks the Learn group header current when a child is active (expanded)", () => {
      renderSideNav({ currentPath: "/learn/grammar" });
      // Story 22.5: aria-current lives on the label link (default landing);
      // the chevron button is the accordion toggle and carries aria-expanded.
      const label = screen.getByRole("link", { name: /Learn/ });
      expect(label).toHaveAttribute("aria-current", "page");
      const grammar = screen.getByRole("link", { name: /Grammar/ });
      expect(grammar).toHaveAttribute("aria-current", "page");
    });

    it("does not mark the Learn group header current on unrelated routes", () => {
      renderSideNav({ currentPath: "/library" });
      const label = screen.getByRole("link", { name: /Learn/ });
      expect(label).not.toHaveAttribute("aria-current");
    });

    it("never dims or disables a Learn child (the locked class is retired — A25)", () => {
      renderSideNav({ currentPath: "/learn/foundations" });
      const children = document.querySelectorAll(".side-nav__child");
      expect(children).toHaveLength(LEARN_NAV_ITEMS.length);
      children.forEach((child) => {
        expect(child).not.toHaveClass("side-nav__child--locked");
        expect(child).not.toHaveAttribute("aria-disabled");
        expect(child).not.toHaveAttribute("tabindex");
      });
      // The active Foundations child IS current — and so is every other row's
      // ability to become current.
      const foundations = screen.getByRole("link", { name: /Foundations/ });
      expect(foundations).toHaveAttribute("aria-current", "page");
    });

    it("keeps a deep-linked phase-ahead child fully styled and current", () => {
      // Deep-link to Grammar (phase 2) with no phase input at all: NavLink sets
      // aria-current="page" and the active pill classes apply unconditionally.
      renderSideNav({ currentPath: "/learn/grammar" });
      const grammar = screen.getByRole("link", { name: /Grammar/ });
      expect(grammar).toHaveAttribute("aria-current", "page");
      expect(grammar).not.toHaveClass("side-nav__child--locked");
      expect(grammar).toHaveClass("bg-primary-bg");
      expect(grammar).toHaveClass("fw-600");
    });
  });

  describe("Story 22.5 — nav/URL sync", () => {
    // Full-location harness: `location` prop mirrors the router entry so the
    // same-path guard compares against the real sub-state.
    function renderUrlAware(entry: string) {
      const url = new URL(entry, "http://localhost");
      return render(
        <MemoryRouter initialEntries={[entry]}>
          <SideNav
            navItems={navItems}
            currentPath={url.pathname}
            location={{ pathname: url.pathname, search: url.search }}
          />
          <UrlProbe />
        </MemoryRouter>,
      );
    }

    it("builds Learn child `to` from defaultParams (bare canonical today)", () => {
      renderSideNav({ currentPath: "/learn/foundations" });
      const foundations = screen.getByRole("link", { name: /Foundations/ });
      expect(foundations).toHaveAttribute("href", "/learn/foundations");
      const radicals = screen.getByRole("link", { name: /Radicals/ });
      expect(radicals).toHaveAttribute("href", "/learn/radicals");
    });

    it("same-path child click is a no-op that preserves the sub-state", () => {
      renderUrlAware("/learn/foundations?tab=tones");
      const foundations = screen.getByRole("link", { name: /Foundations/ });
      fireEvent.click(foundations);
      // No navigation performed — `?tab=tones` is preserved, nothing stacked.
      expect(screen.getByTestId("url")).toHaveTextContent("/learn/foundations?tab=tones");
    });

    it("cross-item child click lands on the bare canonical path (sub-state dropped)", () => {
      renderUrlAware("/learn/foundations?tab=tones");
      fireEvent.click(screen.getByRole("link", { name: /Radicals/ }));
      expect(screen.getByTestId("url")).toHaveTextContent("/learn/radicals");
    });

    it("keeps the active child highlight regardless of search params", () => {
      renderUrlAware("/learn/foundations?tab=tones");
      const foundations = screen.getByRole("link", { name: /Foundations/ });
      expect(foundations).toHaveAttribute("aria-current", "page");
    });

    it("Learn group header label navigates to /learn/foundations (default landing)", () => {
      renderUrlAware("/learn/radicals");
      const label = screen.getByRole("link", { name: /Learn/ });
      expect(label).toHaveAttribute("href", "/learn/foundations");
      fireEvent.click(label);
      expect(screen.getByTestId("url")).toHaveTextContent("/learn/foundations");
    });

    it("Learn group header label same-page click preserves the sub-state", () => {
      renderUrlAware("/learn/foundations?tab=tones");
      fireEvent.click(screen.getByRole("link", { name: /Learn/ }));
      expect(screen.getByTestId("url")).toHaveTextContent("/learn/foundations?tab=tones");
    });

    it("chevron button is the accordion toggle (aria-expanded stays on the toggle)", () => {
      renderSideNav();
      const chevron = screen.getByRole("button", { name: /Learn section/ });
      expect(chevron).toHaveAttribute("aria-expanded", "true");
      expect(chevron).toHaveAttribute("aria-controls", "side-nav-group-learn");
      // Toggling collapses the children without navigating.
      fireEvent.click(chevron);
      expect(screen.queryByRole("link", { name: /Grammar/ })).not.toBeInTheDocument();
    });
  });
});
