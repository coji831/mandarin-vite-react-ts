/**
 * Unit tests for PageShell — the archetype measure contract + the one register
 * decision it carries (ADR-011 decision 4, landed by ADR-012).
 *
 * The register is a class + token wiring, not a value: these tests assert the
 * class contract (which page gets the paper surface), not colours.
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { PageShell } from "../PageShell";

describe("PageShell", () => {
  it("defaults to the overview measure on the instrument register", () => {
    const { container } = render(<PageShell>content</PageShell>);
    const shell = container.firstElementChild!;
    expect(shell).toHaveClass("page-shell", "page-shell--overview");
    expect(shell).not.toHaveClass("page-surface--paper");
  });

  it("speaks spine's archetype vocabulary as a class", () => {
    const { container } = render(<PageShell archetype="detail">content</PageShell>);
    expect(container.firstElementChild).toHaveClass("page-shell--detail");
  });

  it("keeps the instrument register for a detail page by default", () => {
    // detail also carries Review/Quiz/Chat/HSK — it must never imply paper.
    const { container } = render(<PageShell archetype="detail">content</PageShell>);
    expect(container.firstElementChild).not.toHaveClass("page-surface--paper");
  });

  it("paints the paper surface only when the page declares it", () => {
    const { container } = render(
      <PageShell archetype="detail" surface="paper">
        content
      </PageShell>,
    );
    const shell = container.firstElementChild!;
    expect(shell).toHaveClass("page-shell--detail", "page-surface--paper");
  });

  it("keeps a caller's className alongside the register", () => {
    const { container } = render(
      <PageShell surface="paper" className="reading">
        content
      </PageShell>,
    );
    expect(container.firstElementChild).toHaveClass("reading", "page-surface--paper");
  });
});
