# Epic: Error Boundaries & Centralized Logging (Phase 6)

## Summary

Add a React Error Boundary component and a small centralized logging utility to capture runtime UI errors and improve recoverability. Provide a graceful fallback UI and a reset action that can clear feature state when appropriate.

## Goals

- Add `src/components/ErrorBoundary.tsx` class component with `getDerivedStateFromError` and `componentDidCatch`.
- Add a lightweight logger (`src/utils/logger.ts`) to centralize console calls and future integration with remote logging.
- Expose a `reset` action in `ProgressDispatchContext` to allow the fallback to reset feature state.
- Wrap top-level providers or `App.tsx` with `<ErrorBoundary>` to catch errors within the feature.

## Scope

Files to add/update:

- `src/components/ErrorBoundary.tsx`
- `src/utils/logger.ts`
- Update to provider/`App.tsx` to wrap with `ErrorBoundary`

## Constraints

- No external logging services in this phase; keep a small abstraction ready for future use.

## Acceptance Criteria

- Thrown errors within Mandarin feature UI render the fallback UI with a visible Reset button.
- Reset clears in-memory feature state (or redirects to safe route) and logs the event.

## Risks & Mitigations

- Risk: Over-broad boundary hides bugs. Mitigation: wrap feature areas (rather than entire app) and log detailed error info.

## Metrics

- Number of caught errors in staging logs.
- UX recovery time from a caught error (measured by manual validation).
