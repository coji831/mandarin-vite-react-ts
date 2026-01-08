# Backend Architecture Patterns

**Category:** Backend Development  
**Last Updated:** December 9, 2025

---

## Clean Architecture (Controllers → Services → Repositories)

**When Adopted:** Epic 13 (Production Backend Architecture)  
**Why:** Separation of concerns, testability, maintainability  
**Use Case:** Scaling backend logic without spaghetti code

### Minimal Example

```typescript
// 1. Repository Layer (Data Access)
class ProgressRepository {
  async findByUserId(userId: string): Promise<Progress[]> {
    return prisma.progress.findMany({ where: { userId } });
  }

  async create(data: CreateProgressDTO): Promise<Progress> {
    return prisma.progress.create({ data });
  }
}

// 2. Service Layer (Business Logic)
class ProgressService {
  constructor(private repo: ProgressRepository) {}

  async updateProgress(userId: string, wordId: string): Promise<Progress> {
    // Business logic: calculate mastery level, update stats
    const current = await this.repo.findByUserId(userId);
    const mastery = this.calculateMastery(current, wordId);

    return this.repo.create({
      userId,
      wordId,
      mastery,
      lastReviewed: new Date(),
    });
  }

  private calculateMastery(progress: Progress[], wordId: string): number {
    // Complex business logic here
    return 0.75;
  }
}

// 3. Controller Layer (HTTP Handling)
app.post("/api/progress", async (req, res) => {
  try {
    const { userId, wordId } = req.body;
    const service = new ProgressService(new ProgressRepository());
    const result = await service.updateProgress(userId, wordId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Folder Structure

```
backend/
├── controllers/       # HTTP handlers (Express routes)
│   └── progressController.ts
├── services/          # Business logic
│   └── progressService.ts
├── repositories/      # Database access
│   └── progressRepository.ts
└── types/
    └── dto.ts         # Data Transfer Objects
```

### Key Lessons

- Controllers: thin, validate input, call services
- Services: business logic, orchestrate repositories
- Repositories: CRUD operations only
- DTOs: explicit types for request/response

### When to Use

Complex business logic, multiple data sources, testability required

---

## CORS (Cross-Origin Resource Sharing) Deep Dive

**Category:** Security & HTTP  
**Context:** Cookie-based authentication across origins

### What is CORS?

CORS is a browser security feature that prevents web pages from making requests to a different origin than the one that served the page. An origin is defined by the combination of **protocol + domain + port**.

**Different Origins:**

```
http://localhost:5173  → http://localhost:3001  (different port)
https://app.com        → https://api.app.com     (different subdomain)
http://example.com     → https://example.com     (different protocol)
```

**Same Origin:**

```
https://app.com/page1  → https://app.com/api/users  (same origin)
```

### CORS Request Flow

**1. Simple Requests (GET, POST with simple headers)**

```
Browser → Backend:
  GET /api/users HTTP/1.1
  Origin: http://localhost:5173

Backend → Browser:
  HTTP/1.1 200 OK
  Access-Control-Allow-Origin: http://localhost:5173
  Access-Control-Allow-Credentials: true

  [Response Body]
```

**2. Preflight Requests (PUT, DELETE, custom headers)**

```
Step 1: Browser sends OPTIONS (preflight)
  OPTIONS /api/users HTTP/1.1
  Origin: http://localhost:5173
  Access-Control-Request-Method: DELETE
  Access-Control-Request-Headers: Authorization

Step 2: Backend responds to preflight
  HTTP/1.1 204 No Content
  Access-Control-Allow-Origin: http://localhost:5173
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE
  Access-Control-Allow-Headers: Authorization
  Access-Control-Max-Age: 86400  (cache for 24 hours)

Step 3: Browser sends actual request
  DELETE /api/users/123 HTTP/1.1
  Origin: http://localhost:5173
  Authorization: Bearer token...
```

### Why credentials: true Matters

By default, browsers **do NOT** send cookies in cross-origin requests. You must explicitly opt-in:

**Frontend:**

```typescript
fetch("http://localhost:3001/api/users", {
  credentials: "include", // Send cookies cross-origin
});
```

**Backend:**

```typescript
cors({
  origin: "http://localhost:5173",
  credentials: true, // Accept credentials from origin
});
```

**Security Implication:**

When `credentials: true`, the backend CANNOT use wildcard origins:

```typescript
// ❌ Not allowed with credentials
cors({
  origin: "*",
  credentials: true, // Error! Must specify exact origins
});

// ✅ Must whitelist specific origins
cors({
  origin: ["http://localhost:5173", "https://app.com"],
  credentials: true,
});
```

### The Duplicate CORS Middleware Problem

**Scenario:** Multiple CORS middleware instances in the chain

```typescript
// ❌ WRONG: Multiple CORS instances
app.use(cors({ origin: "*" })); // Global

app.use("/api", router); // Router has its own CORS
router.use(cors({ origin: "http://localhost:5173", credentials: true }));
```

**What Happens:**

1. First middleware sets: `Access-Control-Allow-Origin: *`
2. Second middleware sets: `Access-Control-Allow-Origin: http://localhost:5173`
3. **Last header wins**, but browser sees conflict
4. Browser blocks request due to credentials mismatch

**Symptoms:**

- Intermittent auth failures
- Console warning: "Access-Control-Allow-Origin cannot be '\*' when credentials flag is true"
- Cookies not sent despite correct frontend config

**Solution: Single CORS Application Point**

```typescript
// ✅ CORRECT: One CORS middleware at app level
const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// No CORS in route files
app.use("/api", router); // Inherits global CORS
```

### Dynamic Origin Validation

For multiple allowed origins:

```typescript
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://staging.app.com",
  "https://app.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  })
);
```

### CORS vs Proxy in Development

**Development Setup:**

```
Browser (localhost:5173)
   ↓ Proxy forwards to backend
Vite Dev Server (localhost:5173)
   ↓ Makes actual request
Backend (localhost:3001)
```

**CORS Headers Still Needed:**

Even with a development proxy, the backend must send CORS headers because:

1. Proxy forwards the `Origin` header
2. Backend sees `Origin: http://localhost:5173` (different port)
3. Browser enforces CORS on the response

**Why Not Just Proxy?**

Proxies solve **development** CORS issues. In **production**, frontend and backend are separate origins requiring real CORS configuration.

### Security Best Practices

**1. Never Use Wildcard with Credentials**

```typescript
// ❌ Vulnerable to CSRF
cors({ origin: "*", credentials: true });

// ✅ Whitelist specific origins
cors({ origin: "https://app.com", credentials: true });
```

**2. Validate Origin Header**

Don't trust `req.headers.origin` without validation:

```typescript
// ❌ Dangerous: reflects any origin
cors({
  origin: (origin, callback) => callback(null, origin),
});

// ✅ Safe: whitelist check
cors({
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed"));
    }
  },
});
```

**3. Minimize Exposed Headers**

```typescript
cors({
  exposedHeaders: ["Set-Cookie"], // Only what frontend needs
  allowedHeaders: ["Content-Type", "Authorization"], // Limit incoming
});
```

### Troubleshooting CORS Issues

| Symptom                                             | Cause                            | Fix                                        |
| --------------------------------------------------- | -------------------------------- | ------------------------------------------ |
| "No 'Access-Control-Allow-Origin' header"           | CORS not configured              | Add CORS middleware                        |
| "Origin not allowed"                                | Origin not in whitelist          | Add origin to allowedOrigins               |
| "Credentials flag is true but Allow-Origin is '\*'" | Wildcard with credentials        | Use specific origin                        |
| Preflight fails (OPTIONS 404)                       | No OPTIONS handler               | Add OPTIONS handler or use CORS middleware |
| Cookies not sent                                    | Missing `credentials: 'include'` | Add to frontend fetch                      |
| Works in Postman, fails in browser                  | CORS is browser-enforced         | Postman bypasses CORS                      |

### Common Pitfalls

**1. Forgetting credentials: include**

```typescript
// ❌ Backend configured but frontend missing credentials
fetch("/api/users"); // Cookies not sent

// ✅ Include credentials
fetch("/api/users", { credentials: "include" });
```

**2. Wrong Origin Format**

```typescript
// ❌ Trailing slash
origin: "http://localhost:5173/";

// ✅ No trailing slash
origin: "http://localhost:5173";
```

**3. Not Handling Preflight**

```typescript
// ❌ Manually blocking OPTIONS
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.status(403).send();  // Breaks preflight!
  }
  next();
});

// ✅ Let CORS middleware handle OPTIONS
app.use(cors({ ... }));  // Automatically handles preflight
```

---

**Related Guides:**

- [Database & ORM](./backend-database.md) — Prisma repository pattern
- [Authentication](./backend-authentication.md) — Auth middleware
- [Frontend Development Server](./frontend-development-server.md) — Dev proxy patterns
