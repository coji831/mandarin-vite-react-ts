# Backend Conventions & Architecture (Quick Reference)

**Last Updated:** June 13, 2026

> **Deep Dive:** For Clean Architecture patterns and design principles, see [backend-architecture.md](../knowledge-base/backend-architecture.md)

---

## Clean Architecture Layers

**Flow:** Controllers → Services → Repositories → Infrastructure

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

**Last Updated:** June 10, 2026
**Purpose:** Standard for creating and maintaining backend modules in the modular monolith
**Audience:** Backend developers

> See also: [SOLID Principles](../../knowledge-base/solid-principles.md)

---

### 1. Module Structure Templates

Each module picks the architectural pattern that fits its complexity. There are three templates:

#### 1.1 Simple CRUD Template

For modules with basic database operations and no complex business rules (auth, word, gamification, conversation).

```
modules/<name>/
├── api/
│   ├── <Name>Controller.js       # Express handlers (thin, no business logic)
│   └── <name>Routes.js           # Route definitions
├── services/
│   └── <Name>Service.js          # Business logic
├── repositories/
│   └── <Name>Repository.js       # Prisma data access
├── __tests__/
│   ├── <Name>Service.test.js
│   └── <Name>Controller.test.js
└── index.js                       # Public API exports
```

**Rules:**

- Controller: parse request, call service, return response — no business logic
- Service: business rules, validation, orchestration — no HTTP, no raw DB
- Repository: Prisma queries only — one method per query

#### 1.2 Feature Slices Template

For modules with mixed concerns where strict layering adds overhead (vocabulary, examples).

```
modules/<name>/
├── api/
│   ├── <Name>Controller.js
│   └── <name>Routes.js
├── services/                      # Can contain multiple related services
├── repositories/
├── __tests__/
└── index.js
```

**Rules:**

- Services may call other services within the same module directly
- No domain/ or interfaces/ layer unless complexity demands it
- Cross-module calls must go through `index.js` public API

#### 1.3 Clean Architecture Template

For modules with complex business rules, multiple entities, and evolving requirements (quiz).

```
modules/<name>/
├── api/
│   ├── <Name>Controller.js
│   └── <name>Routes.js
├── domain/
│   ├── entities/                  # Business entities with behavior
│   └── interfaces/                # Repository contracts (JSDoc @typedef)
├── use-cases/                     # Application-specific business rules
├── repositories/                  # Interface implementations
├── __tests__/
│   ├── use-cases/
│   └── api/
└── index.js
```

**Rules:**

- `domain/` has zero dependencies on `api/`, `repositories/`, or infrastructure
- `use-cases/` depend on `domain/interfaces/` only (Dependency Inversion)
- `repositories/` implement interfaces from `domain/interfaces/`
- `api/` calls `use-cases/` — never calls `repositories/` directly

---

### 2. Public API Contract (`index.js`)

Every module's `index.js` is its **public contract**. Only what's exported here is accessible to other modules or `container.js`.

```javascript
// ✅ GOOD — explicit public API
export { WordService } from "./services/WordService.js";
export { Word } from "./domain/Word.js";

// ❌ BAD — exposing internals
export { WordRepository } from "./repositories/WordRepository.js";
export { wordRoutes } from "./api/wordRoutes.js";
```

#### Import Rules

```javascript
// ✅ ALLOWED — importing from another module's public API
import { WordService } from "../word/index.js";
import { authMiddleware } from "../../shared/middleware/index.js";
import { config } from "../../shared/config/index.js";
import { prisma } from "../../infrastructure/database/client.js";

// ❌ FORBIDDEN — importing another module's internals
import { WordRepository } from "../word/repositories/WordRepository.js";
import { QuizSession } from "../quiz/domain/entities/QuizSession.js";
```

#### Factory Functions (Optional)

Modules with complex DI can export a factory function instead of bare classes:

```javascript
// modules/quiz/index.js
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
word (zero external deps)         auth (zero external deps)
  <- vocabulary                       <- gamification
  <- quiz
  <- examples
```

- `word` and `auth` are **foundation modules** — they depend on nothing but infrastructure
- All other modules depend only on `word` and/or `auth`
- Circular dependencies are **forbidden**

#### 3.2 What a Module Can Import

| Source                          | Allowed?                         | Notes                                                |
| ------------------------------- | -------------------------------- | ---------------------------------------------------- |
| Its own files                   | ✅ Always                        | Any internal file can import any other internal file |
| Other module's `index.js`       | ✅ If listed in dependency graph | Only exported symbols                                |
| `shared/config/`                | ✅ Config values only            | No business logic                                    |
| `shared/middleware/`            | ✅ Middleware functions          | Auth, error handling, caching                        |
| `shared/utils/`                 | ✅ Pure utility functions        | Logger, validators, date utils                       |
| `infrastructure/cache/`         | ✅ Via DI only                   | Never instantiated inside module                     |
| `infrastructure/database/`      | ✅ Via DI only                   | Prisma client injected from container                |
| `infrastructure/security/`      | ✅ Via DI only                   | JWT, password, HMAC services                         |
| `infrastructure/external/`      | ✅ Via DI only                   | Gemini, GCS, TTS clients                             |
| `process.env`                   | ❌ Never                         | Use `shared/config/index.js` instead                 |
| Another module's internal files | ❌ Never                         | Must go through `index.js`                           |

---

### 4. Verification Gates

Each phase must pass these gates before moving to the next:

#### Gate 1: No Compile Errors

```bash
# Backend
cd apps/backend && node -e "require('./src/container.js')"  # or import check

# Alternative: run a syntax/import check
cd apps/backend && node --check src/index.js
```

#### Gate 2: Module Public API Verified

```bash
# Check each module exports only what's expected
grep -r "export {" src/modules/*/index.js
```

---

## Controllers

**Pattern:** Extract request ? Call service ? Return JSON

```javascript
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const { user, token } = await authService.login(email, password);
    res.cookie("auth_token", token, { httpOnly: true });
    res.json({ user });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});
```

**Checklist:** ? Thin ? Calls service ? Handles response ? Sets cookies/headers

---

## Services

**Pattern:** Pure business logic, reusable, testable

```javascript
export class AuthService {
  constructor(container) {
    this.userRepository = container.get("userRepository");
    this.jwtService = container.get("jwtService");
  }

  async login(email, password) {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AuthError("Invalid credentials", 401);
    }
    const token = this.jwtService.sign({ id: user.id, email });
    return { user, token };
  }
}
```

**Checklist:** ? No HTTP ? Uses repos ? Throws errors ? Stateless

---

## Repositories

**Pattern:** Data access only, one per entity

```javascript
export class UserRepository {
  async findById(id) {
    return this.prisma.user.findUnique({ where: { id } });
  }
  async findByEmail(email) {
    return this.prisma.user.findUnique({ where: { email } });
  }
  async findAll() {
    return this.prisma.user.findMany();
  }
  async create(data) {
    return this.prisma.user.create({ data });
  }
  async update(id, data) {
    return this.prisma.user.update({ where: { id }, data });
  }
  async delete(id) {
    return this.prisma.user.delete({ where: { id } });
  }
}
```

**Naming:** `{Entity}Repository.js`, methods = `find*()`, `create()`, `update()`, `delete()`

**Checklist:** ? Pure data access ? No logic ? Returns Prisma results

---

## Middleware & Error Handling

**Order:** CORS ? Body parsing ? Logging ? Auth ? Routes ? Error handler

```javascript
// Auth middleware
export const authMiddleware = (req, res, next) => {
  const token = req.cookies.auth_token || req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token required" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Error handler (last middleware)
app.use((error, req, res, next) => {
  logger.error("Error:", { error: error.message });
  res.status(error.statusCode || 500).json({ error: error.message });
});
```

---

## Error Scoping Pattern

**Critical:** Declare variables outside try block for error context

```javascript
// ? Correct
async markProgress(req, res) {
  let userId, wordId;
  try {
    userId = req.user.id;
    wordId = req.body.wordId;

    const progress = await this.progressService.mark(userId, wordId);
    res.json({ success: true, progress });
  } catch (error) {
    logger.error("Mark progress failed", { userId, wordId, error: error.message });
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}
```

**Why:** Enables proper logging, auditing, rate limiting, and debugging.

---

## Dependency Injection

**Pattern:** Use container to inject dependencies (no `new` in services)

```javascript
// Container setup
const container = {
  get(name) {
    const services = {
      userRepository: new UserRepository(prisma),
      jwtService: new JwtService(),
      authService: new AuthService(container),
    };
    return services[name];
  },
};

// Usage
const authService = container.get("authService");
```

---

## API Response Format

**Success:**

```javascript
{ success: true, data: { /* entity */ } }
{ success: true, user: { id, email }, token }
```

**Error:**

```javascript
{ success: false, error: "descriptive message", code: "ERROR_CODE" }
{ error: "Invalid credentials", statusCode: 401 }
```

---

## Testing Patterns

**Unit test service (no HTTP):**

```javascript
describe("AuthService", () => {
  it("should login with valid credentials", async () => {
    const mockRepo = { findByEmail: jest.fn().mockResolvedValue(user) };
    const service = new AuthService({ get: () => mockRepo });

    const result = await service.login("test@example.com", "password");
    expect(result.token).toBeDefined();
  });
});
```

**Integration test controller (with HTTP):**

```javascript
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

| Topic                  | File                                                                 |
| ---------------------- | -------------------------------------------------------------------- |
| Architecture deep dive | [backend-architecture.md](../knowledge-base/backend-architecture.md) |
| Backend development    | [Backend Development Guide](../setup/backend-development.md)         |
| Database setup         | [Database Setup Guide](../setup/database.md)                         |
| API patterns           | [API Client Patterns](../conventions/api-client.md)                  |
| Workflow               | [Workflow Guide](../operations/workflow.md)                          |

---

## Key Resources

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Prisma ORM Docs](https://www.prisma.io/docs/orm)
