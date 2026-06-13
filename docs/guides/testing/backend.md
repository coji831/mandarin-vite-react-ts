# Backend Testing Guide

**Last Updated:** June 3, 2026  
**Purpose:** Patterns, examples, and configuration for testing backend services in this repository (apps/backend)  
**Audience:** Backend developers writing tests for services, repositories, controllers, and middleware

Prerequisites

- See backend setup: [Backend Development Guide](../setup/backend-development.md)

1. Test Structure and Organization

- tests/ folder colocated under `apps/backend/src` or top-level `apps/backend/tests`.
- Unit tests: `services`, `repositories`, `utils` — fast, isolated, no DB network.
- Integration tests: `controllers`, `routes` — use test database or in-memory DB and run via `supertest`.
- Naming: `*.spec.ts` or `*.test.ts`.

2. Vitest Configuration for Backend

Place configuration in `apps/backend/vitest.config.ts` or add `test` section in `package.json` for backend tasks.

Example minimal config (Vitest):

```ts
/// <reference types="vitest" />
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: "./tests/setupTests.ts",
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
    testTimeout: 10000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});
```

3. Service Layer Testing (Business Logic / Orchestration)

- Goal: verify business rules and orchestration without hitting the database or external services.
- Pattern: dependency injection — pass mocked repositories/clients into service constructors.

Example:

```ts
import { vi } from "vitest";
import { AuthService } from "../../src/services/AuthService";

it("creates a user and issues tokens", async () => {
  const mockRepo = { createUser: vi.fn().mockResolvedValue({ id: "u1" }) } as any;
  const mockJwt = { sign: vi.fn().mockReturnValue("token") } as any;

  const svc = new AuthService(mockRepo, mockJwt);

  const res = await svc.register({ email: "a@b.com", password: "p" });

  expect(mockRepo.createUser).toHaveBeenCalled();
  expect(res.token).toBe("token");
});
```

Anti-patterns

- Instantiating real DB clients in service unit tests.

4. Repository Layer Testing (Prisma / DB Queries)

- Goal: validate queries, mappings, and Prisma usage.
- Two approaches: run against test database (recommended) or mock Prisma client.

Test DB approach (recommended):

- Use a dedicated test database (local Docker or ephemeral) and run migrations/seeds before the suite.
- Use transactions per test (begin/rollback) or truncate tables between tests.

Example (beforeEach / afterEach):

```ts
import { prisma } from "../../src/prisma";

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

Mocking Prisma (when test DB is impractical):

- Create a thin wrapper around Prisma client and mock the wrapper methods with `vi.fn()`.

5. Controller Testing (HTTP request/response, validation)

- Use `supertest` against the Express/Koa/Fastify `app` instance to exercise controllers and middleware.
- Inject mocked services to keep controllers deterministic.

Example:

```ts
import request from "supertest";
import { app } from "../../src/server";

it("POST /api/auth/login returns 200 and user", async () => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "test@example.com", password: "password" });

  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty("user");
});
```

6. Middleware Testing (Auth, CORS, Rate Limiting)

- Test middleware in isolation by invoking the middleware function with mocked `req`, `res`, `next` objects.
- For middleware integrated behavior, exercise via `supertest` and assert status codes/headers.

Example (isolated):

```ts
const mockReq: any = { headers: { authorization: "Bearer token" } };
const mockRes: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
const next = vi.fn();

await authMiddleware(mockReq, mockRes, next);
expect(next).toHaveBeenCalled();
```

7. Integration Testing (API endpoints with supertest)

- Use test DB and app instance. Keep tests deterministic by seeding known data.
- Prefer `beforeAll` to create app and DB connection; `afterAll` to teardown.

Example:

```ts
beforeAll(async () => {
  await runMigrations();
  await seedTestData();
});

test("GET /api/v1/progress returns list", async () => {
  const res = await request(app).get("/api/v1/progress");
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});
```

8. Mock Strategies & Dependency Injection

- Prefer constructor injection for services and thin adapters for SDKs so tests can inject mocks.
- Use `vi.mock()` for module-level mocks when necessary, but prefer explicit injected mocks for clarity.
- Keep mock shapes identical to real clients (same method names and response shapes).

9. Database Testing (Isolation, Cleanup, Seeding)

- Approaches:
  - Transaction rollback per test (fast, reliable) — requires DB that supports nested transactions or savepoints.
  - Truncate & reseed between tests (simple, robust).
  - Use ephemeral containers (Testcontainers) for CI.
- Seed fixtures must be minimal and deterministic.

10. Common Patterns and Anti-patterns

- Patterns:
  - Arrange / Act / Assert structure
  - Small focused tests (one behavior per test)
  - Use factories for test data
  - Use test-specific config for external services (reduced bcrypt cost)

- Anti-patterns:
  - Overly large integration tests that assert many concerns
  - Relying on order of tests (make tests idempotent)
  - Mock shape drift — ensure mocks mirror real client responses

11. Troubleshooting

- Slow tests: reduce bcrypt rounds, mock external network, use in-memory caches.
- Flaky DB tests: ensure proper isolation and deterministic seeding; prefer truncation or transactions.
- ESM mocking issues: favor explicit injected mocks rather than heavy module mocking.

12. Cross-references

- Backend setup: [Backend Development Guide](../setup/backend-development.md)
- Prisma schema: `apps/backend/prisma/schema.prisma`
- API response patterns: [../knowledge-base/api-response-patterns.md](../../knowledge-base/api-response-patterns.md)

---

## Example Test Files (quick index)

- `tests/services/AuthService.spec.ts`
- `tests/repositories/UserRepository.spec.ts`
- `tests/controllers/AuthController.spec.ts`
- `tests/integration/auth.e2e.spec.ts`
