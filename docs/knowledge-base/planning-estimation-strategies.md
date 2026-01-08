# Planning & Estimation Guide

This guide provides estimation frameworks, complexity multipliers, and lessons learned from real implementations to improve project planning accuracy.

## Core Estimation Principles

### Base Estimation Units

- **Small (1 point)**: Simple change, single file, minimal testing (~1-2 hours)
- **Medium (3 points)**: Multiple files, moderate complexity, integration tests (~4-6 hours)
- **Large (5 points)**: Feature implementation, architecture changes, comprehensive testing (~1-2 days)
- **Extra Large (8 points)**: Complex feature, multiple integrations, cross-cutting concerns (~3-5 days)

### T-Shirt Sizing

- **XS**: Bug fixes, documentation updates, minor config changes
- **S**: Single component/hook, isolated functionality
- **M**: Feature with frontend + backend, basic integration
- **L**: Multi-component feature, database changes, external service integration
- **XL**: Epic-level work, architectural changes, multiple services

## Complexity Multipliers by Work Type

### Infrastructure Integration (First-Time)

**Base Multiplier:** 2-3x

**Applies To:**

- Cookie-based authentication through dev proxy
- Database connection pooling configuration
- Cross-origin credential flows (CORS + cookies)
- Environment configuration consolidation
- Third-party API integration (first service)

**Why Higher:**

- Proxy/CORS/cookie issues not visible in acceptance criteria
- Environment-specific configuration complexity
- Debugging requires understanding multiple layers (browser → proxy → backend → database)
- Documentation often incomplete or outdated for specific stack combinations

**Example:** Story 13.3 (JWT Authentication)

- **Estimated:** 5 points (1-2 days)
- **Actual:** 15 points (3-4 days)
- **Reason:** Cookie forwarding through Vite proxy, CORS credentials setup, environment sprawl

**Mitigation Strategies:**

1. Add dedicated "infrastructure setup" story before feature implementation
2. Budget explicit exploration/debugging time (20-30% of estimate)
3. Consolidate environment configuration as first task
4. Research stack-specific quirks before estimation (e.g., "Vite proxy cookies", "Supabase connection pooling")
5. Plan for incremental validation (test cookie flow, then auth, then protected endpoints)

### React Hooks with External Dependencies

**Base Multiplier:** 1.5-2x

**Applies To:**

- Custom hooks with API calls
- Hooks managing timers/intervals
- Hooks with complex cleanup logic
- Context providers with async state

**Why Higher:**

- React Strict Mode double-mounting requires defensive coding
- Cleanup logic often missed in initial implementation
- Race conditions between mount/unmount cycles
- Testing requires mock setup and async handling

**Example:** `useAuth` Hook with Token Refresh

- **Estimated:** 3 points (4-6 hours)
- **Actual:** 5 points (8-10 hours)
- **Reason:** isMounted guards, race condition handling, Strict Mode compatibility

**Mitigation Strategies:**

1. Enable React Strict Mode from day one in development
2. Plan for `isMounted` guards and cleanup functions upfront
3. Add "idempotent operation" requirement to backend AC
4. Budget time for Strict Mode testing and race condition debugging
5. Add E2E tests for critical flows (not just unit tests)

### Cross-Cutting Changes

**Base Multiplier:** 1.5x

**Applies To:**

- State management refactoring
- Shared component library changes
- API contract changes affecting multiple features
- Type system updates
- Build configuration changes

**Why Higher:**

- Multiple features impacted simultaneously
- Documentation updates across many files
- Risk of regression in unrelated features
- Coordination with other in-progress work

**Example:** Unified Data Model Migration

- **Estimated:** 8 points (3-5 days)
- **Actual:** 13 points (5-7 days)
- **Reason:** 15+ files updated, tests across 4 features, documentation sync

**Mitigation Strategies:**

1. Identify all affected features in planning phase
2. Add "update cross-references" task to AC explicitly
3. Schedule dedicated regression testing pass
4. Create migration checklist for systematic updates
5. Consider feature flags for gradual rollout

### Database Schema Changes

**Base Multiplier:** 1.3-1.5x

**Applies To:**

- New tables/columns
- Index changes
- Migration scripts
- Data backfill operations

**Why Higher:**

- Migration testing (up and down)
- Production data considerations
- Performance impact analysis
- Rollback strategy required

**Mitigation:**

1. Test migrations on production-like data volume
2. Add rollback procedure to AC
3. Budget time for index optimization
4. Plan for zero-downtime deployment if needed

### Authentication/Authorization

**Base Multiplier:** 2-2.5x

**Applies To:**

- First-time auth implementation
- Multi-provider OAuth integration
- Role-based access control (RBAC)
- Session management

**Why Higher:**

- Security considerations require extra scrutiny
- Testing edge cases (expired tokens, revoked sessions, concurrent logins)
- Infrastructure complexity (cookies, CORS, tokens)
- Documentation and security review

**Mitigation:**

1. Break into smaller stories (register → login → token refresh → protected routes)
2. Add dedicated security review to AC
3. Budget time for security logging implementation
4. Plan for rate limiting and attack prevention

## Estimation Adjustment Framework

### Step 1: Base Estimate

Use standard story points or hours based on acceptance criteria complexity.

### Step 2: Apply Multipliers

Identify applicable categories and apply highest multiplier:

```
Adjusted Estimate = Base Estimate × Max(Multiplier1, Multiplier2, ...)
```

**Example:**

- **Story:** Implement JWT authentication with cookie-based refresh
- **Base Estimate:** 5 points
- **Categories:** Infrastructure (2.5x), Auth (2.5x), React Hooks (1.5x)
- **Multiplier:** 2.5x (highest)
- **Adjusted Estimate:** 5 × 2.5 = 12-13 points

### Step 3: Add Buffer

For critical path or high-risk work, add 20% buffer:

```
Final Estimate = Adjusted Estimate × 1.2
```

## Story Breakdown Best Practices

### When to Split Stories

Split if:

- Estimate exceeds 8 points after adjustments
- Multiple infrastructure pieces need setup
- Acceptance criteria list exceeds 8 items
- Feature touches more than 3 distinct areas

### Split Strategies

**Vertical Slice (Preferred):**

- Story 1: Basic login (email/password only)
- Story 2: Add token refresh
- Story 3: Add rate limiting + security logging

**Horizontal Layer:**

- Story 1: Backend auth endpoints
- Story 2: Frontend auth components
- Story 3: Integration + E2E tests

**Infrastructure First:**

- Story 1: Setup environment config, database, CORS
- Story 2: Implement auth endpoints
- Story 3: Frontend integration

## Red Flags During Planning

### Underestimation Indicators

- ⚠️ AC mentions "setup," "configure," or "integrate" (infrastructure work)
- ⚠️ First-time use of technology/library in the codebase
- ⚠️ AC includes security or performance requirements
- ⚠️ Story spans frontend + backend + database
- ⚠️ External service integration without prior experience
- ⚠️ "Simple" or "just need to" in story description

### Overestimation Indicators

- ✅ Similar work completed recently with known patterns
- ✅ Isolated change (single component, no dependencies)
- ✅ Well-defined AC with no ambiguity
- ✅ Existing test patterns can be reused
- ✅ Clear acceptance criteria (< 5 items)

## Estimation Retrospective Template

After completing complex stories, document:

```markdown
### Story: [Name] (#number)

**Original Estimate:** X points
**Actual Effort:** Y points
**Variance:** +Z% / -Z%

**What Increased Complexity:**

- [Specific issue or blocker]
- [Infrastructure challenge]
- [Unforeseen dependency]

**What Went Smoothly:**

- [Reused pattern]
- [Good documentation]

**Lessons for Future Estimates:**

- [Specific adjustment to estimation process]
- [New multiplier category or value]

**Reusable Patterns Created:**

- [Helper function, config pattern, etc.]
```

## Task Breakdown Checklist

For each story, ensure these tasks are explicitly estimated:

### Development Phase

- [ ] Environment/infrastructure setup
- [ ] Backend implementation
- [ ] Frontend implementation
- [ ] Error handling
- [ ] Validation logic

### Testing Phase

- [ ] Unit tests (reducers, utils)
- [ ] Component tests (RTL)
- [ ] Integration tests (API)
- [ ] E2E tests (critical paths)
- [ ] React Strict Mode testing

### Documentation Phase

- [ ] Update BR acceptance criteria checkboxes
- [ ] Update implementation doc with decisions
- [ ] Update design docs if architecture changed
- [ ] Add/update code comments for public APIs
- [ ] Update API specs if endpoints changed

### Review Phase

- [ ] Self-review (code quality, conventions)
- [ ] Security review (if auth/data handling)
- [ ] Performance check (if state/data intensive)
- [ ] Cross-browser testing (if UI heavy)

## Common Estimation Mistakes

### Mistake 1: Ignoring Environment Setup

**Bad:** "Add login endpoint" (2 points)

**Good:**

- "Setup CORS + cookie configuration" (3 points)
- "Implement login endpoint" (2 points)
- "Frontend login form integration" (2 points)

### Mistake 2: Underestimating Testing

**Bad:** Include testing in development estimate

**Good:** Separate testing tasks with explicit point values (typically 30-40% of dev time)

### Mistake 3: Forgetting Documentation

**Bad:** No documentation task

**Good:** Add explicit "Update docs" task (10-15% of total effort)

### Mistake 4: Missing Cross-Cutting Impact

**Bad:** Estimate story in isolation

**Good:** Identify all impacted areas and estimate updates for each

## Reference Stories

### Well-Estimated Stories

- **Story 13.1:** Backend structure setup (8 points, completed in 8 points)
  - Clear AC, isolated setup work, no surprises

### Under-Estimated Stories (Lessons Learned)

- **Story 13.3:** JWT Authentication (estimated 5, actual 15)
  - **Lesson:** Add 2.5x multiplier for first-time infrastructure + auth
  - **Lesson:** Separate environment setup into dedicated story
  - **Lesson:** Budget dedicated time for cookie/proxy debugging

## Team Calibration

### Estimation Poker Guidelines

- Discuss highest and lowest estimates before voting again
- Use multipliers from this guide as discussion points
- Reference similar completed stories
- Call out assumptions explicitly
- Re-vote after discussing concerns

### Velocity Tracking

- Track points per week over 3-4 sprints
- Adjust multipliers based on actual variance
- Document story-specific lessons in this guide
- Update multipliers quarterly based on retrospectives

## Future Improvements

- [ ] Create estimation calculator tool
- [ ] Add complexity scoring rubric
- [ ] Collect metrics on estimation accuracy by category
- [ ] Build estimation templates for common story types

## Reference

- **Source Story**: [Story 13.3: JWT Authentication System](../business-requirements/epic-13-production-backend-architecture/story-13-3-authentication.md)
- **Postmortem Analysis**: Story 13.3 revealed 2-3x multiplier for infrastructure work
- [Agile Estimation Techniques](https://www.atlassian.com/agile/project-management/estimation)

---

**Last Updated:** January 9, 2026
