---
purpose: "The canonical per-epic design-spec template — one doc per UI epic (e.g. `features/*/docs/design.md`), replacing each `UI: … — design spec TBD` line"
status: active
last-verified: 2026-08-18
type: guide
audience: agents
---

# Per-Epic Design Spec — Template (canonical)

**Last Updated:** 2026-08-18
**Audience:** AI Coding Agents + Code Reviewer
**Purpose:** The canonical per-epic design-spec template. Produce one doc per UI epic (e.g. `apps/frontend/src/features/<feature>/docs/design.md`), replacing each `UI: … — design spec TBD` line in the epic/story BR.

> **Copyable file:** the fill-in design-spec template lives at [`docs/templates/feature-design-spec-template.md`](../../templates/feature-design-spec-template.md); this guide carries the operative per-epic spec body (archetype/provenance-led) that feature `docs/design.md` files follow.

> **Source of record:** This committed template is the operative per-epic spec body. It requires two fields: `archetype:` (from `page-archetypes.md`) and `provenance:` (any external borrow's origin).

## How to use

1. **Pick the archetype** from the mode/page table in `docs/guides/design/page-archetypes.md` (§0). Name it on the required `archetype:` line.
2. **Reference the archetype, list deltas** — section 4 (Component reuse map) becomes "reference archetype X; list deltas", not a re-derivation of the skeleton.
3. **Record any external borrow** on the required `provenance:` line (per the External Borrowing Protocol in `design-reasoning.md`).
4. **Score the outcome** against `docs/guides/design/design-quality-rubric.md` at epic close.

---

## Template

```markdown
# Design Spec — Epic <N>: <UI slice>

Source: BM-1 (§<tier table rows>) + epic-<N> ACs
archetype: <id from docs/guides/design/page-archetypes.md> # REQUIRED
provenance: <external borrow origin, if any> # REQUIRED — e.g. "source: <pattern> — why: <principle>"; "none" if no borrow

1. **User flow** — entry → action → outcome → next (what the user sees/thinks/wants next).
2. **Preview/reward split** — what lives on the card/preview vs the detail surface (ui-composition §7 master-detail law). Detail content must NOT appear on the preview surface.
3. **States** — display / loading / empty / error / disabled / edge; map each to a Storybook story + MSW mock.
4. **Component reuse map** — reference archetype <id> (page-archetypes.md); list deltas only. Registry components used (names + props); explicitly note "none invented".
5. **Token map** — CSS vars for color/spacing/type per element; flag any NEW token need (→ DESIGN.md + globals.css + design-audit; token freeze applies — see design-reasoning.md §0).
6. **A11y checklist** — aria-labels, focus order/trap, keyboard, contrast, touch target ≥28px (--size-touch), live regions (chat/streaming), 320px reflow; per-archetype a11y list from page-archetypes.md.
7. **Data-resilient shell** — fixed container dims + inner scroll; skeleton dims = final dims.
8. **AI-codegen inputs** — DESIGN.md + globals.css + component-registry.json + page-inventory.json + ui-composition + 1 exemplar story (Golden Template); the Storybook MCP is the component source of truth — never invent a component.
9. **Acceptance** — story test passes; user-approved layout; design-audit green; check:page-inventory green; pre-delivery checklist green; rubric human pass at epic close.
```

## Notes

- **Batch the specs by pattern family** to maximize reuse: _shell/error_ (25, 39), _guest lane + value-moment CTA + cards_ (26, 28, 32, 33, 40), _assistant/chat_ (30, 31), _timed/media_ (36, 37). Writing specs together surfaces shared components before any code.
- The `archetype:` value must match a valid id in `docs/guides/design/page-archetypes.md` (`hub-launcher`, `browse-index`, `focus-task`, `focus-chat`, `focus-timed`, `focus-media`, `utility`, `auth`) — `check:page-inventory` fails on unregistered archetypes.
- The `provenance:` field records external borrows per the External Borrowing Protocol (`design-reasoning.md` §0): `extract → translate → register → gate`. "Patterns only" must not quietly become "copy the code" — the provenance field is the guard the reviewer reads.

**See also:** `page-archetypes.md` (the library this template consumes) • `design-quality-rubric.md` (scoring companion) • `design-reasoning.md` (paradigm + token freeze + external borrowing) • `frontend-pre-delivery-checklist.instructions.md` (shipped gate artifact).
