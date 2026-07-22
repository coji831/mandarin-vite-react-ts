# Backend Conventions & Architecture (Quick Reference)

**Last Updated:** July 22, 2026

> **Deep Dive:** For architecture patterns and design principles, see [backend-architecture.md](../knowledge-base/backend/backend-architecture.md)

---

## Module Architecture Patterns

**Flow:** Varies per module — see Module Pattern Selection in the architecture doc.

| Layer          | Responsibility          | Access         |
| -------------- | ----------------------- | -------------- |
| Controller     | Parse request, call svc | req, res       |
| Service        | Business logic          | Domain, repos  |
| Repository     | Data access             | Prisma         |
| Infrastructure | External APIs, cache    | Database, APIs |

**Rules:**

- No business logic in controllers
- No database queries in services
- No HTTP knowledge in services

---

## Module Architecture Guide

**Last Updated:** July 22, 2026
**Purpose:** Standard for creating and maintaining backend modules in the modular monolith
**Audience:** Backend developers

> See also: [SOLID Principles](../../knowledge-base/practices/solid-principles.md)

---

### 1. Module Structure Templates

Each module picks the architectural pattern that fits its complexity. All modules now use TypeScript (`.ts`). There are three templates:

#### 1.1 Simple CRUD Template

For modules with basic database operations and no complex business rules (auth, word, gamification, conversation).

```
modules/<name>/
├── api/
│   ├── <Name>Controller.ts       # Express handlers (thin, no business logic)
│   └── <name>Routes.ts           # Route definitions
├── services/
│   └── <Name>Service.ts          # Business logic
├── repositories/
│   └── <Name>Repository.ts       # Prisma data access
├── types/
│   └── index.ts                  # Barrel re-exporting module types
├── __tests__/
│   ├── <Name>Service.test.ts
│   └── <Name>Controller.test.ts
└── index.ts                       # Public API exports
```

**Rules:**

- Controller: parse request, call service, return response — no business logic
- Service: business rules, validation, orchestration — no HTTP, no raw DB
- Repository: Prisma queries only — one method per query
- Types: All inline interfaces extracted to `types/` directory with barrel re-exports; no `Record<string, unknown>` casts, no `as unknown as` double casts

#### 1.2 Feature Slices Template

For modules with mixed concerns where strict layering adds overhead (vocabulary, examples).

```
modules/<name>/
├── api/
│   ├── <Name>Controller.ts
│   └── <name>Routes.ts
├── services/                      # Can contain multiple related services
├── repositories/
├── types/
│   └── index.ts
├── __tests__/
└── index.ts
```

**Rules:**

- Services may call other services within the same module directly
- No domain/ or interfaces/ layer unless complexity demands it
- Cross-module calls must go through `index.ts` public API

#### 1.3 Clean Architecture Template

For modules with complex business rules, multiple entities, and evolving requirements (quiz).

```
modules/<name>/
├── api/
│   ├── <Name>Controller.ts
│   └── <name>Routes.ts
├── domain/
│   ├── entities/                  # Business entities with behavior
│   └── interfaces/                # Repository contracts
├── use-cases/                     # Application-specific business rules
├── repositories/                  # Interface implementations
├── types/
│   └── index.ts
├── __tests__/
│   ├── use-cases/
│   └── api/
└── index.ts
```

**Rules:**

- `domain/` has zero dependencies on `api/`, `repositories/`, or infrastructure
- `use-cases/` depend on `domain/interfaces/` only (Dependency Inversion)
- `repositories/` implement interfaces from `domain/interfaces/`
- `api/` calls `use-cases/` — never calls `repositories/` directly

---

### 2. Public API Contract (`index.ts`)

Every module's `index.ts` is its **public contract**. Only what's exported here is accessible to other modules or `container.ts`.

```typescript
// ✅ GOOD — explicit public API
export { WordService } from "./services/WordService.js";
export { Word } from "./domain/Word.js";

// ❌ BAD — exposing internals
export { WordRepository } from "./repositories/WordRepository.js";
export { wordRoutes } from "./api/wordRoutes.js";
```

> **Note:** TypeScript source files are `.ts`, but the `.js` extension in import paths refers to the compiled output (Node.js ESM requires file extensions in imports).

#### Import Rules

```typescript
// ✅ ALLOWED — importing from another module's public API
import { WordService } from "../word/index.js";
import { authMiddleware } from "../../shared/middleware/index.js";
import { config } from "../../shared/config/index.js";
import { prisma } from "../../shared/infrastructure/database/client.js";

// ❌ FORBIDDEN — importing another module's internals
import { WordRepository } from "../word/repositories/WordRepository.js";
import { QuizSession } from "../quiz/domain/entities/QuizSession.js";
```

#### Factory Functions (Optional)

Modules with complex DI can export a factory function instead of bare classes:

```typescript
// modules/quiz/index.ts
import { QuizSessionService } from "./use-cases/QuizSessionService.js";
import { AnswerRecordingService } from "./use-cases/AnswerRecordingService.js";
import { SummaryService } from "./use-cases/SummaryService.js";
// ... repositories ...

export function createQuizModule({ wordService, prisma, cacheService }) {
  const sessionRepo = new QuizSessionRepository(prisma);
  const answerRepo = new QuizSessionAnswerRepository(prisma);
  const answerService = new AnswerRecordingService(answerRepo);
  const summaryService = new SummaryService(/* ... */);

  const quizService = new QuizSessionService({
    sessionRepository: sessionRepo,
    learningService: new LearningService(/* ... */),
    answerRecordingService: answerService,
    summaryService,
  });

  return { quizService, answerService, summaryService };
}
```

---

### 3. Cross-Module Dependency Rules

#### 3.1 Dependency Graph

```
word (zero external deps)         auth (zero external deps)         mnemonics (zero external deps)
  <- vocabulary                       <- gamification
  <- quiz
  <- examples
```

- `word`, `auth`, and `mnemonics` are **foundation modules** — they depend on nothing but infrastructure
- All other modules depend only on `word` and/or `auth`
- Circular dependencies are **forbidden**

#### 3.2 What a Module Can Import

| Source                          | Allowed?                         | Notes                                                |
| ------------------------------- | -------------------------------- | ---------------------------------------------------- |
| Its own files                   | ✅ Always                        | Any internal file can import any other internal file |
| Other module's `index.ts`       | ✅ If listed in dependency graph | Only exported symbols                                |
| `shared/config/`                | ✅ Config values only            | No business logic                                    |
| `shared/middleware/`            | ✅ Middleware functions          | Auth, error handling, caching                        |
| `shared/utils/`                 | ✅ Pure utility functions        | Logger, validators, date utils                       |
| `infrastructure/cache/`         | ✅ Via DI only                   | Never instantiated inside module                     |
| `infrastructure/database/`      | ✅ Via DI only                   | Prisma client injected from container                |
| `infrastructure/security/`      | ✅ Via DI only                   | JWT, password, HMAC services                         |
| `infrastructure/external/`      | ✅ Via DI only                   | Gemini, GCS, TTS clients                             |
| `process.env`                   | ❌ Never                         | Use `shared/config/index.ts` instead                 |
| Another module's internal files | ❌ Never                         | Must go through `index.ts`                           |

---

### 4. Module-Level Container Pattern

Each module exports a **typed factory function** from its own `container.ts`:

```typescript
// modules/<name>/container.ts
export interface XModuleDeps {
  /* external deps only — repos, shared services */
}

export function createXModule(deps: XModuleDeps): { controller: XController };
```

The factory defines a typed dependency interface, instantiates internal layers (repository → service → controller), and returns a minimal result (typically `{ controller }`). Services that other modules depend on can also be returned.

The root `container.ts` (`app/container.ts`) imports all module factories and calls them with infrastructure singletons:

```typescript
// app/container.ts — declarative wiring
const cacheService = await CacheFactory.create("default");
const geminiService = new GeminiService(geminiClient);

const mnemonicsModule = createMnemonicsModule({ geminiService, cacheService });
const authModule = createAuthModule({ authRepository, jwtService, passwordService });

export const mnemonicsController = mnemonicsModule.controller;
export const authController = authModule.controller;
```

**Benefits:**

- **Explicit dependencies** — each factory has a typed `Deps` interface
- **Testable modules** — `createXModule(mockDeps)` works without the full container
- **Reduced merge conflicts** — each module's wiring is in its own file
- **NestJS migration path** — factory body → `@Module({ providers: [...], controllers: [...] })`

> **Deep dive:** See `docs/knowledge-base/backend/module-level-containers.md` for full explanation with code examples, migration path, and tradeoff analysis.

---

### 5. Pre-Commit Checks

The following checks should pass before committing:

1. **No Compile Errors** — `cd apps/backend && npx tsc --noEmit`
2. **Module Public API Verified** — Check that each module's `index.ts` only exports intended symbols (services, not internals like repositories or routes)

---

## Controllers

**Pattern:** Extract request → Call service → Return JSON

Controllers are thin — they parse input, delegate to services, and format responses. No business logic.

```typescript
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const { user, token } = await authService.login(email, password);
    res.cookie("auth_token", token, { httpOnly: true });
    res.json({ success: true, data: { user } });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});
```

**Checklist:** ☐ Thin ☐ Calls service ☐ Handles response ☐ Sets cookies/headers

---

## Services

**Pattern:** Pure business logic, reusable, testable. Services receive dependencies via constructor injection.

```typescript
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AuthError("Invalid credentials", 401);
    }
    const token = this.jwtService.sign({ id: user.id, email });
    return { user, token };
  }
}
```

**Checklist:** ☐ No HTTP ☐ Uses repos ☐ Throws errors ☐ Stateless

---

## Repositories

**Pattern:** Data access only, one per entity. All database access goes through repositories — services never touch Prisma directly.

```typescript
export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
  async findAll() {
    return this.prisma.user.findMany();
  }
  async create(data: CreateUserInput) {
    return this.prisma.user.create({ data });
  }
  async update(id: string, data: UpdateUserInput) {
    return this.prisma.user.update({ where: { id }, data });
  }
  async delete(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
```

**Naming:** `{Entity}Repository.ts`, methods = `find*()`, `create()`, `update()`, `delete()`

**Checklist:** ☐ Pure data access ☐ No logic ☐ Returns Prisma results

---

## Middleware & Error Handling

**Order:** CORS → Body parsing → Logging → Auth → Routes → Error handler

```typescript
// Auth middleware
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.auth_token || req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token required" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Error handler (last middleware)
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error("Error:", { error: error.message });
  res.status((error as any).statusCode || 500).json({ error: error.message });
});
```

---

## Error Scoping Pattern

**Critical:** Declare variables outside try block for error context

```typescript
// ✅ Correct
async markProgress(req: Request, res: Response) {
  let userId: string, wordId: string;
  try {
    userId = req.user.id;
    wordId = req.body.wordId;

    const progress = await this.progressService.mark(userId, wordId);
    res.json({ success: true, data: { progress } });
  } catch (error) {
    logger.error("Mark progress failed", { userId, wordId, error: (error as Error).message });
    res.status((error as any).statusCode || 500).json({ error: (error as Error).message });
  }
}
```

**Why:** Enables proper logging, auditing, rate limiting, and debugging.

---

## Dependency Injection

**Pattern:** Constructor injection with direct instantiation (no container registry)

Services receive dependencies via constructor parameters. The DI composition root in `container.ts` instantiates all services with their dependencies:

```typescript
// Container setup (composition root)
import { PrismaClient } from "@prisma/client";
import { UserRepository } from "../modules/auth/repositories/UserRepository.js";
import { JwtService } from "../shared/infrastructure/security/JwtService.js";
import { AuthService } from "../modules/auth/services/AuthService.js";

const prisma = new PrismaClient();
const userRepository = new UserRepository(prisma);
const jwtService = new JwtService();
const authService = new AuthService(userRepository, jwtService);

export { authService /* ... */ };
```

There is no `container.get()` registry pattern. Dependencies are wired explicitly at the composition root. See `apps/backend/src/app/container.ts` for the full setup.

---

## Types Directory Pattern

Every module has a `types/` directory with an `index.ts` barrel that re-exports all type definitions for that module. This eliminates `Record<string, unknown>` casts and `as unknown as` double casts.

```typescript
// modules/auth/types/index.ts
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: { id: string; email: string };
  token: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
}
```

**No-cast rule:** Never use `Record<string, unknown>` where a typed interface exists. Never use `as unknown as` double casts. Define and use proper types.

---

## API Response Format

**Success:**

```typescript
{ success: true, data: { /* entity */ } }
{ success: true, user: { id, email }, token }
```

**Error:**

```typescript
{ success: false, error: "descriptive message", code: "ERROR_CODE" }
{ error: "Invalid credentials", statusCode: 401 }
```

---

## Testing Patterns

**Framework:** Vitest (not Jest). Use `vi.fn()` instead of `jest.fn()`.

**Unit test service (no HTTP):**

```typescript
import { describe, it, expect, vi } from "vitest";

describe("AuthService", () => {
  it("should login with valid credentials", async () => {
    const mockRepo = { findByEmail: vi.fn().mockResolvedValue(user) };
    const mockJwt = { sign: vi.fn().mockReturnValue("token") };
    const service = new AuthService(mockRepo as any, mockJwt as any);

    const result = await service.login("test@example.com", "password");
    expect(result.token).toBeDefined();
  });
});
```

**Integration test controller (with HTTP):**

```typescript
describe("POST /api/v1/login", () => {
  it("should set auth cookie and return user", async () => {
    const res = await request(app)
      .post("/api/v1/login")
      .send({ email: "test@example.com", password: "password" });

    expect(res.status).toBe(200);
    expect(res.cookies.auth_token).toBeDefined();
  });
});
```

---

## Documentation Reference

| Topic                  | File                                                                         |
| ---------------------- | ---------------------------------------------------------------------------- |
| Architecture deep dive | [backend-architecture.md](../knowledge-base/backend/backend-architecture.md) |
| Backend development    | [Backend Development Guide](../setup/backend-development.md)                 |
| Database setup         | [Database Setup Guide](../setup/database.md)                                 |
| API patterns           | [API Client Patterns](../conventions/api-client.md)                          |
| Workflow               | [Workflow Guide](../operations/workflow.md)                                  |

---

## Key Resources

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Prisma ORM Docs](https://www.prisma.io/docs/orm)
- [SOLID Principles](../../knowledge-base/practices/solid-principles.md)
