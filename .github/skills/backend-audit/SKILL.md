---
name: backend-audit
description: "Run this skill when auditing backend code. Covers error message format, architecture boundaries, input validation, DI compliance, Prisma safety, test coverage, API contracts, and security."
user-invocable: true
---

# Backend Audit Skill

## When to Use

- After implementing a backend feature (self-audit by Backend Engineer)
- During code review (Code Reviewer checking backend changes)
- Before closing a story that touches API or database
- Before running a Prisma migration

## Always Check (in order of priority)

1. **Error message format** — do all controller error responses follow `"Failed to {action} {resource}"` pattern? Check `backend-error-messages.instructions.md` for details.

2. **Architecture boundaries** — any service importing from another service's internals? Any controller bypassing the service layer to call repositories directly?

3. **Input validation** — all endpoints validated at the controller boundary. No raw request body data passed directly to Prisma queries.

4. **DI compliance** — all service dependencies injected via constructor/factory. No internal instantiation (e.g., `new Service()` inside another service).

5. **Prisma safety** — any schema changes that could drop data? Migrations reviewed before applying? Never drop columns — use `@map` or additive migrations. See `prisma-schema-changes.instructions.md`.

6. **Test coverage** — new/modified business logic has corresponding unit tests (mocked deps) or integration tests (test DB). Coverage target >80% for business logic.

7. **API contract** — response shape matches what the frontend expects? Shared types in `packages/shared-types/` updated?

8. **Security** — authentication/authorization checks on protected endpoints? Input sanitized against XSS? Rate limiting considered?
   - **Auth intentionality** — for every endpoint with `requireAuth`/`optionalAuth`, is the choice **intentional**? A copy-pasted default that puts `requireAuth` on a guest-facing endpoint (leaving the anon branch as dead code), or that exposes a protected endpoint to guests, is a HIGH severity defect.
   - **Guest path exercised** — if an endpoint is `optionalAuth`, is the guest/anon branch **exercised by a test** (not dead code)? Severity HIGH if an `optionalAuth` endpoint only has an authed test path, or if a guest branch exists with no test.

9. **API-contract doc truth-check** — documented endpoints exist verbatim in the actual routes (ROUTE_PATTERNS); deprecated/renamed endpoints are not still documented; module names match `src/modules/`.

## Output Format

- Group findings by file path
- For each: file, description, severity (HIGH/MEDIUM/LOW), suggested fix
- End with summary: X violations found (Y high, Z medium)
