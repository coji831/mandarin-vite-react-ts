# Story 3-4: Create Consumer Hook and Add Types (Business Requirement)

## Story Summary

Create a custom hook for consuming the Mandarin context and ensure all context values are properly typed for safety and ease of use.

## Status

Planned

## Epic Reference

Epic 3: State Management Refactor

## Background

A consumer hook simplifies context usage and enforces type safety for all consumers, making the codebase easier to maintain and extend.

## Business Rationale

- Simplifies context usage for all components
- Enforces type safety
- Reduces risk of context misuse

## Acceptance Criteria

- A custom hook (e.g., `useMandarin`) is created for consuming context
- All context values are strictly typed
- Components use the consumer hook for accessing state/actions

## Dependencies

Story 3-3: Create Context and Provider

## Related Issues

Epic 3: State Management Refactor
