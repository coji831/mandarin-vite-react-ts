# Module-Level Container Pattern

**Category:** Backend Development
**Last Updated:** July 21, 2026

---

## Problem: The Monolithic Composition Root

As the application grows, the central DI container (`app/container.ts`) becomes a bottleneck:

- **150+ lines** mixing infrastructure setup, repository instantiation, and module wiring
- **Hidden dependencies** — it's hard to tell which modules depend on which services without reading the whole file
- **Inline type casts** — `as any` and `as unknown as X` proliferate because the container lacks typed factory signatures
- **Namespace imports** — importing every module's entire `index.ts` just to extract one or two symbols
- **Merge conflicts** — every module change touches the same file, creating frequent git conflicts
- **No isolated testing** — you can't instantiate a module's full dependency graph without the entire container

```
// ❌ Monolithic container — everything inline
import { WordService } from "../modules/word/services/WordService.js";
import { AuthService } from "../modules/auth/services/AuthService.js";
import { QuizService } from "../modules/quiz/services/QuizService.js";
// ... 30+ more imports ...

const wordService = new WordService(/* ... */);
const authService = new AuthService(/* ... */, jwtService);
const quizService = new QuizService(/* ... */, wordService, cacheService);
// ... every new module adds more noise ...
```

---

## Pattern: Module-Level Container Factories

Each module exports a **typed factory function** from its own `container.ts`. The root container only imports these factories and calls them with infrastructure singletons.

### Module Factory Signature

```typescript
// modules/<name>/container.ts
export interface XModuleDeps {
  /* only the external deps this module needs */
}

export function createXModule(deps: XModuleDeps): { controller: XController };
```

The factory:

1. Defines a **typed deps interface** — every external dependency is explicit
2. **Instantiates internals** — repos, services, etc. that no other module needs to know about
3. **Returns a minimal result** — typically just `{ controller }`; services can also be returned if other modules depend on them

### Concrete Examples

#### Simple Module (Mnemonics)

```typescript
// modules/mnemonics/container.ts
import { MnemonicsController } from "./api/MnemonicsController.js";
import { MnemonicsService } from "./services/MnemonicsService.js";
import { MnemonicsRepository } from "./repositories/MnemonicsRepository.js";
import { GeminiService } from "../../shared/services/GeminiService.js";
import { CacheService } from "../../shared/infrastructure/cache/CacheService.js";

export interface MnemonicsModuleDeps {
  geminiService: GeminiService;
  cacheService: CacheService;
}

export function createMnemonicsModule(deps: MnemonicsModuleDeps) {
  const repository = new MnemonicsRepository();
  const service = new MnemonicsService(repository, deps.geminiService, deps.cacheService);
  const controller = new MnemonicsController(service);
  return { controller };
}
```

#### Auth Module (Repository Injected from Outside)

```typescript
// modules/auth/container.ts
import { AuthRepository } from "./repositories/AuthRepository.js";
import { AuthService } from "./services/AuthService.js";
import { AuthController } from "./api/AuthController.js";
import { JwtService } from "../../shared/infrastructure/security/JwtService.js";
import { PasswordService } from "../../shared/infrastructure/security/PasswordService.js";

export interface AuthModuleDeps {
  authRepository: AuthRepository;
  jwtService: JwtService;
  passwordService: PasswordService;
}

export function createAuthModule(deps: AuthModuleDeps) {
  const service = new AuthService(deps.authRepository, deps.jwtService, deps.passwordService);
  const controller = new AuthController(service);
  return { controller };
}
```

#### Thin Module (TTS — Passes a Shared Service)

```typescript
// modules/tts/container.ts
import { TtsService } from "../../shared/services/TtsService.js";
import TtsController from "./api/TtsController.js";

export interface TtsModuleDeps {
  ttsService: TtsService;
}

export function createTtsModule(deps: TtsModuleDeps) {
  const controller = new TtsController(deps.ttsService);
  return { controller };
}
```

---

## Root Container: Clean Composition Root

With module-level factories, the root `container.ts` becomes a **declarative wiring file** with four clear sections:

```typescript
// app/container.ts

// 1. Infrastructure singletons
const cacheService = await CacheFactory.create("default");
const jwtService = new JwtService();
const passwordService = new PasswordService();
const geminiService = new GeminiService(geminiClient);

// 2. Shared repositories (needed by multiple modules)
const authRepository = new AuthRepository();
const progressionRepository = new ProgressionRepository();

// 3. Module factory calls — order matters for cross-module deps
const foundationsModule = createFoundationsModule();
const radicalsModule = createRadicalsModule();
const mnemonicsModule = createMnemonicsModule({ geminiService, cacheService });
const authModule = createAuthModule({ authRepository, jwtService, passwordService });
const progressionModule = createProgressionModule({ progressionRepository /* ... */ });
const quizModule = createQuizModule({ quizRepository /* ... */ });

// 4. Re-exports for route mounting
export const mnemonicsController = mnemonicsModule.controller;
export const authController = authModule.controller;
```

**Key observations:**

- Infrastructure singletons live **outside** modules — they're pure technical services
- Repositories shared across modules (e.g., `AuthRepository`) are still instantiated in the root, **not** in module factories
- Module factories only receive **what they need**, nothing more
- Re-exporting `{ controller }` is a deliberate constraint — it forces the root container to think about what it exposes

---

## Benefits

| Benefit                     | Why                                                                                                             |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Explicit dependencies**   | Each factory has a typed `Deps` interface — you see every external dependency at a glance                       |
| **Testable modules**        | You can call `createXModule(mockDeps)` in tests without spinning up the full container                          |
| **Reduced merge conflicts** | Each module's factory is in its own `container.ts`; the root only imports factory functions                     |
| **Clean separation**        | Infrastructure singletons are NOT buried inside module factories — they're visible at the top level             |
| **Onboarding clarity**      | New developers can read one module's `container.ts` to understand its full dependency graph                     |
| **NestJS migration path**   | Each factory body maps directly to an `@Module({ providers: [...], controllers: [...] })` decorator (see below) |

---

## NestJS Migration Path

Each module-level container factory maps almost one-to-one to a NestJS `@Module()`:

```typescript
// Current factory
export function createMnemonicsModule(deps: MnemonicsModuleDeps) {
  const repository = new MnemonicsRepository();
  const service = new MnemonicsService(repository, deps.geminiService, deps.cacheService);
  const controller = new MnemonicsController(service);
  return { controller };
}

// → NestJS equivalent
@Module({
  imports: [], // other feature modules
  controllers: [MnemonicsController],
  providers: [
    MnemonicsRepository,
    {
      provide: MnemonicsService,
      useFactory: (repo, gemini, cache) => new MnemonicsService(repo, gemini, cache),
      inject: [MnemonicsRepository, GeminiService, CacheService],
    },
  ],
  exports: [], // only if cross-module
})
export class MnemonicsModule {}
```

The factory pattern essentially pre-structures the code for this migration:

- **Deps interface** → `inject:` array in NestJS `@Module()`
- **Factory body** → `providers:` array + `useFactory`
- **Return type** → `controllers:` + `exports:` arrays

---

## When to Use a Factory vs. Direct Instantiation

| Scenario                                                                             | Recommendation                                                                     |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Module has **no dependencies** on shared infrastructure                              | Direct instantiation in root container is fine                                     |
| Module uses **one or more shared services** (cache, Gemini, JWT)                     | Create a `container.ts` factory                                                    |
| Module is **depended on by other modules** (returns `service` not just `controller`) | Factory with explicit return type                                                  |
| Module is **leaf/utility** with no deps (e.g., `health`)                             | Can skip factory — but consistent use of factories across all modules is preferred |

---

## See Also

- `docs/guides/conventions/backend.md` — Backend conventions and Module Architecture Guide
- `docs/knowledge-base/backend/backend-architecture.md` — Modulith architecture overview
- `docs/knowledge-base/backend/backend-shared-kernel-layer.md` — Shared/kernel layer patterns
- `apps/backend/src/app/container.ts` — Root composition root
- `apps/backend/src/modules/*/container.ts` — Module-level factories
