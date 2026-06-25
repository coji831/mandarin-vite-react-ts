# Advanced Backend Patterns

**Category:** Backend Development  
**Last Updated:** December 9, 2025

---

## Service Layer with Interfaces

**When Adopted:** Epic 11 (Service Layer Overhaul)  
**Why:** Decouple implementation from interface, easy testing, backend swaps  
**Use Case:** Multi-backend support, fallback logic, testing

### Minimal Example

```typescript
// 1. Define interface (contract)
interface IVocabularyService {
  getVocabularyList(listId: string): Promise<VocabularyList>;
  getAllLists(): Promise<VocabularyList[]>;
}

interface ITTSService {
  generateAudio(text: string, language: string): Promise<Buffer>;
  getCachedAudio(text: string): Promise<Buffer | null>;
}

// 2. Implementation A (CSV-based)
class CSVVocabularyService implements IVocabularyService {
  async getVocabularyList(listId: string): Promise<VocabularyList> {
    const csvPath = `./data/vocabulary/${listId}.csv`;
    const data = await Papa.parseAsync(csvPath);
    return this.transformToVocabularyList(data);
  }

  async getAllLists(): Promise<VocabularyList[]> {
    const manifestPath = "./data/vocabulary/manifest.json";
    const manifest = await fs.readFile(manifestPath, "utf-8");
    return JSON.parse(manifest);
  }

  private transformToVocabularyList(data: any): VocabularyList {
    // Transform logic
  }
}

// 3. Implementation B (Database)
class DatabaseVocabularyService implements IVocabularyService {
  constructor(private prisma: PrismaClient) {}

  async getVocabularyList(listId: string): Promise<VocabularyList> {
    return this.prisma.vocabularyList.findUnique({
      where: { id: listId },
      include: { words: true },
    });
  }

  async getAllLists(): Promise<VocabularyList[]> {
    return this.prisma.vocabularyList.findMany();
  }
}

// 4. Service with fallback
class FallbackVocabularyService implements IVocabularyService {
  constructor(private primary: IVocabularyService, private fallback: IVocabularyService) {}

  async getVocabularyList(listId: string): Promise<VocabularyList> {
    try {
      return await this.primary.getVocabularyList(listId);
    } catch (error) {
      console.warn("Primary service failed, using fallback:", error);
      return await this.fallback.getVocabularyList(listId);
    }
  }

  async getAllLists(): Promise<VocabularyList[]> {
    try {
      return await this.primary.getAllLists();
    } catch (error) {
      console.warn("Primary service failed, using fallback:", error);
      return await this.fallback.getAllLists();
    }
  }
}

// 5. Dependency injection
class VocabularyController {
  constructor(private service: IVocabularyService) {}

  async handleGetList(req: Request, res: Response) {
    const { listId } = req.params;
    const list = await this.service.getVocabularyList(listId);
    res.json(list);
  }
}

// 6. Setup with config
const config = {
  useDatabase: process.env.USE_DATABASE === "true",
};

const primaryService = config.useDatabase
  ? new DatabaseVocabularyService(prisma)
  : new CSVVocabularyService();

const fallbackService = new CSVVocabularyService();

const service = new FallbackVocabularyService(primaryService, fallbackService);
const controller = new VocabularyController(service);
```

### Key Lessons

- Interfaces define contracts, not implementations
- Use dependency injection (pass service to controller)
- Fallback services wrap primary services
- Switch backends via environment variables
- Test each implementation independently

### When to Use

Multiple backends, testing with mocks, gradual migration

---

## Monorepo with npm Workspaces

**When Adopted:** Epic 13 (Production Backend Architecture)  
**Why:** Share code between frontend and backend, single repo  
**Use Case:** Full-stack TypeScript projects

### Minimal Example

```json
// package.json (root)
{
  "name": "mandarin-app",
  "private": true,
  "workspaces": ["apps/frontend", "apps/backend", "packages/shared"],
  "scripts": {
    "dev": "npm run dev --workspaces",
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces"
  }
}
```

```
project/
├── package.json                 (root)
├── apps/
│   ├── frontend/
│   │   ├── package.json        (workspace)
│   │   ├── src/
│   │   └── vite.config.ts
│   └── backend/
│       ├── package.json        (workspace)
│       ├── src/
│       └── tsconfig.json
└── packages/
    └── shared/
        ├── package.json        (workspace)
        ├── src/
        │   ├── types.ts       (shared types)
        │   └── constants.ts
        └── tsconfig.json
```

```json
// apps/frontend/package.json
{
  "name": "@mandarin/frontend",
  "dependencies": {
    "@mandarin/shared": "*",  // Link to shared package
    "react": "^18.0.0"
  }
}

// apps/backend/package.json
{
  "name": "@mandarin/backend",
  "dependencies": {
    "@mandarin/shared": "*",  // Link to shared package
    "express": "^4.18.0"
  }
}

// packages/shared/package.json
{
  "name": "@mandarin/shared",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc"
  }
}
```

```typescript
// packages/shared/src/types.ts
export interface VocabularyWord {
  id: string;
  chinese: string;
  pinyin: string;
  english: string;
}

// apps/backend/src/controllers/vocabulary.ts
import { VocabularyWord } from "@mandarin/shared";

export async function getWords(): Promise<VocabularyWord[]> {
  // Backend uses shared types
}

// apps/frontend/src/pages/Vocabulary.tsx
import { VocabularyWord } from "@mandarin/shared";

function VocabularyPage() {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  // Frontend uses shared types
}
```

### Commands

```bash
# Install all workspaces
npm install

# Run script in specific workspace
npm run dev --workspace=apps/frontend
npm run test --workspace=apps/backend

# Run script in all workspaces
npm run build --workspaces

# Add dependency to specific workspace
npm install express --workspace=apps/backend
```

### Key Lessons

- Shared types prevent frontend/backend drift
- Use `*` for internal package versions
- Build shared packages before apps
- Each workspace has its own `node_modules`

### When to Use

Full-stack TypeScript projects, code sharing between packages

---

## Error Handling Middleware

**When Adopted:** Epic 12 (Conversation UI Enhancements)  
**Why:** Consistent error responses, structured logging  
**Use Case:** Production APIs, debugging

### Minimal Example

```typescript
// 1. Error types
class AppError extends Error {
  constructor(public statusCode: number, public message: string, public code?: string) {
    super(message);
  }
}

class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message, "VALIDATION_ERROR");
  }
}

class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`, "NOT_FOUND");
  }
}

// 2. Error middleware
function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers["x-request-id"] || crypto.randomUUID();

  // Log error with context
  console.error({
    requestId,
    method: req.method,
    url: req.url,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
  });

  // Send structured response
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        requestId,
      },
    });
  }

  // Unknown errors (don't leak details)
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
      requestId,
    },
  });
}

// 3. Usage in routes
app.get("/api/vocabulary/:listId", async (req, res, next) => {
  try {
    const { listId } = req.params;

    if (!listId) {
      throw new ValidationError("listId is required");
    }

    const list = await vocabularyService.getList(listId);

    if (!list) {
      throw new NotFoundError("Vocabulary list");
    }

    res.json(list);
  } catch (error) {
    next(error); // Pass to error middleware
  }
});

// 4. Register middleware (LAST)
app.use(errorHandler);
```

### Key Lessons

- Use request IDs for tracing
- Log errors with full context
- Never expose internal errors to users
- Register error middleware last

### When to Use

All production APIs

---

**Related Guides:**

- [Backend Architecture](./backend-architecture.md) — Clean Architecture
- [Deployment](./infra-deployment.md) — Environment configuration
