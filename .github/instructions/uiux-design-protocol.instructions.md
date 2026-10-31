---
description: "UIUX mandate and the design-system contract for any UI work: spine first, compose from the registry, every state designed. Read before writing UI code."
applyTo: "apps/frontend/src/**/*.tsx"
---

# UIUX protocol

Three obligations, and the gates enforce them. Everything else is judgement and lives in the guides.

## 1. The design system is spine, read through the MCP

The generic layer (tokens, components, page-anatomy measures, archetype vocabulary) is the **spine**
repo, served by the spine MCP. This repo owns only the theme overlay and the `domain.pinyinpal` tokens.

- `suggest_component` / `search_kb` to resolve a need to a real component. **Never invent one.**
- `spine://components/{name}` for a component's props and its closed variant set.
- `suggest_token` for a semantic role, `validate_snippet` while writing.
- A generic token or measure spine lacks is a **spine change**, never a local `:root` addition.

Local context: `DESIGN.md` (theme overlay), `styles/globals.css` (values), `.github/component-registry.json`
(local components), `docs/guides/design/page-archetypes.md` (the page library).

## 2. Compose, do not restyle

Build from `src/shared/components` and spine components, with props. No new structure where a registry
entry covers the need, and no restyling of a shared component through a wrapper class.

Name the page's `archetype` from `page-archetypes.md` and read the anatomy it declares
(`PageShell` -> `PageHeader` -> `PageStack` -> `PageGrid`). Never set a page max-width, a centring
wrapper, or a page-level grid; the layout tokens own that and `design-audit:foundation` fails on it.

## 3. Every state is designed, and the AI-slop tells are banned

Design `loading`, `empty`, `error`, `populated` and `edge` before writing code. A surface that only has
a populated state is unfinished.

The twelve fundamentals are: contrast role tiers, typography discipline, semantic colour roles,
spacing and grids, elevation and layering, cognitive load, layout physics, quality bar, deep hierarchy,
data density, composition and portals, and the external-reference discipline. Their definition and
applied form are in `docs/guides/design/uiux-fundamentals.md`; read it rather than scoring from this
list, which only exists so you know what you are missing.

The AI-slop tells are machine-checked by `design-audit` (`slop-*`, `accent-budget`, `rounded-card-tell`,
`centered-column-tell`, `eyebrow-pill-tell`), so they are not restated here. Run the gate.

## The gates

The canonical table is in `project-workflow.instructions.md`, and the design rows there are the ones that
apply here: #7 stories and the ledgers, #8 design lint, #9 design audit, #14 parity, #15 name discipline
and #16 the class catalog. Do not keep a second list.
