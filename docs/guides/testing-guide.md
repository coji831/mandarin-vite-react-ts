# Testing Guide

## Tools & Frameworks

- Use Jest and React Testing Library for unit and integration tests
- Place test files next to the code they test
- Name test files as `ComponentName.test.tsx` or `file.test.ts`

## Coverage & Best Practices

- Aim for high coverage of critical business logic and UI components
- Write tests for edge cases and error handling
- Use mock data and services for isolated tests
- Test CSV loader with various input formats
- Test vocabulary data loading and display components
- Document test strategy in implementation story docs

## Review Checklist

- [ ] All new code has corresponding tests
- [ ] Acceptance criteria are covered by tests
- [ ] Test files follow naming and placement conventions
- [ ] Tests pass locally and in CI
- [ ] Test strategy is documented in story/epic docs

## CSV Data Testing

- Test CSV loading with valid, invalid, and edge-case data
- Write tests for error handling in the CSV parser
- Mock CSV responses in component tests
- Verify proper rendering of loaded vocabulary data

## Resources

- [Project Conventions](conventions.md)
- [Workflow Checklist](workflow.md)
