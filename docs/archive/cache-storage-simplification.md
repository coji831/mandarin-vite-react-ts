# Cache & Storage System Simplification

**Date:** 2026-06-10
**Goal:** Simplify cache and storage into passive tools; move module-specific needs into modules; update IaC

---

## 1. Current State Map

### 1.1 Cache System — What Uses It

| Cache Consumer    | Mechanism                                  | Key Prefix                        | TTL         | Config Dependency                       |
| ----------------- | ------------------------------------------ | --------------------------------- | ----------- | --------------------------------------- |
| AI Feedback       | `withCache` wrapping `AIFeedbackService`   | `quiz:feedback:{wordId}:{answer}` | 24h (86400) | `cacheConfig.enabled` → `CACHE_ENABLED` |
| Conversation Text | `withCache` wrapping `ConversationService` | `conv:{wordId}`                   | 1h (3600)   | Same                                    |
| TTS Audio         | `withCache` wrapping `GoogleTTSClient`     | `tts:{text}{voice}`               | 24h (86400) | Same + `CACHE_TTL_TTS`                  |
| Examples Lock     | `RedisLockManager` single-flight           | `examples:lock:{hash}`            | 5s (5000ms) | Redis availability only                 |

**All 4 consumers share the same single `RedisCacheService` instance** via `CacheFactory.create("default")`. There is no namespace isolation — only key prefix convention (e.g., `quiz:`, `conv:`, `tts:`).

### 1.2 Storage System — What Uses It

| Storage Consumer              | Mechanism                                                                             | GCS Path Pattern                      | Bucket             | Config Dependency |
| ----------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------- | ------------------ | ----------------- |
| **Examples** (data)           | `GcsFileStore` via `StorageFactory.create("examples")`                                | `examples/{hash}.json`                | `config.gcsBucket` | `GCS_BUCKET_NAME` |
| **TTS** (audio)               | `GCSClient.fileExists/uploadFile/getPublicUrl` (direct, via DI)                       | `tts/{hash}.mp3`                      | `config.gcsBucket` | Same bucket       |
| **Conversation** (text+audio) | `GCSClient.fileExists/downloadFile/uploadFile/getPublicUrl` (direct, bare imports ⚠️) | `convo/{wordId}/{hash}.json` + `.mp3` | `config.gcsBucket` | Same bucket       |
| **Vocabulary** (CSV data)     | `GCSClient.downloadFile` (direct, via repository)                                     | CSV filenames from vocabulary config  | `config.gcsBucket` | Same bucket       |

**All 4 consumers share the same single GCS bucket** — there's no bucket-level isolation at all.

### 1.3 Config File Dependencies

```js
// shared/config/index.js — config that controls cache + storage
export const config = {
  gcsBucket: process.env.GCS_BUCKET_NAME,           // Single bucket for ALL storage
  gcsCredentials: parseJsonEnv("GEMINI_API_CREDENTIALS_RAW"), // Reuses Gemini creds!
  cachePaths: {                                      // Module-specific paths in global config
    tts: "tts/{hash}.mp3",
    conversationText: "convo/{wordId}/{hash}.json",
    conversationAudio: "convo/{wordId}/{hash}.mp3",
  },
  features: {
    enableCache: process.env.ENABLE_CACHE !== "false", // Binary on/off — no per-module control
  },
};

export const cacheConfig = {
  enabled: process.env.CACHE_ENABLED === "true",    // Must be explicitly "true"
  ttl: { tts: parseInt(...) },                       // Only TTS TTL is configurable
};

export const redisConfig = {
  ...parseRedisUrl(),                                 // Single REDIS_URL for all
  keyPrefix: "mandarin:",                             // Global prefix
};
```

### 1.4 Terraform State

```hcl
// conversation-infrastructure.tf — only file that exists
resource "google_storage_bucket" "conversation_cache" { ... }  // For conversation text
resource "google_storage_bucket" "audio_cache" { ... }          // For TTS/conversation audio
resource "google_service_account" "conversation_service" { ... } // Combined SA for all GCP
```

**No terraform exists for:**

- Examples storage bucket
- Vocabulary CSV storage
- TTS-dedicated bucket
- Redis instance provisioning

---

## 2. Problems Identified

### P1: Global State in GCSClient

`GCSClient` uses module-level singleton variables (`let storageClient = null`, `let bucketName = null`). All consumers share the same client and bucket. No way to give a module a different bucket without affecting others.

### P2: ConversationService Imports GCSClient Directly

The only remaining bare-function import of GCSClient. It bypasses both `GcsFileStore` and `StorageFactory` — if we add bucket-level config later, this module won't get it.

### P3: Module-Specific Paths in Global Config

`cachePaths.tts`, `cachePaths.conversationText`, `cachePaths.conversationAudio` are storage paths defined in the central config file. They belong in their respective modules.

### P4: Terraform Is Incomplete

Only covers conversation infrastructure. Missing: TTS audio, examples, vocabulary CSV, Redis.

---

## 3. Strategy: Proofed, Not Split

**Design principle from the modulith guide:** Each module gets its OWN named storage/cache instance. All point to the same bucket/Redis **today**. Changing to a separate bucket/Redis later = change one env var + one container.js line. **Zero module business logic changes.**

```
Today (shared infra, proofed for split):
  Module A → GcsFileStore(bucket: config.gcsBucket) → GCS (same bucket)
  Module B → GcsFileStore(bucket: config.gcsBucket) → GCS (same bucket)

Tomorrow (truly split):
  Module A → GcsFileStore(bucket: config.ttsBucket) → GCS (separate bucket)
  Module B → GcsFileStore(bucket: config.gcsBucket) → GCS (unchanged)
  ↑ Only container.js and .env change — no module code touched
```

### 3.1 Storage: Named Instances, Same Bucket

```js
// container.js — each module gets its own named GcsFileStore instance
import { StorageFactory } from "../shared/infrastructure/storage/StorageFactory.js";

// All point to the same bucket TODAY. When splitting, just change the bucket arg.
const ttsStorage = StorageFactory.create("tts", { bucket: config.gcsBucket });
const examplesStorage = StorageFactory.create("examples", { bucket: config.gcsBucket });
const conversationStorage = StorageFactory.create("conversation", { bucket: config.gcsBucket });
const vocabularyStorage = StorageFactory.create("vocabulary", { bucket: config.gcsBucket });
```

### 3.2 GCSClient: Accept Optional Bucket Parameter

Minimal backward-compatible change:

```js
// Before: bucket is a module-level singleton
export function getGCSFile(filePath) {
  return client.bucket(getBucketName()).file(filePath);
}

// After: bucket can be passed per-call, defaults to existing singleton
export function getGCSFile(filePath, bucket) {
  return client.bucket(bucket || getBucketName()).file(filePath);
}
```

`GcsFileStore` passes its own bucket through:

```js
class GcsFileStore {
  constructor({ bucket } = {}) {
    this.bucket = bucket; // undefined → uses config.gcsBucket (backward compat)
  }
}
```

### 3.3 Cache: Merge Into One Self-Contained Class

**Goal:** Consumers see ONE class. Redis is an internal implementation detail.

**Current (consumer sees 4 classes + factory):**

```
cache/
├── CacheService.js        ← Abstract base (throws "must implement")
├── RedisCacheService.js   ← Redis impl (extends CacheService)
├── NoOpCacheService.js    ← NoOp impl (extends CacheService)
├── CacheFactory.js        ← Factory (creates instances)
├── index.js               ← DUPLICATE factory — DELETE
```

**Target (consumer sees 1 class + factory):**

```
cache/
├── CacheService.js        ← SINGLE concrete class. Has redisClient or null.
│                              When redisClient is null → all ops are no-ops.
│                              When redisClient is set → all ops use Redis.
└── CacheFactory.js        ← Factory (creates CacheService instances)

redis/
├── RedisClient.js         ← Redis connection wrapper
└── RedisLockManager.js    ← Redis distributed lock
```

**How `CacheService.js` works internally:**

```js
// The ONE class. No subclasses needed.
export class CacheService {
  constructor(redisClient) {
    this.redis = redisClient; // null = no-op mode
  }

  async get(key) {
    if (!this.redis) return null; // no-op path
    return this.redis.get(key); // Redis path
  }

  async set(key, value, ttl) {
    if (!this.redis) return; // no-op path
    await this.redis.set(key, value, "EX", ttl); // Redis path
  }

  async delete(key) {
    /* same pattern */
  }
  async clear(pattern) {
    /* same pattern */
  }
  async getMulti(keys) {
    /* same pattern */
  }
}
```

**How `CacheFactory` creates instances (simplified):**

```js
// No more branching between RedisCacheService vs NoOpCacheService.
// Just: pass redisClient (or null) to CacheService constructor.
export class CacheFactory {
  static async create(name, options = {}) {
    if (instances.has(name)) return instances.get(name);

    const enabled = options.enabled ?? cacheConfig.enabled;
    let redisClient = null;
    if (enabled) {
      const client = redis.getClient();
      if (client) {
        const healthy = await redis.ping(5000);
        if (healthy) redisClient = client;
      }
    }
    const instance = new CacheService(redisClient);
    instances.set(name, instance);
    return instance;
  }
}
```

**Result:** Consumers never import `RedisCacheService` or `NoOpCacheService` — they don't exist. Only `CacheFactory` is the entry point. The class decides internally whether to use Redis or no-op based on whether it received a `redisClient`.

### 3.4 Config: Remove Module Paths

```js
// shared/config/index.js — remove cachePaths section
// config.cachePaths.tts → moved to modules/tts/config.js
// config.cachePaths.conversationText/Audio → moved to modules/conversation/config.js
```

---

## 4. What Changes vs What Stays

| Component                              | Changes                                                                                                 | Stays Same                                       |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `GCSClient.js`                         | Add optional `bucket` param to all functions                                                            | Default behavior when bucket omitted             |
| `GcsFileStore.js`                      | Constructor accepts `{ bucket }`                                                                        | All method signatures                            |
| `StorageFactory.js`                    | Pass `options.bucket` to GcsFileStore                                                                   | Factory API                                      |
| `ConversationService.js`               | Receive GcsFileStore via DI (was bare import)                                                           | Business logic                                   |
| `container.js`                         | Create per-module storage instances                                                                     | All controller wiring                            |
| `shared/config/index.js`               | Remove `cachePaths`                                                                                     | All other config                                 |
| `modules/*/config.js`                  | **NEW** — module-level storage paths                                                                    | Only TTS + conversation                          |
| `shared/infrastructure/cache/index.js` | **DELETE** — superseded by CacheFactory                                                                 | `withCache()` updated                            |
| `cache/CacheService.js`                | **Merge** — becomes single concrete class (was abstract). Constructor takes `redisClient`; null → no-op | Same `get`/`set`/`delete`/`clear`/`getMulti` API |
| `cache/RedisCacheService.js`           | **DELETE** — logic merged into CacheService                                                             | Gone                                             |
| `cache/NoOpCacheService.js`            | **DELETE** — logic merged into CacheService                                                             | Gone                                             |
| `cache/CacheFactory.js`                | Creates `new CacheService(redisClient)` (was branching Redis/NoOp)                                      | Same factory API                                 |
| `cache/CacheMetricsRegistry.js`        | **DELETE** — stale registry. Inline aggregation into `HealthController` if needed                       | Gone                                             |
| `shared/middleware/cacheMiddleware.js` | `withCache()` uses `CacheFactory` instead of `createCacheService()`                                     | All behavior unchanged                           |
| **All 9 module services**              | **NO CHANGES**                                                                                          | Business logic untouched                         |

---

## 5. Implementation Plan

### Phase 1: Proof the Architecture (No Behavioral Change)

| #   | Task                                                                                                                                                                                                                                                                                                                       | Files                                                                                                                                                                              | Effort |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | Add optional `bucket` param to all `GCSClient.js` functions — defaults to `getBucketName()`                                                                                                                                                                                                                                | `shared/infrastructure/external/GCSClient.js`                                                                                                                                      | 15 min |
| 2   | Update `GcsFileStore.js` — constructor accepts `{ bucket }`, passes to GCSClient calls                                                                                                                                                                                                                                     | `shared/infrastructure/storage/GcsFileStore.js`                                                                                                                                    | 10 min |
| 3   | Update `StorageFactory.create(name, options)` — passes `options.bucket` to GcsFileStore                                                                                                                                                                                                                                    | `shared/infrastructure/storage/StorageFactory.js`                                                                                                                                  | 5 min  |
| 4   | Fix `ConversationService.js` — receive GcsFileStore via constructor param instead of bare `gcsClient` imports                                                                                                                                                                                                              | `modules/conversation/services/ConversationService.js` + `app/container.js`                                                                                                        | 15 min |
| 5   | Create per-module storage instances in container.js (all same bucket)                                                                                                                                                                                                                                                      | `app/container.js`                                                                                                                                                                 | 10 min |
| 6   | Remove `cachePaths` from global config, add module-level configs                                                                                                                                                                                                                                                           | `shared/config/index.js` + `modules/tts/config.js` + `modules/conversation/config.js`                                                                                              | 10 min |
| 7   | **Merge CacheService** — make `CacheService.js` concrete. Constructor accepts `redisClient` (null = no-op). Move RedisCacheService + NoOpCacheService logic into it                                                                                                                                                        | `shared/infrastructure/cache/CacheService.js`                                                                                                                                      | 15 min |
| 8   | **Delete** `RedisCacheService.js` and `NoOpCacheService.js` + stale `__tests__/` + `CacheMetricsRegistry.js`. Update `CacheFactory.js` to create `new CacheService(redisClient)`. Update `withCache()` to use `CacheFactory`; delete `cache/index.js`. Remove metrics import from `container.js` and `HealthController.js` | `RedisCacheService.js`, `NoOpCacheService.js`, `__tests__/`, `CacheMetricsRegistry.js`, `CacheFactory.js`, `cacheMiddleware.js`, `index.js`, `container.js`, `HealthController.js` | 15 min |

**Verify:** `node -e "import('./src/app/container.js')"` loads without errors.

### Phase 2: Terraform Update (When Needed)

| #   | Task                                                                      | Files                             | Effort |
| --- | ------------------------------------------------------------------------- | --------------------------------- | ------ |
| 7   | Restructure `terraform/` — per-use-case bucket files with lifecycle rules | `terraform/storage/*.tf`          | 30 min |
| 8   | Add TTS + examples + vocabulary bucket definitions                        | New `.tf` files                   | 20 min |
| 9   | Add Redis instance (if managed)                                           | `terraform/redis.tf`              | 15 min |
| 10  | Create least-privilege service accounts per use case                      | `terraform/service-accounts/*.tf` | 20 min |

---

## 7. Upgrade Path: Shared → Split

When a module needs its own infrastructure, the upgrade path is:

```
Step 1: Add env var to .env.local           Step 2: Update container.js           Step 3: Apply terraform
────────────────────────────                ──────────────────────────              ─────────────────────
GCS_BUCKET_TTS=my-tts-bucket                const ttsStorage =                      resource "google_storage_bucket"
                                              StorageFactory.create(                  "tts_cache" { ... }
                                                "tts",
REDIS_URL_TTS=redis://...                      { bucket: config.ttsBucket }
                                            )                                      resource "google_service_account"
                                                                                      "tts_service" { ... }
```

**No module code changes.** Zero lines changed in business logic. Only `container.js` + `.env` + terraform.

---

## 8. Structured Prompts

### Phase 1: Proof the Architecture

```
[TASK]: Phase 1 — proof storage for future splitting without changing behavior
[CONTEXT]: apps/backend/src/
[PARAMETERS]:
  Tasks:
    1.1 Update GCSClient.js — add optional `bucket` param to getGCSFile(filePath, bucket), fileExists(filePath, bucket), downloadFile(filePath, bucket), uploadFile(filePath, buffer, contentType, bucket), getPublicUrl(filePath, bucket). When bucket is undefined, fall back to getBucketName() (existing behavior).
    1.2 Update GcsFileStore.js — constructor accepts `{ bucket } = {}`. All GCSClient calls pass `this.bucket` as last argument. When this.bucket is undefined, existing singleton behavior is preserved.
    1.3 Update StorageFactory.create(name, options) — pass options.bucket to new GcsFileStore({ bucket }).
    1.4 Fix ConversationService.js — receive gcsClient via constructor (3rd param), NOT as bare import. Update container.js to pass gcsClient.
    1.5 Create per-module storage in container.js: ttsStorage, examplesStorage, conversationStorage, vocabularyStorage via StorageFactory.create(name, { bucket: config.gcsBucket }). Wire each into their respective services/controllers.
    1.6 Remove cachePaths from shared/config/index.js. Create modules/tts/config.js with TTS_STORAGE_PATH. Create modules/conversation/config.js with CONVERSATION_STORAGE_PATHS.
[OUTPUT]: Storage architecture proofed. GCSClient accepts bucket param. GcsFileStore owns its bucket. ConversationService DI fixed. Per-module storage instances created (all same bucket). Module-level configs for TTS and conversation paths.
[CONSTRAINTS]:
  - MUST NOT change GCSClient behavior when bucket param is omitted
  - MUST NOT change any module business logic
  - ConversationService DI fix is only behavioral change
```

### Phase 2: Terraform Update

```
[TASK]: Phase 2 — create per-use-case terraform definitions
[CONTEXT]: terraform/
[PARAMETERS]:
  Tasks:
    2.1 Create terraform/storage/ — per-bucket .tf files with lifecycle rules
    2.2 Add TTS cache bucket (lifecycle: 30d delete), examples cache (30d), vocabulary data (no delete)
    2.3 Add managed Redis instance if applicable
    2.4 Create per-use-case service accounts, each scoped to its own bucket
    2.5 Refactor existing conversation-infrastructure.tf into new structure
[OUTPUT]: terraform/ reorganized, plan validates
[CONSTRAINTS]:
  - Run terraform plan to verify
  - All new resources = added, existing untouched
```

### Phase 3: Cache Consolidation

```
[TASK]: Phase 3 — consolidate cache/ into a single self-contained class
[CONTEXT]: apps/backend/src/shared/infrastructure/
[PARAMETERS]:
  Tasks:
    3.1 Merge CacheService — make CacheService.js the single concrete class. Constructor accepts `redisClient` (null = no-op mode). Move get/set/delete/clear/getMulti implementation from RedisCacheService.js into it: when redisClient is set, delegate to Redis; when null, return null/no-op.
    3.2 Delete RedisCacheService.js and NoOpCacheService.js — their logic is now inside CacheService.js.
    3.3 Update CacheFactory.js — replace `new RedisCacheService(client)` / `new NoOpCacheService()` with `new CacheService(redisClient)`. Factory decides whether to pass a redisClient or null based on cacheConfig and Redis health.
    3.4 Delete CacheMetricsRegistry.js — stale aggregation registry. Remove its imports and usage from container.js and HealthController.js. Remove registerCacheMetrics() calls and getCacheMetrics param from HealthController constructor. Health check response no longer includes cache metrics.
    3.5 Update cacheMiddleware.js — change withCache() to use CacheFactory instead of createCacheService(). Import from CacheFactory, call CacheFactory.create("default").
    3.6 Delete cache/index.js — old factory, fully superseded by CacheFactory.
    3.7 Delete stale __tests__/ under cache/ (tests for deleted classes).
[OUTPUT]: Cache folder simplified — only CacheService.js and CacheFactory.js remain. CacheMetricsRegistry and old factory deleted. withCache() uses CacheFactory. Verify: node -e "import('./src/app/container.js')"
[CONSTRAINTS]:
  - CacheService API must remain the same (get/set/delete/clear/getMulti)
  - CacheFactory.create("default") must still work — all existing consumers unaffected
  - HealthController health check response no longer includes cache metrics (that was the only consumer)
  - Do NOT modify any module business logic
```
