# Implementation 16-3: Example Caching & Performance

## Technical Scope

- References:
  - Business Requirements: ../../business-requirements/epic-16-word-examples/story-16-3-example-caching-performance.md
  - Epic Implementation: ./README.md

- Last Update: 2026-04-09
- Status: Planned

- Files / infra to add or update:
  - `apps/backend/src/services/gcsCacheService.js` (GCS read/write helpers, JSON objects)
  - `terraform/gcs/examples-bucket.tf` (bucket + lifecycle 30 days, IAM bindings, service account)
  - `apps/backend/tests/gcsCacheService.test.js` (unit/integration tests)
    - `apps/backend/src/services/cachedExampleService.js` (wrapper: orchestrates cache + lock + delegation to exampleService)

## Implementation Details

### Cache Key Strategy

- Source string: `word|hskLevel|language|v1` (concatenated deterministically).
- Final object naming: store objects by the HMAC hex digest derived from the source string and the server-side secret; object names MUST NOT contain the plain `word` or other user-supplied identifiers.

Implementation example (Node.js):

```js
const { createHmac } = require("crypto");
function computeCacheKey(secret, word, hskLevel, language) {
  const src = `${word}|${hskLevel}|${language}|v1`;
  return createHmac("sha256", secret).update(src, "utf8").digest("hex");
}
```

Operational notes:

- `EXAMPLES_CACHE_HMAC_KEY` is provisioned from Secret Manager (or Kubernetes Secret) and is rotated regularly (recommended cadence: 90 days). During rotation the service supports dual-key reads (try active key, then previous key) and writes use the active key.

### Single-Flight Dedupe Implementation

For single-instance deployments an in-process map may be used for dedupe; for multi-instance deployments Redis-based locks (or a short-lived DB lock) MUST be used. Locks should be short-lived (recommend TTL 5s) and use a unique owner value that is validated on release.

### Redis Security Requirements

- Redis connections MUST use TLS in production and require authentication. Use a dedicated Redis user scoped to the `examples:*` keyspace with only the minimal commands required (e.g., `GET`, `SET`, `DEL`, `EXPIRE`/`PEXPIRE`).
- Connection policy: sensible timeouts (connectTimeout ≈ 5000ms), limited retries (e.g., `maxRetriesPerRequest=3`), and `tls.rejectUnauthorized=true` to validate certificates.
- Credentials sourcing: provide `REDIS_URL` or `REDIS_HOST`/`REDIS_PORT` with `REDIS_PASSWORD` via Secret Manager or Kubernetes Secrets. Do NOT embed credentials in source control.

Example Redis ACL (redis-cli):

```
ACL SETUSER examples_service on >StrongPassword ~examples:* +GET +SET +DEL +PEXPIRE
```

Node connection example (ioredis):

```js
const Redis = require("ioredis");
const client = new Redis(process.env.REDIS_URL, {
  tls: { rejectUnauthorized: true },
  maxRetriesPerRequest: 3,
  connectTimeout: 5000,
});
await client.connect();
```

### Cache read/write logic (pseudocode)

```js
async function getCachedExamples(key) {
  const obj = await gcs.getObject(key);
  if (obj) {
    return JSON.parse(obj);
  }
  return null;
}

async function putCachedExamples(key, payload) {
  await gcs.putObject(key, JSON.stringify(payload));
}
```

### Deduplication / single-flight

- Use an in-process map for single-instance dedupe; for multi-instance use Redis or a database-based lock with a short TTL and safe compare-and-set release semantics.

### Lifecycle & retention

- Terraform will create the examples bucket with a lifecycle rule that deletes `examples/*` after **30 days**.

### GCS Access Control & IAM

- Create a dedicated GCS service account for examples caching. Assign least-privilege roles: `roles/storage.objectCreator` and `roles/storage.objectViewer` only. Do not grant `roles/storage.admin`.
- Configure the bucket with uniform bucket-level access enabled and block public access. Grant access only to the dedicated service account via IAM bindings.

### Terraform changes

```hcl
resource "google_service_account" "examples_service" {
  account_id   = "examples-service"
  display_name = "Examples caching service account"
}

resource "google_storage_bucket" "examples" {
  name                        = var.examples_bucket_name
  uniform_bucket_level_access = true
  lifecycle_rule {
    action { type = "Delete" }
    condition { age = 30 }
  }
}

resource "google_storage_bucket_iam_member" "examples_writer" {
  bucket = google_storage_bucket.examples.name
  role   = "roles/storage.objectCreator"
  member = "serviceAccount:${google_service_account.examples_service.email}"
}

resource "google_storage_bucket_iam_member" "examples_reader" {
  bucket = google_storage_bucket.examples.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.examples_service.email}"
}

resource "google_logging_project_sink" "examples_audit_sink" {
  name        = "examples-audit-sink"
  destination = "bigquery.googleapis.com/projects/${var.project_id}/datasets/${var.logging_dataset}"
  filter      = "resource.type=\"gcs_bucket\" AND logName:cloudaudit"
  unique_writer_identity = true
}
```

### Dependency & Credential Management

- Credentials & secrets:
  - Use `GCS_SERVICE_ACCOUNT_KEY` environment variable (distinct from TTS credentials) for the examples caching service.
  - Store secrets in Google Secret Manager (or equivalent). Do NOT commit keys to source control.
  - Rotate service account keys every **90 days** and document the rotation procedure.
- Dependency security:
  - Enable Dependabot or Snyk to scan dependencies such as `@google-cloud/storage`, `google-auth-library`, and `redis`.
  - Apply security patches within **7 days** for critical vulnerabilities and within a reasonable SLA for lower-severity fixes.

### Audit Logging

Logging policy: Never log API keys, service account private keys, full Gemini responses, or user PII in application logs. Redact sensitive data with `[REDACTED]` or omit entirely. Audit logs may include `word` labels only in controlled, access-restricted audit storage; avoid including full Gemini responses in standard application logs.

- Audit logs for cache operations are enabled and exported to a restricted sink with retention of at least **90 days**.
- Structured audit fields that are recorded for each request (but MUST NOT include example content) are:
  - `timestamp`
  - `service`
  - `route`
  - `request_id`
  - `cache_key` (HMAC hex)
  - `cache_hit` (boolean)
  - `generation_latency_ms` (number)
  - `status` (string)
  - `error_code` (nullable string)

Example structured log entry:

```json
{
  "timestamp": "2026-04-09T12:00:00Z",
  "service": "examples-service",
  "route": "/api/examples",
  "request_id": "uuid",
  "cache_key": "<hmac-hex>",
  "cache_hit": true,
  "generation_latency_ms": 123,
  "status": "ok",
  "error_code": null
}
```

If example content-level auditing is required, it MUST be stored in a separate, access-restricted audit dataset with stronger access controls, and access to that dataset is subject to an approval process.

### Clean Architecture Pattern: Wrapper Approach

**Design Rationale:**
The caching logic (lock, GCS persistence, HMAC key management) is an infrastructure concern. The example generation logic (business rules, Gemini API calls) is core domain logic. To maintain Clean Architecture separation and enable future .NET migration without duplicating cache orchestration code, implement caching via a **wrapper pattern**:

**Pattern Diagram:**

```
┌─────────────────────────────────────────┐
│ ExampleService (Core Domain)            │
│ • generateExamples(word, hskLevel)      │
│ • Calls GeminiClient (pure logic)       │
│ • No awareness of caching/infrastructure│
└────────────────────▲────────────────────┘
                     │
                     │ wrapped by
                     │
┌─────────────────────┴────────────────────┐
│ CachedExampleService (Infrastructure)    │
│ • Wraps ExampleService                  │
│ • Manages Redis locks (single-flight)    │
│ • Manages GCS persistence (30-day cache) │
│ • Manages HMAC key rotation              │
│ • Delegates generation to ExampleService │
└─────────────────────────────────────────┘
```

**Implementation (CachedExampleService):**

```javascript
// apps/backend/src/services/cachedExampleService.js

const crypto = require("crypto");

/**
 * Wrapper service that orchestrates caching infrastructure around
 * core ExampleService logic. Implements single-flight deduplication,
 * GCS persistence, and HMAC key rotation.
 *
 * Separation Pattern: Infrastructure (this class) delegates generation
 * to core domain (ExampleService), ensuring ExampleService remains
 * framework/infrastructure-agnostic.
 */
class CachedExampleService {
  constructor(exampleService, redisLockManager, gcsService, hmacManager) {
    this.exampleService = exampleService;
    this.redisLock = redisLockManager;
    this.gcs = gcsService;
    this.hmac = hmacManager;
  }

  async generateExamples(word, hskLevel, language = "en") {
    // Compute HMAC-derived cache key (prevents enumeration)
    const cacheKey = this.hmac.deriveKey(word, hskLevel, language);

    // Try GCS cache first (multi-instance safe, 30-day retention)
    try {
      const cached = await this.gcs.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      // GCS error; fall through to generation
      console.warn(`[CachedExampleService] GCS read error: ${err.message}`);
    }

    // Acquire distributed lock (5s TTL) to prevent concurrent generation
    const lockName = `examples:lock:${cacheKey}`;
    const lockId = crypto.randomUUID();
    const lockAcquired = await this.redisLock.acquire(lockName, lockId, 5000);

    if (!lockAcquired) {
      // Lock contention: another instance is generating. Fallback to direct generation.
      return await this.exampleService.generateExamples(word, hskLevel, language);
    }

    try {
      // Double-check cache after acquiring lock (thundering herd guard)
      const recached = await this.gcs.get(cacheKey);
      if (recached) {
        return JSON.parse(recached);
      }

      // Generate via core domain logic (no infrastructure awareness inside exampleService)
      const result = await this.exampleService.generateExamples(word, hskLevel, language);

      // Persist to GCS (30-day lifecycle rule handles expiration)
      await this.gcs.put(cacheKey, JSON.stringify(result));

      return result;
    } finally {
      // Always release lock
      await this.redisLock.release(lockName, lockId);
    }
  }
}

module.exports = CachedExampleService;
```

**Benefits:**

- ✅ **Clean Architecture:** Core logic (ExampleService) is infrastructure-agnostic. Can be tested independently. Can be ported to .NET without cache orchestration logic.
- ✅ **Testability:** Mock CachedExampleService to test core logic. Mock ExampleService to test cache orchestration.
- ✅ **Reusability:** Wrapper pattern is precedent in codebase (see Epic 8 CachedConversationService).
- ✅ **Maintainability:** Lock, GCS, HMAC logic is co-located in one wrapper class.

**Controller Usage:**

```javascript
// examplesRoute.js
const ExampleService = require("../services/exampleService");
const CachedExampleService = require("../services/cachedExampleService");
const redisLockManager = require("../infra/redisLockManager");
const gcsService = require("../infra/gcsService");
const hmacManager = require("../infra/hmacManager");

// Instantiate with dependency injection
const exampleService = new ExampleService(geminiClient, inputValidator);
const cachedService = new CachedExampleService(
  exampleService,
  redisLockManager,
  gcsService,
  hmacManager,
);

router.get("/examples/:word", async (req, res) => {
  const examples = await cachedService.generateExamples(
    req.params.word,
    req.query.hskLevel,
    req.query.language,
  );
  res.json(examples);
});
```

## Architecture Integration

- `exampleService` (Story 16.1) calls `gcsCacheService` as its first step (GCS read-through for cache hits).
- Terraform-managed bucket used for both example payloads and optionally generated audio (audio lifecycle aligned to policy).
- Future observability (Story 16-4 or later) will add metrics, dashboards, and alerting.

```
[Backend exampleService] -> CachedExampleService (orchestrates lock + GCS + HMAC) -> gcsCacheService (reads/writes) -> metrics -> monitoring & alerts
```

**Wrapper Pattern Precedent:**
This wrapper pattern (infrastructure wrapping domain logic) mirrors the existing `CachedConversationService` (Epic 8), which wraps `ConversationService` conversation-generation logic with caching orchestration. This consistency enables:

- Team familiarity with the pattern
- Code reusability (lock/GCS/HMAC utilities shared across services)
- Easier .NET migration (wrapper can be reimplemented; core stays stable)

## Technical Challenges & Solutions

Problem: Achieving >80% cache hit rate immediately is unlikely for new feature rollout.
Solution: Warm cache for top-N words (pre-generate examples via job); track hit rate per-word and iterate.

Problem: Duplicate Gemini calls across instances on cache miss.
Solution: Redis-based lock or short-lived GCS lock object + polling. Implement single-flight dedupe with fallback TTL.

Problem: Validating lifecycle rule via code/CI.
Solution: Add `terraform plan` checks in CI and a small integration test that inspects bucket lifecycle rule via provider API.

### Challenge 3: Clean Architecture Separation (Wrapper Pattern Design)

**Problem:** Caching infrastructure (Redis locks, GCS persistence, HMAC rotation) mixes with generation business logic if implemented inline. This creates tight coupling that:

- Makes core logic harder to test in isolation
- Couples core to infrastructure frameworks (Redis, GCS, Secret Manager)
- Increases effort for .NET migration (had to port cache orchestration logic alongside core)
- Creates duplication risk across Stories 17-19 (TTS, Quiz, Flashcards) if each implements cache inline

**Root Cause:** Without explicit separation, cache and generation concerns naturally merge into a single service class.

**Solution:** Implement **wrapper pattern** (Option A):

1. Keep `ExampleService` focused on pure generation logic
2. Create `CachedExampleService` wrapper that orchestrates lock → cache-read → lock-check-lock-acquire → generate-via-exampleService → cache-write → release-lock
3. Inject all infrastructure (redisLock, gcsService, hmacManager) into wrapper constructor; ExampleService receives only domain-specific deps (geminiClient, validator)
4. Controller uses CachedExampleService; CachedExampleService delegates core to ExampleService

**Alternatives Considered:**

- Inline pattern with DI: Keep all logic in one service, inject infrastructure deps. Simpler initially but tight coupling, harder to test core in isolation, harder to port to .NET.
- Decorator pattern: Similar to wrapper but uses runtime composition instead of explicit wrapper class. More flexible but less explicit.
- Aspect-oriented pattern: Intercept ExampleService calls with cache logic via decorators or middleware. Overkill for this scope.

**Impact/Benefits:**

- Core logic (ExampleService) remains framework-agnostic → straightforward .NET migration
- Clear separation enables independent testing of generation logic (mock cache) vs. cache orchestration (mock ExampleService)
- Wrapper pattern is established precedent in codebase (Epic 8), so team already understands the structure
- Reusable for future APIs (Stories 17-19 can use similar wrapper pattern)

**Lessons Learned:**

- Explicit wrapper classes are worth the 2-3h refactor cost; saves significantly during migration and cross-API reuse
- Dependency injection in constructors is critical for testability and refactoring safety
- Small, focused services (one responsibility per class) make testing and porting easier than monolithic service classes

## [Optional] Testing Implementation

- Unit tests for `gcsCacheService` with GCS emulator.
- Integration test for terraform plan to assert lifecycle rule exists.
- Simulated traffic test to validate metrics (hit/miss) and evaluate whether warm-up achieves >80% hit rate for a sample population.
