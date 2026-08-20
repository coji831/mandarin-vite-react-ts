# Story 3-1: Move Progress Tracking Logic to Custom Hook

## Story Summary

Move all progress tracking state and functions from `Mandarin.tsx` into a new custom hook `useMandarinProgress`.

## Background

Currently, progress tracking logic is tightly coupled with UI logic in `Mandarin.tsx`. This makes the component hard to maintain and extend.

## Acceptance Criteria

- All progress tracking state and functions are moved to `useMandarinProgress`
- `Mandarin.tsx` only imports and uses the hook
- No progress logic remains in the main component

## Dependencies

None

## Related Issues

Epic 3: State Management Refactor

---

# Implementation Plan

1. Create `useMandarinProgress.ts` in `src/features/mandarin/hooks/`
2. Move all progress-related state and functions from `Mandarin.tsx` to the hook
3. Update `Mandarin.tsx` to use the hook

---

# Technical Implementation Reference

See [Epic 3 Technical Doc](./README.md)
