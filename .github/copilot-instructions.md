# PinyinPal - agent instructions

**Last updated:** 2026-11-01. This file is the law that loads on every task. Everything else is scoped by
a glob or invoked as a skill, and the index of it is `.github/AGENTS.md`.

## COMMIT GATE (binding, read first)

**Never `git commit` or `git push` unless the user explicitly says the phrase "commit allowed"** (or an
unambiguous equivalent such as "yes, commit"). The default state of this repo is
**review-before-commit**: make the change, present the diff, wait. Ambiguous words ("proceed", "go ahead",
"fix it", "ok") do not grant permission. When in doubt, do not commit: ask. The only exception is a change
the user already approved for commit earlier in the same session.

## Never do these

- Never hardcode a colour, spacing, font-size, duration or `z-index`. Every value reads `var(--token)`.
- Never invent a generic token, component or page-anatomy measure. Spine owns the generic layer.
- Never reimplement `Button`, `Input`, `LoadingScreen`, `ErrorScreen`, `ProgressBar`, `FilterChip`,
  `ToggleSwitch` or `ContentBrowser`. Import from `src/shared/components`.
- Never set a page `max-width`, a centring wrapper or a page grid in page CSS. `PageShell` ->
  `PageHeader` -> `PageStack` -> `PageGrid` own the measure; `design-audit:foundation` fails on it.
- Never store state inside a `components/` directory, and never call `apiClient` from a component or hook.
- Never create a page story or a page shell. Storybook is a component surface.
- Never bypass a CSS import restriction with an eslint-disable.

## The design system is spine

The generic layer (tokens, components, page-anatomy measures, archetype vocabulary) is the **spine** repo,
served by the spine MCP: `spine://tokens`, `spine://components/{name}`, `spine://rules`, plus
`suggest_token`, `suggest_component`, `search_kb` and `validate_snippet`. Read a component's contract there
rather than trusting a local copy.

This repo owns exactly two layers: the **theme overlay** (`DESIGN.md` plus `globals.css` `:root`) and the
`domain.pinyinpal` support tokens. A theme is a delta over the same semantic names; renaming a spine token
locally is a fork. If spine lacks a token, that is a spine change or an escalation, never a local addition.

## The lifecycle

Seven phases, each with an exit gate. Phases 0-2 precede code, 3-4 repeat per story, 5-6 happen once per
epic, 7 is a deferred batch. The gate **commands** are in `project-workflow.instructions.md`, which owns the
only gate table.

| #   | Phase       | Produces                                          | Exit gate                                   | Lead                   |
| --- | ----------- | ------------------------------------------------- | ------------------------------------------- | ---------------------- |
| 0   | Scope       | the epic's binding text plus any audit amendment  | re-measure every premise an amendment names | architect              |
| 1   | BR          | `README` plus one story file per story            | every story carries an AC and a status      | architect              |
| 2   | Design      | the component set and each component's state list | the human preview gate                      | uiux-designer          |
| 3   | Build       | story commits, the implementation doc, tests      | Tier 1 gates plus "commit allowed"          | engineers              |
| 4   | Story close | the BR and IMP pair                               | doc-code truth-check on that pair           | docs-writer            |
| 5   | Epic close  | close sections, high-level docs, KB, map          | Tier 2, review verdict, docs audit          | docs-writer + reviewer |
| 6   | Ship        | one PR per epic                                   | CI green                                    | coordinator            |
| 7   | Archive     | folders under `docs/**/archive/`                  | a batch pass, not per epic                  | owner                  |

Two rules that cost epics before they were written down: **a brief quotes the Phase-5 surface table, it
never summarises it** (a self-audit cannot see a file you never opened), and **a carry-forward goes into the
receiving epic's own file**, not only into your close-out table.

## The architecture

React + TypeScript via Vite in `apps/frontend`, NestJS 11 + Prisma in `apps/backend`, JWT in httpOnly
cookies. Routes are constants in `apps/frontend/src/shared/constants/paths.ts`. Business truth:
`docs/business/business-model.md`. The epic plan: `docs/planning/epics-25-40.md` and one file per epic
under `docs/planning/epics/`.

## Naming and commits

Branches: `epic-<num>-<slug>`, optionally `feature/<short>` or `fix/<short>`. Commits are Conventional
Commits, `<type>(<scope>): <description>`, with scopes such as `epic-N`, `component`, `hook`, `api`, `docs`.
Docs pair by name: `docs/business-requirements/epic-<num>-<slug>/README.md` with a
`story-<epic>-<story>-<short>.md` beside it, mirrored under `docs/issue-implementation/`. Details in
`docs/guides/conventions/git.md` and `documentation-standards`.

## Commands

`npm install` then `npm run dev` (5173) and `npm run dev:backend` (3001). Gates: `npm run lint`,
`npm run build` (**this is the frontend type-check**), `npm test` (changed scope), `npm run test:full`,
`npm run design-audit`, `npm run check:spine-parity`, `npm run check:load`. `package.json` has the rest.

## Where to read next

Each file below carries its own `applyTo` or `description`, so it arrives when its subject is touched.
`.github/AGENTS.md` is the full index; `.github/agent-surface.json` is the context budget.

- styling a component, or touching a colour, size or duration -> `frontend-css-styling`,
  `theme-delta`
- building or refactoring a component's state, logic or barrel -> `frontend-component-architecture`
- designing a surface or laying out a page -> `uiux-design-protocol`, `ui-composition`
- writing a story -> `storybook-production-alignment`
- calling the API from a feature -> `frontend-api-client`
- handling input, timers, or audio playback edges -> `frontend-input-handling`
- writing a test -> `testing-standards`
- touching the schema or a migration -> `prisma-schema-changes`
- using a quiz pattern -> `quiz-architecture`
- reaching for an external DOM library -> `react-external-libs`
- writing or closing a story or epic -> `project-workflow`
- writing a doc under `docs/` -> `documentation-standards`
- rendering a user-facing backend error -> `backend-error-messages`
- auditing before reporting UI code complete -> skill `frontend-audit` (Parts 2-4)
- auditing the backend or the docs -> skill `backend-audit`, skill `docs-audit`

Accessibility is not in that list because `a11y-floor` is unconditional and already loaded.
