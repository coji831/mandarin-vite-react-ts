# Story 3-9: Refactor FlashCard to Use Context

## Story Summary

Refactor the `FlashCard` component to consume Mandarin context directly, removing all progress-related props.

## Background

Direct context consumption eliminates prop drilling and simplifies the component interface.

## Acceptance Criteria

- `FlashCard` uses the consumer hook for all state/actions
- All progress-related props are removed
- Component functionality remains unchanged

## Dependencies

Story 3-4: Create Consumer Hook and Add Types

## Related Issues

Epic 3: State Management Refactor

---

# Implementation Plan

1. Update `FlashCard` to use the consumer hook
2. Remove all progress-related props
3. Verify component works as expected

---

# Technical Implementation Reference

See [Epic 3 Technical Doc](./README.md)
