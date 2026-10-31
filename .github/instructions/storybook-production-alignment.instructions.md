---
description: "Storybook is for shared components only. Read before adding or changing a shared component or its story."
applyTo: "apps/frontend/src/shared/components/**/*.tsx,**/*.stories.tsx"
---

# Stories are component contracts

A story proves one shared component's variant and state set. Nothing else gets one: **no page stories,
no feature stories.** A page is composed from agreed components, and its behaviour is covered by the
integration suite, not by a story.

- **One story file per component**, beside it in `src/shared/components/`, states taken from the
  component's registry entry.
- **The registry is the contract.** Every shared component in `.github/component-registry.json`
  declares `storybook.storyFile` and `storybook.states`. `npm run check:registry-stories` is the
  authority; it checks that scope and nothing wider.
- **A story renders props.** No business logic, no data fetching, no router, no store wiring. A story
  that needs application state is testing the wrong thing.
- **States come from the closed set** the registry declares. A state the component does not own is a
  component defect, not a story defect.

## Isolation

Each story starts from a clean module state. No story may depend on another having run, and none may
leave a store, a timer or a global patched behind it: `MockDate` and `preview.tsx` globals leak across
the shared vitest project, so a leak shows up as a *different* story failing. Reset in the story's own
`beforeEach`, never in the component.

## Mocking

`.storybook/msw-handlers.ts` holds only what a shared component actually fetches: `auth` (the provider
mounts in any story) and `progression` (the global `phaseGate` default in `preview.tsx`). Add a group
when a shared component needs it, never for a page.

## Where the detail lives

- Run, view and verify: `docs/guides/testing/storybook.md`.
- Component variants, props and states: spine, through `spine://components/{name}` or
  `suggest_component`.
- Accessibility of a story: the accessibility plugin's own checks, plus `addon-a11y`.
