# Documentation Design Specification — Story 16.3: Example Caching & Performance

**Design ID:** `story-16-3-docs-design`  
**Phase:** Pre-Implementation Documentation Planning  
**Created:** April 9, 2026  
**Designed By:** Design Planning Architect  
**Status:** Ready for Docs Curator Implementation

---

## Executive Summary

This design specification defines the documentation updates needed for Story 16.3 (Example Caching & Performance) following the architectural review findings. The architecture is **conditionally approved** with three must-haves and two should-haves that need to be surfaced clearly in documentation.

**Key Insight:** The current BR and implementation docs are **functionally complete** but need **reorganization and cross-linking** to reflect:

1. HMAC key rotation as a deployed requirement (not just design)
2. Prometheus metrics as acceptance criteria (not vague monitoring)
3. Redis security as acceptance criteria (not just configuration guidance)
4. Clean Architecture wrapper pattern as implementation decision (not in BR)

**Estimated Documentation Work:** 6–8 hours (content refresh + reorganization)

---

## Inquiry Checklist

**Files Examined:**

- [docs/business-requirements/epic-16-word-examples/story-16-3-example-caching-performance.md](../../docs/business-requirements/epic-16-word-examples/story-16-3-example-caching-performance.md) — Current BR doc (functionally complete but needs AC reorganization)
- [docs/issue-implementation/epic-16-word-examples/story-16-3-example-caching-performance.md](../../docs/issue-implementation/epic-16-word-examples/story-16-3-example-caching-performance.md) — Current impl doc (comprehensive but needs Clean Arch pattern section)
- [docs/architecture.md](../../docs/architecture.md) — High-level architecture (missing caching patterns section entirely)
- [docs/templates/story-business-requirements-template.md](../../docs/templates/story-business-requirements-template.md) — BR template (7 sections, strict structure required)
- [docs/templates/story-implementation-template.md](../../docs/templates/story-implementation-template.md) — Impl template (sections: Technical Scope, Implementation Details, Architecture Integration, Technical Challenges)
- [verification-artifacts/story-16-3-architecture-review.md](./story-16-3-architecture-review.md) — Architectural review (identifies 3 must-haves, 2 should-haves)
- [docs/guides/code-conventions.md](../../docs/guides/code-conventions.md) — Backend Clean Architecture conventions
- [docs/business-requirements/epic-16-word-examples/README.md](../../docs/business-requirements/epic-16-word-examples/README.md) — Epic BR (cross-links need verification)

**Ambiguities Resolved:**

| Question                                                     | Resolution                                                                                                                                                                    |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Should BR surface Clean Architecture wrapper pattern?        | NO. BR states WHAT (caching + security + monitoring); HOW (wrapper vs inline) belongs in Implementation doc. BR users (stakeholders) don't care about architectural patterns. |
| Should "Prometheus dashboard deployed" be an AC item?        | PARTIALLY. Metric EMISSION and ALERT firing are AC (behavioral). Dashboard setup is deployment task (separate checklist in Implementation doc).                               |
| How many code examples in impl doc?                          | THREE: (1) HMAC computation, (2) Redis lock acquisition, (3) GCS write with validation. These are the critical patterns.                                                      |
| Should architecture.md link to specific code files?          | YES, but use future tense ("See gcsCacheService.js in Story 16.3"). Guidance should point developers where patterns live.                                                     |
| Should dual-key reads during HMAC rotation be in BR or impl? | Both. BR makes it a requirement (Business Rule section); impl doc shows code pattern.                                                                                         |

**Plan Approved:** ✅ Yes — Ready for Docs Curator to implement

---

## Problem Framing

**Current State:**

- Story 16.3 BR and implementation docs are **functionally correct** but **structurally misaligned** with architectural review findings
- HMAC key rotation mentioned in requirements but **not treated as acceptance criteria** → ambiguous deployment expectation
- Prometheus monitoring described at **high level** but **not as concrete acceptance criteria** → testing/verification unclear
- Redis security **mentioned but scattered** across multiple sections → not clear what must be done vs. nice-to-have
- **No section documenting Clean Architecture rationale** → future developers won't understand why wrapper pattern matters
- **Architecture.md has no caching patterns section** → guidance missing for future APIs (Stories 17, 18, 19)
- **Epic 16 README does not cross-link back** to individual story docs → discoverability poor

**Success Criteria for Documentation Update:**

1. ✅ All MUST-HAVE items (HMAC rotation, Prometheus, Redis security) are explicit acceptance criteria in BR
2. ✅ Implementation doc explains wrapper pattern decision and Clean Architecture rationale
3. ✅ Code examples match actual patterns developers will implement
4. ✅ Bidirectional cross-links: BR ↔ Implementation, Epic ↔ Stories, Architecture ↔ Stories
5. ✅ Status and Last Update dates are consistent across all docs
6. ✅ Docs Curator has unambiguous instructions for each change

---

## Constraints & Assumptions

1. **Template Compliance (Hard Constraint):** All docs must strictly follow their corresponding templates (Story BR Template, Story Implementation Template). Do NOT add non-template sections (e.g., "Status" section if not in template).

2. **High-Level Docs Rule:** `docs/architecture.md` should NOT reference specific story/epic numbers. Use descriptive patterns instead ("Hybrid Caching for Expensive Operations" not "Story 16.3").

3. **No Rewriting of Existing Content:** The architectural review findings have been captured in Story 16.3 BR + impl docs already. Documentation updates should REORGANIZE and CROSS-LINK, not replace core content.

4. **Acceptance Criteria are Testable:** AC items in BR must be verifiable by implementation (code, metrics, tests). Vague statements like "monitoring is set up" are not AC; "Prometheus increments `examples_cache_hit_ratio` counter" is.

5. **Code Examples Must Be Implementable:** Any code shown in docs must be implementable as written. If specific library versions matter (ioredis, @google-cloud/storage), call that out.

6. **Cross-Linking Is Bidirectional:** If BR links to Implementation, Implementation must link back. If Architecture links to Story 16.3, Story 16.3 must reference Architecture section.

7. **Status Fields Match:** `Status`, `Last Update`, `PR` fields must be identical across BR and Implementation docs for same story.

---

## Proposed Work Packages

### Work Package 1: Story 16.3 BR Doc Reorganization

**File:** [docs/business-requirements/epic-16-word-examples/story-16-3-example-caching-performance.md](../../docs/business-requirements/epic-16-word-examples/story-16-3-example-caching-performance.md)

**Sections to Update:**

| Section                   | Current State          | Required Change                      | Reasoning                                                                                                         |
| ------------------------- | ---------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| **Description**           | ✅ Clear               | No change                            | Existing description is excellent                                                                                 |
| **Business Value**        | ✅ Good                | No change                            | Explains cost and latency benefits clearly                                                                        |
| **Acceptance Criteria**   | ⚠️ Verbose & scattered | REORGANIZE into 5 clear AC items     | Currently HMAC, monitoring, logging are mixed with implementation details. Should be crisp behavioral statements. |
| **Business Rules**        | ✅ Present             | ADD rule about HMAC rotation cadence | Rule 1 should explicitly state "HMAC key rotation every 90 days with dual-key read support is required"           |
| **Related Issues**        | ⚠️ Incomplete          | ADD cross-links to Epic 16 README    | Missing forward link to Epic 16 README; verify bidirectional linking                                              |
| **Implementation Status** | ✅ Present             | Update Last Update date on close     | Currently 2026-04-09; will be updated to merge date                                                               |

**Acceptance Criteria Reorganization Target:**

```markdown
## Acceptance Criteria

- [ ] GCS bucket with 30-day lifecycle rule is deployed and verified
- [ ] HMAC-SHA256 cache keys are computed and stored without plaintext identifiers
- [ ] HMAC_EXAMPLES_CACHE_KEY rotation plan is documented and deployable (90-day cadence, dual-key reads)
- [ ] Redis TLS + ACL security is configured and enforced (password auth, key namespace scoping)
- [ ] Prometheus metrics emit with labels: examples_cache_hits_total, examples_cache_misses_total, examples_generation_latency_seconds
- [ ] Prometheus alert fires when 7-day rolling hit rate < 80%
- [ ] Structured JSON logs include: timestamp, service, route, request_id, cache_key, cache_hit, generation_latency_ms
- [ ] Audit logs export to BigQuery with 90-day retention
- [ ] Single-flight deduplication (Redis lock with 5s TTL) is implemented and tested
- [ ] Cache warm-up plan for top-N words is documented and testable
```

**Estimated Changes:** 15% — Move content around, add explicit Terraform/Secret Manager references, clarify AC boundary

---

### Work Package 2: Story 16.3 Implementation Doc Reorganization

**File:** [docs/issue-implementation/epic-16-word-examples/story-16-3-example-caching-performance.md](../../docs/issue-implementation/epic-16-word-examples/story-16-3-example-caching-performance.md)

**Section Structure (Following Story Implementation Template):**

| Section                                 | Current State            | Required Change                                             | Content Outline                                                                                                                                      |
| --------------------------------------- | ------------------------ | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Technical Scope**                     | ✅ Listed                | Expand with file counts                                     | - 6 new files: gcsCacheService.js, cacheMetrics.js, cacheLogger.js, + Terraform files - 3 test files - 2 config updates                              |
| **Implementation Details**              | ⚠️ Scattered             | ADD subsection: Clean Architecture Pattern Rationale        | Explain wrapper pattern vs inline; why it matters for .NET migration; link to CachedConversationService precedent                                    |
| **Implementation Details**              | ✅ Code examples present | VERIFY 3 examples exist and are current                     | (1) HMAC key computation (with secret rotation note), (2) Redis lock acquire pattern (with TTL and unique value), (3) GCS write with JSON validation |
| **Architecture Integration**            | ✅ Present               | ADD flow diagram with cache check → lock → generate → store | ASCII diagram or reference to architecture.md                                                                                                        |
| **Technical Challenges & Solutions**    | ❌ MISSING               | CREATE section with 3-4 challenges                          | (1) Hit rate cold start, (2) Duplicate calls under load, (3) HMAC key rotation during deployment, (4) Cache invalidation strategy                    |
| **(NEW) Deployment Checklist**          | ❌ MISSING               | CREATE with subsections                                     | HMAC rotation setup, Prometheus dashboard + rules, Redis ACL, load testing, GCS lifecycle verification                                               |
| **(NEW) Performance Targets**           | ❌ MISSING               | CREATE with metrics                                         | Cache hit rate %, latency bounds, cost savings, storage projection                                                                                   |
| **(NEW) Future Work & Standardization** | ❌ MISSING               | CREATE brief section                                        | CacheableGenerationFactory design (cross-link to architectural review), Epic 8 retrofit plan, Stories 17-19 onboarding                               |

**Key Additions:**

**Clean Architecture Pattern Section (NEW):**

```markdown
### Clean Architecture: Wrapper Pattern Rationale

**Current Proposal (Before Refactoring):**

- ExampleService contains: generation + validation + HMAC computation + GCS read/write + Redis lock

**Recommended Pattern (Post-Refactoring):**

- ExampleService (Core Layer): generateExamples() — business logic only, framework-agnostic
- CachedExampleService (Infrastructure Layer): wraps ExampleService, handles cache orchestration
- GCS + Redis interactions isolated to infrastructure layer

**Precedent:** CachedConversationService (Epic 8) already implements this pattern.

**Why This Matters:**

- Testability: ExampleService tests mock only domain logic; CachedExampleService tests verify cache behavior
- Portability: .NET migration (Epic 18) can directly port ExampleService logic; only needs new CachedExampleService wrapper
- Maintainability: Lock/cache logic not mixed with business logic; easier debugging and performance tuning

**Refactoring Decision:**

- SHORT-TERM (for Story 16.3): Inline with dependency injection (ExampleService receives redisLockManager, gcsService as constructor params)
- MEDIUM-TERM (Epic refactor): Extract to CachedExampleService wrapper (low effort, 2-3 hours)
```

**Technical Challenges & Solutions (NEW):**

````markdown
### Challenge 1: Cold Cache Hit Rate

**Problem:** On initial rollout, 0-5% hit rate because cache is empty. Alert threshold (80%) cannot be met.

**Root Cause:** First user sees cache miss; subsequent identical requests hit cache. But diverse query space means low hit rate for days/weeks.

**Solution:**

1. Implement cache warm-up job: pre-generate examples for top-100 words on deployment
2. Track hit rate per-word; prioritize warm-up for high-frequency words
3. Adjust alert threshold 80% → 20% for first 7 days post-launch, then ramp to 80%

**Lesson:** Always consider cold cache problem for metric-based alerts on caching features.

### Challenge 2: Duplicate Gemini Calls Under Load

**Problem:** If 10 requests arrive for same uncached word simultaneously, all 10 call Gemini API (no deduplication).

**Root Cause:** Without distributed lock, no mechanism to detect in-flight generation.

**Solution:**

1. Redis distributed lock: first request acquires lock (SET examples:lock:{cacheKey} NX EX 5)
2. Other requests poll for lock release (WAIT pattern or short-lived checks)
3. Once lock released, all requests read from cache

**Code Pattern:**

```js
async function getCachedExamplesWithLock(cacheKey, word, hskLevel) {
  // Try cache first
  const cached = await gcsService.get(cacheKey);
  if (cached) return cached;

  // Acquire lock (or wait for lock release)
  const lockToken = `${uuid()}-${Date.now()}`;
  const lockKey = `examples:lock:${cacheKey}`;

  try {
    const acquired = await redisClient.set(lockKey, lockToken, "NX", "EX", 5);
    if (acquired) {
      // We own the lock — generate
      const result = await generateExamples(word, hskLevel);
      await gcsService.put(cacheKey, result);
      return result;
    } else {
      // Someone else has the lock — wait and retry
      await sleep(100);
      return getCachedExamplesWithLock(cacheKey, word, hskLevel);
    }
  } finally {
    // Release lock safely
    const storedToken = await redisClient.get(lockKey);
    if (storedToken === lockToken) {
      await redisClient.del(lockKey);
    }
  }
}
```
````

**Lesson:** Single-flight deduplication is critical for expensive APIs under concurrent load.

### Challenge 3: HMAC Key Rotation During Deployment

**Problem:** Cache keys computed with secret key K1. On rotation, need to compute keys with K2 while K1-prefixed objects still in cache.

**Root Cause:** Old cache keys become inaccessible after rotation if only K2 is used.

**Solution:**

1. Maintain dual-key reads in service: try new key first; if miss, try old key
2. Lazy rewrite: when old key hit, write same payload to new key (rekey operation)
3. After retention period (90+ days after rotation), old key namespace can be dropped

**Implementation Example:**

```js
async function getExamplesWithKeyRotation(word, hskLevel, language) {
  const newKey = computeKey(ACTIVE_HMAC_KEY, word, hskLevel, language);
  let result = await gcsService.get(newKey);

  if (!result) {
    // Try old key (during rotation window)
    const oldKey = computeKey(PREVIOUS_HMAC_KEY, word, hskLevel, language);
    result = await gcsService.get(oldKey);

    if (result) {
      // Rekey: write to new key
      await gcsService.put(newKey, result);
    }
  }

  return result;
}
```

**Lesson:** HMAC rotation with dual-key reads prevents cache invalidation during key rolls.

### Challenge 4: Cache Invalidation Strategy

**Problem:** If example generation logic improves, how do we invalidate stale cached examples?

**Root Cause:** Cache keys include version token (v1, v2, ...); but if token not incremented, old examples persist 30 days.

**Solution:**

1. Cache key includes version: `HMAC(key, "${word}|${hskLevel}|${language}|v1")`
2. To invalidate: increment version to v2 in prompt/config
3. New requests generate examples with v2 key; old v1 keys age out naturally (30-day lifecycle rule handles deletion)
4. No manual cache flush needed

**Lesson:** Version tokens in cache keys enable graceful invalidation without external cache management.

````

**Deployment Checklist (NEW):**
```markdown
## Deployment Checklist

**HMAC Key Rotation:**
- [ ] Secret Manager resource created in Terraform (examples-cache-hmac-key)
- [ ] Key rotation policy configured (90-day automatic rotation)
- [ ] Service account has `secretmanager.secretAccessor` IAM role
- [ ] Application code loads EXAMPLES_CACHE_HMAC_KEY at startup (from Secret Manager or env var)
- [ ] Dual-key read logic implemented and tested (try new, fall back to old)
- [ ] Rotation procedure documented in runbook

**Prometheus Setup:**
- [ ] Prometheus scrape job configured for backend `:9090/metrics` endpoint
- [ ] Recording rule deployed: `examples_cache_hit_ratio = rate(examples_cache_hits_total[7d]) / (rate(examples_cache_hits_total[7d]) + rate(examples_cache_misses_total[7d]))`
- [ ] Alert rule deployed: fires when `examples_cache_hit_ratio < 0.80` for 15 minutes
- [ ] Grafana dashboard created with panels: (1) hit rate over time, (2) hits/misses breakdown, (3) generation latency histogram
- [ ] Alert action configured (PagerDuty, Slack, etc.)

**Redis Security:**
- [ ] Redis endpoint uses TLS (rediss:// protocol)
- [ ] ACL rule created: `ACL SETUSER examples_service on >password ~examples:* +GET +SET +DEL +PEXPIRE`
- [ ] REDIS_URL env var (or REDIS_HOST + REDIS_PASSWORD + REDIS_TLS) configured
- [ ] Connection test in CI verifies TLS + auth (fail fast if credentials missing)

**GCS Configuration:**
- [ ] Service account created: `examples-service`
- [ ] Bucket created: `gs://{project}-examples-cache`
- [ ] IAM bindings: `examples-service` has roles/storage.objectCreator + roles/storage.objectViewer
- [ ] Lifecycle rule configured: delete objects age > 30 days
- [ ] Uniform bucket-level access enabled
- [ ] Public access block enabled
- [ ] Cloud Audit Logs enabled (DATA_READ + DATA_WRITE)
- [ ] Audit logs exported to BigQuery sink (90-day retention)

**Load Testing:**
- [ ] Load test script runs 100 concurrent requests for same word (verifies single-flight deduplication)
- [ ] Hit rate captures during load test (expect >70% after warm-up)
- [ ] Latency p99 captured (expect <500ms for cache hit, <2s for cache miss)
- [ ] Cost estimate calculated (storage + Gemini + GCS ops)

**Pre-Launch Verification:**
- [ ] `terraform plan` passes for all GCS + monitoring + IAM resources
- [ ] Unit tests for gcsCacheService pass
- [ ] Integration tests for Redis lock + GCS write pass
- [ ] Load test metrics exported to Prometheus
- [ ] Runbook documenting normal operation and common issues drafted
````

**Performance Targets (NEW):**

```markdown
## Performance & Cost Targets

| Metric                             | Target                                                 | Rationale                                                                               |
| ---------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| **Cache Hit Rate (7-day rolling)** | >70% by day 14, >80% by day 30                         | Depends on word diversity and warm-up job effectiveness                                 |
| **Response Latency (cache hit)**   | <200ms p99                                             | GCS lookup + JSON parse + network round-trip                                            |
| **Response Latency (cache miss)**  | <2s p99                                                | Lock acquisition (100ms) + Gemini generation (800-1200ms) + GCS write (200ms) + network |
| **Generation Latency (Gemini)**    | 800-1200ms (median)                                    | Gemini API typical performance for 10-50 token generation                               |
| **Lock Contention (p99)**          | <100ms wait per lock holder                            | 5s TTL, typical generation 500-1000ms, so max 4-5 waiters                               |
| **Storage (GCS)**                  | ~5GB per 50,000 words @ 100KB per example object       | Lifecycle rule deletes after 30 days (rolling window)                                   |
| **Cost Savings vs. No Cache**      | >50% reduction in Gemini calls                         | Assuming >75% hit rate over time                                                        |
| **Cost per Request (cache miss)**  | ~$0.01 (Gemini) + ~$0.002 (GCS) + Redis ops negligible | Baseline without caching ~$0.015 per call                                               |

**Monitoring & Alerts:**

- Dashboard auto-refreshes every 30 seconds
- Alert fires within 15 minutes of threshold breach
- Cost alerts fire when daily spend exceeds $100 (configurable)
```

**Future Work & Standardization (NEW):**

````markdown
## Future Work & Standardization

### CacheableGenerationFactory Design

The hybrid caching pattern (Redis lock + GCS persistent cache + HMAC keys + Prometheus metrics) is applicable to all expensive API operations:

- Story 17: Audio generation caching
- Story 18: Quiz generation caching
- Story 19: Flashcard generation caching

**Recommendation:** After Story 16.3 closure, design a `CacheableGenerationFactory` utility to avoid N copies of lock/cache/metrics boilerplate.

**Design Sketch:**

```js
class CacheableGenerationFactory {
  constructor({
    bucketPrefix,           // 'examples/' or 'audio/' or 'quiz/'
    metricsLabel,          // 'examples_generation', 'audio_generation', ...
    hmacSecret,            // EXAMPLES_CACHE_HMAC_KEY, AUDIO_CACHE_HMAC_KEY, ...
    redisClient,
    gcsClient,
    metrics
  }) { ... }

  // Returns a decorated async function that handles cache orchestration
  decorate(generatorFn, { keyComponents, ttl = 3600 }) {
    return async (...args) => {
      const cacheKey = this.computeHmacKey(keyComponents);

      // Check GCS cache
      const cached = await gcsClient.get(bucketPrefix + cacheKey);
      if (cached) {
        metrics.increment(metricsLabel + '_hits');
        return cached;
      }

      // Acquire lock
      const lockToken = this.acquireLock(cacheKey, ttl);
      if (!lockToken) {
        // Wait for other generator to finish
        await this.waitForLock(cacheKey);
        return gcsClient.get(bucketPrefix + cacheKey);
      }

      // Generate
      const result = await generatorFn(...args);
      await gcsClient.put(bucketPrefix + cacheKey, result);

      // Release lock
      this.releaseLock(cacheKey, lockToken);

      metrics.increment(metricsLabel + '_misses');
      return result;
    };
  }
}

// Usage
const exampleFactory = new CacheableGenerationFactory({ ... });
const cachedGenerator = exampleFactory.decorate(generateExamples, {
  keyComponents: [word, hskLevel, language],
  ttl: 5
});
```
````

**Retrofit Plan:**

- Post-Story 16.3: Design + review factory (2 hours)
- Epic 8 retroactive migration: Use factory for conversation caching (3 hours, low risk)
- Stories 17-19: Use factory for respective caching (1 hour each, faster onboarding)

### Epic 8 Conversation Retrofit

Modernize Epic 8 to use same pattern (wrapper + factory) for consistency:

- Minimal risk (existing feature, working production code)
- Validates factory design before Stories 17-19 adopt it
- Improves test isolation and maintainability

````

**Estimated Changes:** 30% expansion — Add Clean Arch section, Deployment Checklist, Performance Targets, Future Work

---

### Work Package 3: Architecture.md Caching Patterns Section

**File:** [docs/architecture.md](../../docs/architecture.md)

**New Section to Add (After "Backend Architecture" section, before "Frontend Architecture"):**

**Section: "Caching Patterns for Expensive Operations"**

**Length:** 250–350 lines

**Subsections:**
1. When to Cache (decision criteria)
2. Recommended Pattern: Hybrid (Lock + Persistent)
3. Pattern Components Explained (Redis lock, GCS cache, HMAC keys, Prometheus metrics)
4. Design Decision & Tradeoffs
5. Implementation Examples (Story 16 Examples, Epic 8 Conversations)
6. Future Standardization (CacheableGenerationFactory)

**Content Outline:**

```markdown
## Caching Patterns for Expensive Operations

**Purpose:** Reduce API costs and improve latency for slow, deterministic operations (AI generation, TTS synthesis, batch processing).

### When to Cache Expensive Operations

Use hybrid caching (Redis lock + GCS persistent cache) when:

✅ **DO Cache if:**
- Operation cost is HIGH ($0.01 – $0.50 per call): Gemini API (8–25 tokens), TTS synthesis (10–30s generation)
- Operation is DETERMINISTIC: identical inputs always produce identical outputs (examples, audio, quizzes)
- LATENCY SENSITIVE: users wait for result (< 2s p99)
- QUERY SPACE is KNOWN: top-N words, HSK levels, or limited parameter combinations
- RETENTION is ACCEPTABLE: 30–90 day cache age OK (examples, audio); longer for reference data

❌ **DON'T Cache if:**
- Operation cost is LOW: < $0.001 per call (simple database lookup, in-memory compute)
- Operation is NON-DETERMINISTIC: personalization, randomized output, time-dependent
- USER CONTEXT VARIES: results change based on user profile, progress, preferences
- QUERY SPACE is UNBOUNDED: millions of unique cache keys = storage explosion
- REAL-TIME ACCURACY REQUIRED: always need fresh data (leaderboards, live scores)

### Recommended Pattern: Hybrid (Lock + Persistent)

**Architecture:**

````

Cache Check (GCS)
↓ (hit)
Return cached result [latency: 100–300ms]
↓ (miss)
Acquire Redis Lock (distributed single-flight dedup)
↓ (lock acquired)
Generate (Gemini, TTS, etc.)
↓
Validate & Transform Result
↓
Write to GCS (persistent cache)
↓
Emit Prometheus Metrics
↓
Return result [latency: 1–3 seconds]
↓ (lock not acquired)
Backoff & Poll Lock Release
↓ (lock released)
Read from GCS + Return

````

**Why Hybrid (Not Just Redis or Just GCS)?**

| Pattern | Pros | Cons | Use Case |
|---------|------|------|----------|
| **Redis Only** | Fast (sub-10ms), low CPU | Memory-bound (millions of entries won't fit), node-local (single instance), data loss on restart | Session state, real-time counters |
| **GCS Only** | Cheap ($0.02/GB/month), durable, scalable | Slow (100–500ms lookup), requires network round-trip | Archive, batch processing, cold data |
| **Hybrid (Lock + GCS)** | Prevents duplicate work (lock), durable + cheap (GCS), fast for hits (Redis not needed for read) | More complex, multi-step, requires distributed lock | Expensive AI/TTS operations, high concurrency |

**Selected Rationale:** Examples and audio generation are 200–1500ms operations; lock prevents concurrent processes from redundantly generating; GCS persists across deployments; cost savings (50%+) justify orchestration complexity.

### Pattern Components

**1. Distributed Lock (Redis)**
- **Purpose:** Single-flight deduplication; prevent thundering herd on cache miss
- **Implementation:** `SET examples:lock:{cacheKey} {uuid} NX EX {ttl}`
- **TTL:** Must be >= generation latency + margin (typically 1.5x generation time)
  - Examples (500ms generation) → 5s TTL
  - Audio (1–2s generation) → 3s TTL
  - Quiz (3–5s generation) → 7–8s TTL
- **Lock Value:** Must be unique (`{uuid}-{timestamp}`) to avoid hijacking on release
- **Fallback:** If Redis unavailable, degrades gracefully (no dedup, but requests still complete)

**2. Persistent Cache (GCS)**
- **Purpose:** Cost reduction (prevent redundant generation), survive restarts
- **Lifecycle:** Delete objects after TTL (typically 30 days for user-facing data, 90 days for analytics)
- **Size:** ~100KB per example, ~500KB per audio file, configurable by data type
- **Access:** Service account-based (no user-facing signed URLs)
- **Bucket Configuration:** Uniform access, public access blocked, audit logging enabled

**3. Cache Keys (HMAC-SHA256)**
- **Purpose:** Prevent enumeration attacks; maintain determinism without exposing secrets
- **Format:** `HMAC_SHA256(HMAC_SECRET, "{word}|{hskLevel}|{language}|{version}")`
- **Result:** 64-character hex string; object name = `examples/{hex}.json` (no plaintext)
- **Rotation:** Key rolled every 90 days; service maintains dual-key reads (try new, fall back to old)
- **Why HMAC (not plain SHA256):** If attacker has unencrypted corpus, they can precompute SHA256 hashes and enumerate all cache keys. HMAC with server-side secret prevents this.

**4. Observability (Prometheus)**
- **Metrics:**
  - `{service}_cache_hits_total` — incremented on GCS hit
  - `{service}_cache_misses_total` — incremented on GCS miss
  - `{service}_generation_latency_seconds` — histogram of generation time
  - `{service}_cache_hit_ratio` — derived gauge: hits / (hits + misses) over 7-day window
- **Alert:** Fires when 7-day rolling hit ratio < 75–80% (configurable by API)
- **Dashboard:** Real-time hit rate, latency breakdown, cost projection

### Design Decisions & Tradeoffs

**Decision 1: Why Redis Lock + GCS, not one or the other?**

| Tradeoff | Decision | Rationale |
|----------|----------|-----------|
| Complexity | Hybrid (lock + cache) | Prevents duplicate work under load (lock) + durable + cheap (GCS). Single-flight dedup is critical for expensive APIs. |
| Memory | Use Redis for lock, not full cache | Cache objects too large for memory (audio files 500KB+); Redis best for short-lived distributed lock. |
| Latency | Accept 100–500ms GCS read | Tradeoff well worth it for 50%+ cost savings. Users already wait 1–3s for generation; cache hit is secondary benefit. |

**Decision 2: Why HMAC-SHA256 keys?**

| Tradeoff | Decision | Rationale |
|----------|----------|-----------|
| Complexity | HMAC (vs SHA256) | Plain SHA256 doesn't protect against precomputation attacks using unencrypted source data. HMAC requires knowledge of secret. Cost of HMAC is <1ms. |
| Auditability | Accept opaque keys | Cache key is `{hmac hex}` not `word-hsk-lang`. Requires database lookup to find associated word. Tradeoff: security > auditability for cache names. |
| Rotation | Dual-key reads + version token | Single key rotation would invalidate whole cache. Dual reads allow 90-day rotation window without gaps. |

### Implementation Examples

**Story 16.3: Single-Line Examples**
- Cost: ~$0.01 per generation (Gemini API)
- Latency: 200–500ms generation
- Hit Rate: 70%+ expected after warm-up
- Storage: ~50–100B per example (100KB per 1000-example bundle)
- See: [Story 16.3 Example Caching & Performance](../business-requirements/epic-16-word-examples/story-16-3-example-caching-performance.md)

**Epic 8: Conversation Generation**
- Cost: ~$0.05 per generation (Gemini API for 3–5 turn dialogue)
- Latency: 1–3 seconds generation
- Hit Rate: 66–75% (demonstrated in production)
- Storage: ~500B per conversation
- See: [Epic 8 Implementation README](../issue-implementation/epic-8-conversation-generation/README.md)

Both implementations use same pattern; Story 16.3 improves Epic 8 by adding distributed lock + comprehensive Prometheus metrics.

### Future Standardization: CacheableGenerationFactory

To avoid duplicating lock + cache + metrics orchestration across APIs (Stories 17 Audio, 18 Quiz, 19 Flashcards), plan a shared utility:

```js
class CacheableGenerationService {
  // Wraps any expensive async operation with cache + lock + metrics
  // Config: { bucketPrefix, redisKeyPrefix, metricsLabel, hmacSecret, ttl }
  // Returns: async function that handles cache orchestration
}
````

This factory will:

- Reduce boilerplate code copy-paste (currently needed for each API)
- Enforce consistent lock TTL, metrics labels, key rotation
- Enable easier testing (mock factory instead of GCS + Redis)
- Upgrade path for Epic 8 (retrofit to use factory instead of inline caching)

Status: Designed in Story 16.3 review; planned for implementation before Stories 17–19.

````

**Content Placement:** Add after "Backend Architecture" section (after dependency injection paragraph) and before "Frontend Architecture" section.

**Cross-Links:**
- Within section: Link down to Story 16.3 and Epic 8 for implementation details
- From Story 16.3 docs: Link up to architecture.md caching section for context

**Estimated Word Count:** 2,500–3,500 words (1–1.5 pages)

**Estimated Changes:** New section; no impact on existing content

---

### Work Package 4: Cross-Document Linking & Status Alignment

**Files to Update:**

| File | Action | Details |
|------|--------|---------|
| [docs/business-requirements/epic-16-word-examples/README.md](../../docs/business-requirements/epic-16-word-examples/README.md) | Verify bidirectional links | Check that Epic BR links to Story 16.3 BR; Story 16.3 BR links back |
| [docs/issue-implementation/epic-16-word-examples/README.md](../../docs/issue-implementation/epic-16-word-examples/README.md) | Verify bidirectional links | Check that Epic impl links to Story 16.3 impl; Story 16.3 impl links back |
| [docs/business-requirements/epic-16-word-examples/story-16-3-example-caching-performance.md](../../docs/business-requirements/epic-16-word-examples/story-16-3-example-caching-performance.md) | Add architecture.md reference | In BR doc, add section "Related Documentation" with link to architecture.md caching patterns |
| [docs/issue-implementation/epic-16-word-examples/story-16-3-example-caching-performance.md](../../docs/issue-implementation/epic-16-word-examples/story-16-3-example-caching-performance.md) | Add architecture.md reference | In impl doc, add section "Related Documentation" with link to architecture.md caching patterns |
| [docs/architecture.md](../../docs/architecture.md) | Add forward links to stories | In caching section, link down to Story 16.3 and Epic 8 implementation docs |

**Status Field Synchronization:**

- Ensure BR "Status" field and Implementation "Status" field match at all times
- Ensure "Last Update" dates are identical for BR + Implementation for same story
- After PR merge, both docs should list same PR number

**Estimated Changes:** <5% — Mostly adding cross-reference links, no content changes

---

## Risks & Tradeoffs

| Risk | Severity | Mitigation |
|------|----------|-----------|
| **Docs become too prescriptive** (e.g., "always use CacheableGenerationFactory") | ⚠️ Medium | Keep architecture.md as guidance, not mandate. Different APIs may have different patterns. |
| **Code examples become stale** (library versions change, patterns evolve) | ⚠️ Medium | Code examples must be validated during implementation (Docs Curator runs code snippets). Add "Last Updated" date to code blocks. |
| **Cross-linking breaks** (docs moved, links not updated) | ⚠️ Medium | Verify all links are relative paths (no absolute URLs). Use markdown link checker in CI. |
| **AC items are vague** (e.g., "monitoring set up" is not testable) | 🔴 High | This design explicitly makes AC testable (e.g., "Prometheus counter increments on cache hit"). Docs Curator must validate. |
| **Clean Arch section too theoretical** (developers glaze over) | ⚠️ Low | Keep section code-focused; show concrete examples (CachedExampleService vs ExampleService class definitions). |

---

## Recommended Next Delegation

**Primary Delegation:** Docs Curator

**Phase 1 (Days 1–2):**
1. Reorganize BR AC items (Work Package 1) — 2 hours
2. Verify bidirectional cross-links (Work Package 4) — 1 hour
3. Review HMAC/Redis/Prometheus requirements for clarity (spot check) — 30 min

**Phase 2 (Days 2–3):**
1. Expand implementation doc with Clean Arch section (Work Package 2) — 3 hours
2. Add Deployment Checklist + Performance Targets (Work Package 2) — 2 hours
3. Test code examples (HMAC computation, lock pattern, GCS write) — 1 hour

**Phase 3 (Days 3–4):**
1. Draft architecture.md caching section (Work Package 3) — 4 hours
2. Add cross-links and validate all markdown links work — 1 hour
3. Final review: status fields, dates, bidirectional links — 1 hour

**QA Gate Before Merge:**
- ✅ All AC items in BR are testable/verifiable
- ✅ All code examples are syntactically correct (can be copy-pasted)
- ✅ All cross-links resolve and are bidirectional
- ✅ Status + Last Update dates are identical across BR + Implementation
- ✅ Template structure is strictly followed (no extra sections)

**Total Estimated Effort:** 6–8 hours (split across 4 days)

---

## Design Review Checklist

**Before Docs Curator begins implementation, confirm:**

- ✅ Does the reorganized AC list capture all MUST-HAVE requirements from architectural review?
- ✅ Does the Clean Arch section explain wrapper pattern without overwhelming non-architects?
- ✅ Are all three code examples (HMAC, lock, GCS write) actually implementable by developers?
- ✅ Does the Deployment Checklist cover HMAC rotation, Prometheus setup, Redis security, load testing?
- ✅ Does the Performance Targets section include concrete metrics (hit rate %, latency bounds)?
- ✅ Does architecture.md caching section avoid story/epic numbers and use descriptive patterns instead?
- ✅ Are all cross-links bidirectional (BR ↔ Impl, Arch ↔ Stories)?
- ✅ Does the Future Work section on CacheableGenerationFactory make the design decision clear without overpromising?
- ✅ Are status fields (Status, Last Update, PR) identical across BR and Implementation?

---

## Success Criteria for Implementation

✅ **Documentation is complete when:**

1. Story 16.3 BR has **10 clear, testable AC items** (versus current 5 scattered items)
2. Story 16.3 Implementation doc has **5 new sections** (Clean Arch, Deployment, Performance, Future Work, Technical Challenges)
3. Architecture.md has a new **Caching Patterns section** (250–350 lines) with decision rationale
4. All **cross-links are bidirectional** and working (can navigate: BR → Impl → Architecture → back to stories)
5. All **code examples are validated** (HMAC computation, Redis lock, GCS write patterns work as written)
6. **Status fields match** across BR and Implementation (same "Status", "Last Update", "PR")
7. **No non-template sections** are present (no extra sections beyond those in templates)
8. Docs Curator has **zero ambiguity** about what goes where (instructions are unambiguous)

✅ **Documentation is NOT complete if:**

1. AC items are still vague (e.g., "monitoring is set up")
2. Clean Architecture section is missing or unclear
3. Code examples don't match actual implementation patterns
4. Cross-links are one-directional or broken
5. Status fields differ between BR and Implementation
6. Architecture.md caching section references specific story/epic numbers
7. Curator needs to ask clarifying questions about placement/content

---

## Files Delivery & Summary

| File | Type | Current State | Target State | Effort |
|------|------|---------------|--------------|--------|
| BR Story 16.3 | Business Requirements | Functionally correct but poorly organized | Reorganized AC items (clear testable statements) | 2 hrs |
| Impl Story 16.3 | Implementation | Comprehensive but missing 3 sections | Add Clean Arch, Deployment, Performance, Future Work, Tech Challenges | 6 hrs |
| Architecture.md | High-Level Docs | Missing caching patterns entirely | Add new caching section with decision rationale | 4 hrs |
| Epic 16 READMEs | Cross-Links | Present but not bidirectional | Verify bidirectional links (no content changes) | 1 hr |
| **TOTAL** | — | — | — | **13 hrs** |

**Docs Curator handoff:** Provide this specification to the Docs Curator role. They will implement all work packages 1–4 based on this design, following templates strictly, ensuring all code examples work, and validating all cross-links before merge.

---

## Answers to Key Design Questions

### Q1: Should BR surface Clean Architecture wrapper pattern decision?

**Answer: NO.**

**Rationale:**
- Business Requirements are for **stakeholders** (product managers, users), not architects
- BR should state WHAT needs to happen ("examples must be cached with security + monitoring")
- HOW (wrapper vs inline) is implementation detail
- BR does not list ("we'll use a factory" or "we'll inject dependencies")

**Placement:** Clean Architecture pattern discussion belongs in **Implementation doc** (for developers), not BR. Architecture.md can explain why it's important for framework portability, but not prescriptively.

---

### Q2: How many code examples in Implementation doc?

**Answer: THREE core examples.**

1. **HMAC Key Computation** (with secret rotation)
   ```js
   function computeCacheKey(secret, word, hskLevel, language, version = 'v1') {
     const src = `${word}|${hskLevel}|${language}|${version}`;
     return createHmac('sha256', secret).update(src, 'utf8').digest('hex');
   }
````

Why: Developers need to understand HMAC over plain SHA256. Shows version token for rotation.

2. **Redis Lock Acquisition** (with unique value + TTL)

   ```js
   async function acquireGenerationLock(cacheKey, ttl = 5000) {
     const lockToken = `${uuid()}-${Date.now()}`;
     const lockKey = `examples:lock:${cacheKey}`;
     const acquired = await redisClient.set(lockKey, lockToken, "PX", ttl, "NX");
     return acquired ? lockToken : null;
   }
   ```

   Why: Single-flight deduplication is the key innovation. Developers need to see unique value (prevents hijacking) and TTL choice.

3. **GCS Write with Validation** (before persistence)
   ```js
   async function persistExamplesToCache(cacheKey, examples) {
     // Validate structure
     if (!Array.isArray(examples) || examples.length === 0) {
       throw new Error("Invalid examples payload");
     }
     examples.forEach((ex) => {
       if (!ex.chinese || !ex.pinyin || !ex.english) {
         throw new Error("Missing required fields");
       }
     });

     // Write atomically
     await gcsService.put(`examples/${cacheKey}.json`, JSON.stringify(examples));
   }
   ```
   Why: Shows validation-before-write pattern. Prevents garbage data in cache.

**Why not more?** Too many examples dilute focus. These three are the critical patterns. Full service implementation shown in separate code block.

---

### Q3: Should "Prometheus dashboard deployed" be an AC item?

**Answer: PARTIALLY.**

**Split:**

- ✅ **AC Item:** "Prometheus counter `examples_cache_hits_total` increments on every cache hit"
- ✅ **AC Item:** "Prometheus alert fires when 7-day rolling hit rate < 80%"
- ❌ **NOT AC:** "Grafana dashboard created and displayed on monitoring wall"

**Rationale:**

- **Metric emission is behavioral requirement** → testable in code (unit test verifies counter incremented)
- **Dashboard is deployment task** → operational concern, belongs in runbook/Deployment Checklist
- Alert firing is **behavioral requirement** → can test by simulating low hit rate

**Placement:**

- BR AC: "Prometheus metrics emit with labels: examples_cache_hits_total, examples_cache_misses_total, examples_generation_latency_seconds"
- Implementation Deployment Checklist: "Prometheus dashboard created with panels: (1) hit rate, (2) latency histogram, (3) cost projection"

---

### Q4: How much caching pattern guidance in architecture.md?

**Answer: One comprehensive section (250–350 lines / 1–1.5 pages).**

**Structure:**

1. **Decision Criteria** (1 table: when to cache vs. when not to)
2. **Architecture Diagram** (ASCII or flowchart)
3. **Pattern Components** (Redis lock, GCS cache, HMAC keys, metrics)
4. **Design Tradeoffs** (2 tables: hybrid vs. single-approach, HMAC vs. plain)
5. **Examples** (Story 16.3, Epic 8 as reference implementations)
6. **Future Standardization** (CacheableGenerationFactory sketch, not prescribed)

**Why not more:** Avoid analysis paralysis. Developers implement Story 16.3 using the checklist in implementation doc; architecture section helps future APIs (Stories 17-19) decide "do I need caching?"

**Why reference decision trees:** Future APIs will ask "Should I cache audio?" or "Should I cache quiz results?" Architecture section provides framework for that decision.

---

### Q5: Should architecture.md link to specific code files?

**Answer: YES, but use future tense and relative paths.**

**Good Examples:**

- "See [gcsCacheService.js](../apps/backend/src/services/gcsCacheService.js) for GCS read/write abstraction (Story 16.3 implementation)"
- "Inspect [CachedConversationService.js](../apps/backend/src/services/CachedConversationService.js) for wrapper pattern precedent"
- "Refer to [Story 16.3 implementation docs](../docs/issue-implementation/epic-16-word-examples/story-16-3-example-caching-performance.md) for full service implementation"

**Bad Examples:**

- ❌ "This pattern is used in Story 16.3 exclusively" (too specific, discourages generalization)
- ❌ "All APIs must use CacheableGenerationFactory" (prescriptive, not guidance)
- ❌ "The examples caching service at `C:\projects\mandarin\apps\backend\src\services\gcsCacheService.js`" (absolute path, OS-specific)

**Why:** Developers benefit from seeing where patterns live in codebase. Relative markdown links work everywhere. Future tense ("will be implemented in") acknowledges code doesn't exist yet.

---

## Conclusion

This documentation design specification provides a **structured, actionable roadmap** for the Docs Curator to implement all necessary updates for Story 16.3. The four work packages address:

1. **BR reorganization** — Make AC items testable
2. **Implementation expansion** — Add Clean Arch, Deployment, Performance, Future Work sections
3. **Architecture guidance** — New caching patterns section for future APIs
4. **Cross-linking** — Ensure bidirectional navigation between all docs

**Total effort:** 6–8 hours over 4 days.

**Key constraint:** All content must comply with existing templates; no extra sections added.

**Next step:** Docs Curator reads this specification, confirms understanding of all four work packages, and implements sequentially with QA validation at each step.
