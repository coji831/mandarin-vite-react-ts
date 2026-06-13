# Review Checklist

**Last Updated:** June 8, 2026
**Purpose:** Code review criteria, pre-commit checks, and PR review standards
**Audience:** All developers reviewing code or preparing changes for review

> **When to read this:** Before committing changes, when submitting or reviewing a pull request, or when checking code quality standards.

**Priority Legend:**

- 🔴 **Required** — Must pass for every change
- 🟡 **Important** — Complete for medium/large features
- 🟢 **Optional** — Nice to have, situational

---

## 1. Pre-Commit Self-Review

Run through these checks before committing your own changes:

### Code Quality

- [ ] 🔴 **No debug artifacts:** Remove `console.log`, `debugger`, `TODO`, `FIXME` (unless tracked in issue tracker)
- [ ] 🔴 **No dead code:** Remove commented-out blocks, unused imports, unused variables
- [ ] 🔴 **TypeScript compiles:** `tsc --noEmit` passes with no errors
- [ ] 🔴 **Lint passes:** `npm run lint` exits with code 0
- [ ] 🟡 **No `any` types:** Use strict types; avoid type escapes
- [ ] 🟡 **Error handling:** All promise rejections handled; try/catch for fallible operations
- [ ] 🟢 **Performance:** No unnecessary re-renders, memoized expensive computations, paginated queries

### Testing

- [ ] 🔴 **Tests pass:** `npm test` — all tests green
- [ ] 🔴 **New code has tests:** At minimum, cover the happy path
- [ ] 🟡 **Edge cases covered:** Empty states, error states, boundary conditions
- [ ] 🟡 **No brittle assertions:** Prefer role/text queries over CSS selectors (RTL); avoid snapshots for complex components

### Documentation

- [ ] 🟡 **File headers updated:** If adding/modifying exported components, hooks, or services
- [ ] 🟡 **Architecture docs updated:** If changing cross-cutting patterns or adding new features
- [ ] 🟢 **Inline comments:** Complex logic has explanation comments

---

## 2. Pull Request Review

### Structure & Scope

- [ ] 🔴 **Single purpose:** PR addresses one concern (bug fix, feature, refactor) — not a mix
- [ ] 🔴 **Descriptive title:** Conventional Commit format: `type(scope): description`
- [ ] 🔴 **Description:** Explains what, why, and how to test
- [ ] 🟡 **Focused diff:** Less than 400 lines preferred; large PRs should have rationale
- [ ] 🟡 **No unrelated changes:** Whitespace fixes, formatting changes in separate commits

### Architecture & Design

- [ ] 🔴 **Follows conventions:** Matches `conventions/frontend.md`, `conventions/backend.md`, `conventions/api-client.md`
- [ ] 🔴 **SOLID principles:** Single responsibility, dependency injection, interface segregation
- [ ] 🟡 **Layered correctly:** Controller handles HTTP, service handles logic, repository handles data (backend)
- [ ] 🟡 **State management:** Follows patterns in `conventions/state-management.md`
- [ ] 🟢 **No over-engineering:** Solution matches complexity of the problem

### Security

- [ ] 🔴 **No secrets in code:** API keys, tokens, passwords in environment variables only
- [ ] 🔴 **Input validation:** All user input sanitized (backend + frontend)
- [ ] 🟡 **Auth checks:** Protected routes require authentication; authorization checks present
- [ ] 🟡 **No unsafe defaults:** No fallback secrets like `process.env.SECRET || "default"`
- [ ] 🟡 **XSS prevention:** No `dangerouslySetInnerHTML` without sanitization
- [ ] 🟢 **Rate limiting:** Public endpoints have rate limiting applied

### Dependencies

- [ ] 🟡 **No new dependencies without discussion:** Adding a package should be justified
- [ ] 🟡 **Versions pinned:** No `^` or `~` ranges for production dependencies
- [ ] 🟢 **No duplicate dependencies:** Check `npm ls` for version conflicts

---

## 3. Merge Checklist

- [ ] 🔴 **CI passes:** All checks green (lint, test, build, type-check)
- [ ] 🔴 **Approved:** At least one reviewer has approved
- [ ] 🟡 **Branch up to date:** Rebased or merged from target branch
- [ ] 🟡 **Documentation updated:** If the change affects public API, setup steps, or architecture
- [ ] 🟡 **Squash commits:** Clean commit history with meaningful messages

---

## 4. Common Issues to Catch During Review

| Issue                  | How to Spot                                                 | Severity |
| ---------------------- | ----------------------------------------------------------- | -------- |
| Console.log left in    | Search diff for `console.log`, `console.debug`              | 🔴       |
| Unused import          | IDE shows greyed out; check diff for added imports not used | 🔴       |
| Magic number           | Search for unexplained numeric/string literals              | 🟡       |
| Missing loading state  | Component has async data fetch but no spinner/skeleton      | 🟡       |
| Missing error state    | API call can fail but no error UI handling                  | 🟡       |
| Hardcoded string       | UI text should come from constants or i18n                  | 🟢       |
| Deeply nested callback | >3 levels of nesting suggests refactoring need              | 🟢       |

---

## 5. Related Documentation

- [Code Conventions](../conventions/frontend.md) — Coding standards and patterns
- [Testing Guide](../testing/frontend.md) — Test patterns and best practices
- [Workflow Guide](./workflow.md) — Development workflow overview
