---
description: "Use when writing or updating a doc under docs/. Covers the leaf front-matter contract, template compliance, and the doc-to-code truth-check."
applyTo: "docs/**/*.md, docs/**/*.html, apps/frontend/src/features/**/docs/**/*.md, apps/backend/src/modules/**/docs/**/*.md, apps/backend/docs/**/*.md"
---

# Documentation standards

## The front-matter contract

Every active `docs/` leaf carries this block at the very top. The map (`docs/README.md`) and the freshness
scan (`docs/coverage.md`) are **generated** from it, so a leaf without it is a leaf nothing can find.

```yaml
---
purpose: <one sentence, becomes the map row>
status: <per-class vocabulary, below>
last-verified: YYYY-MM-DD
type: <one of the doc types>
audience: <optional: new-dev | frontend | backend | agents | all>
covers: <optional: units this doc inventories>
tags: <optional>
---
```

Required: `purpose`, `status`, `last-verified`, `type`. **No `title` field**: the H1 is canonical.

| Class | `status` vocabulary |
| --- | --- |
| Epics | `planned` `in-progress` `completed` `parked` `retired` `deferred` |
| Docs, guides, KB | `active` `superseded` `retired` `review` |
| Pages | `conforms` `diverges` |
| Components | `green` `red` |

Use the vocabulary verbatim. Never invent a word; a status nobody can enumerate is a status nobody can
query. Prose markers (`**Status:**`, `**Last Updated:**`) are archive-only, never used on a new leaf.

**Never hand-sync the map.** `scripts/generate-system-map.mjs` emits it. Fix the leaf, then regenerate;
`npm run check:system-map` will tell you if you forgot.

## Template compliance

Every doc starts from a template in `docs/templates/`. No section the template lacks, none it requires
missing. A doc that needs a structural change changes the template first, in the same change.

## The truth-check

Before closing, verify the doc against the code, not against your memory of it:

- **Endpoints** named in the doc exist, with the method and path the router actually declares.
- **Names** (components, hooks, services, scripts) exist in `src/`.
- **Counts** are measured now, never carried forward. A number in a doc is recomputable or it is wrong.
- **The data source** is what the code reads, including a guest fallback if one exists.
- **Links** resolve, **dates** are the ones the change happened, and any tooling the doc names is the
  tooling installed.

A self-audit of the files you touched cannot see a file you never opened. Enumerate the surfaces by name
and open each one; that omission is what let `docs/architecture.md` describe a retired engine for weeks.

## Where the detail lives

- The 12 doc types, the full status matrix, the sweep rules and the archive exemptions:
  `docs/templates/README.md`.
- The generated tree shape and the layer model: `docs/README.md` (generated) and
  `docs/knowledge-base/` for the extracted practices.
- The doc audit pass: `.github/skills/docs-audit/SKILL.md`.
