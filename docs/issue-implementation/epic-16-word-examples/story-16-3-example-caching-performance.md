# Implementation 16-3: Example Caching & Performance

See Business Requirements: ../../business-requirements/epic-16-word-examples/story-16-3-example-caching-performance.md
See Epic Implementation: ./README.md

Last Update: 2026-04-09
Status: Planned

## Technical Scope

- Files / infra to add or update:
  - `apps/backend/src/services/gcsCacheService.js` (GCS read/write helpers, JSON objects)
  - `apps/backend/src/services/cacheMetrics.js` (emit Prometheus/Cloud Monitoring metrics)
  - `apps/backend/src/middleware/cacheLogger.js` (structured logging wrapper)
  - `terraform/gcs/examples-bucket.tf` (bucket + lifecycle 30 days)
  - `terraform/monitoring/alerts.tf` (alert for cache hit rate)
  - `apps/backend/tests/gcsCacheService.test.js` (unit/integration tests)

## Implementation Details

Cache key strategy:

- Source string: `${wordId}:${difficulty}:v1`

- Final object name: `examples/${hmac_sha256(EXAMPLES_CACHE_HMAC_KEY, source)}.json`

### Cache Key Pattern (Implementation)

Key formula: compute an HMAC-SHA256 hex digest over the UTF-8 concatenated input `word|hskLevel|language|v1` using a server-side secret `EXAMPLES_CACHE_HMAC_KEY`. Store the object using a hash-only name: `examples/<hmac-hex>.json`.

Rationale: object names MUST NOT contain the plain `word` or other user-supplied identifiers to prevent enumeration attacks. Using HMAC with a secret preserves determinism while adding secret entropy that prevents offline precomputation of object names.

Implementation example (Node.js):

```js
const { createHmac } = require("crypto");
function computeCacheKey(secret, word, hskLevel, language) {
  const src = `${word}|${hskLevel}|${language}|v1`;
  return createHmac("sha256", secret).update(src, "utf8").digest("hex");
}
```

Operational notes:

- `EXAMPLES_CACHE_HMAC_KEY` is provisioned from Secret Manager (or Kubernetes Secret) and is rotated regularly (e.g., every 90 days). During rotation the service supports dual-key reads (try active key, then previous key) and writes use the active key.

### Prometheus Metrics Specification

- Counter: `examples_cache_hits_total{story="16-3"}` — increment on every cache hit.
- Counter: `examples_cache_misses_total{story="16-3"}` — increment on every cache miss.
- Histogram: `examples_generation_latency_seconds{story="16-3"}` — observe Gemini generation latency (seconds) for histogram buckets.
- Gauge: `examples_cache_hit_ratio{story="16-3"}` — computed as hits / (hits + misses) over a 7-day rolling window (recording rule).
- Alert: fire when 7-day rolling `examples_cache_hit_ratio{story="16-3"}` < 0.80.

Implementation notes:

- Emit `examples_cache_hits_total` / `examples_cache_misses_total` at request-time with `wordId` (or `word`) label for aggregation.
- Use a recording rule to compute the 7-day rolling hit ratio and expose it as `examples_cache_hit_ratio{story="16-3"}`.

### Single-Flight Dedupe Implementation

### Redis Security Requirements

- Redis connection MUST use TLS in production and require password authentication. Configure `REDIS_PASSWORD` (or use a secret manager) and connect to a TLS-enabled Redis endpoint.
- Lock TTL must be specified (recommended **5 seconds**). Do not use unlimited TTLs.
- Lock value MUST be unique per owner: use the format `<uuid>-<timestamp>` and validate the stored value before releasing the lock to prevent hijacking.
- Acquire atomically using: `SET examples:lock:{cacheKey} {uuid} NX EX 5`.
- Heartbeat/renewal: if generation may exceed the lock TTL, the generator MAY renew the lock periodically (e.g., every 2 seconds) using a safe compare-and-set pattern; if renewal fails, stop renewing and allow others to acquire the lock.
- Multi-instance deployments MUST use Redis locks. In-process Map fallback is acceptable only for single-instance deployments and must be documented as such.

Implementation details (Redis credentials & connection):

- Credentials sourcing: `REDIS_URL` or `REDIS_HOST`/`REDIS_PORT` with `REDIS_PASSWORD` are provided to the service via Secret Manager or Kubernetes Secrets. Do NOT embed credentials in source control.
- ACL: create a dedicated user `examples_service` with minimal permissions and key namespace scoped to `examples:*` (example ACL command shown below).
- Connection policy: `connectTimeout=5000ms`, `maxRetriesPerRequest=3`, exponential backoff, and `tls.rejectUnauthorized=true`.

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

Cache read/write logic (pseudocode):

```js
async function getCachedExamples(key) {
  const obj = await gcs.getObject(key);
  if (!obj) {
    metrics.increment("examples_cache_miss");
    return null;
  }
  metrics.increment("examples_cache_hit");
  return JSON.parse(obj);
}

async function putCachedExamples(key, payload) {
  await gcs.putObject(key, JSON.stringify(payload));
}
```

Deduplication / single-flight:

- Use an in-process map for single-instance dedupe; for multi-instance, use Redis or database-based lock with short TTL.

Lifecycle & retention:

- Terraform creates `gs://<examples-bucket>` with a lifecycle rule that deletes `examples/*` after **30 days**.

### GCS Access Control & IAM

- Service account: create a dedicated GCS service account for examples caching. Do NOT reuse TTS service account credentials.
  - Assign least-privilege roles: `roles/storage.objectCreator` and `roles/storage.objectViewer` only.
  - Avoid `roles/storage.admin` or broader roles.
- Bucket configuration:
  - Bucket must be PRIVATE (no public access).
  - Enable uniform bucket-level access (uniform_bucket_level_access = true).
  - Grant only the backend service account access via IAM bindings.

Terraform example:

```hcl
resource "google_storage_bucket" "examples" {
  name = "examples-bucket"
  uniform_bucket_level_access = true
}
resource "google_storage_bucket_iam_member" "backend_access" {
  bucket = google_storage_bucket.examples.name
  role = "roles/storage.objectCreator"
  member = "serviceAccount:${google_service_account.backend.email}"
}
```

## Implementation additions (concrete Terraform for service account, bindings, and audit sink)

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

- Audit logging:
  - Enable Cloud Audit Logs for `DATA_READ` and `DATA_WRITE` on the bucket.
  - Retain audit logs for at least **90 days** and store them in Cloud Logging / BigQuery via the sink above.

Metrics & monitoring:

- Emit counters: `examples_cache_hits_total{story="16-3"}`, `examples_cache_misses_total{story="16-3"}`.
- Emit histogram: `examples_generation_latency_seconds{story="16-3"}`.
- Create a derived recording rule: `examples_cache_hit_ratio{story="16-3"}` = hits / (hits + misses) calculated over a 7-day window (recording rule).
- Alert: trigger when 7-day rolling `examples_cache_hit_ratio{story="16-3"}` < 0.80.

Cost monitoring:

- Export per-bucket storage daily estimate via billing export and create budget alerts for unexpected spikes.

## Architecture Integration

- `exampleService` (Story 16.1) calls `gcsCacheService` as its first step; metrics emitted at call sites.
- Terraform-managed bucket used for both example payloads and optionally generated audio (audio lifecycle aligned to policy).
- Monitoring integrates into existing dashboards and alerting channels.

```
[Backend exampleService] -> gcsCacheService (reads/writes) -> metrics -> monitoring & alerts
```

## Technical Challenges & Solutions

Problem: Achieving >80% cache hit rate immediately is unlikely for new feature rollout.
Solution: Warm cache for top-N words (pre-generate examples via job); track hit rate per-word and iterate.

Problem: Duplicate Gemini calls across instances on cache miss.
Solution: Redis-based lock or short-lived GCS lock object + polling. Implement single-flight dedupe with fallback TTL.

Problem: Validating lifecycle rule via code/CI.
Solution: Add `terraform plan` checks in CI and a small integration test that inspects bucket lifecycle rule via provider API.

## Dependency & Credential Management

- Credentials & secrets:
  - Use `GCS_SERVICE_ACCOUNT_KEY` environment variable (distinct from TTS credentials) for the examples caching service.
  - Store secrets in Google Secret Manager (or equivalent). Do NOT commit keys to source control.
  - Rotate service account keys every **90 days** and document the rotation procedure.
- Dependency security:
  - Enable Dependabot or Snyk to scan dependencies such as `@google-cloud/storage`, `google-auth-library`, and `redis`.
  - Apply security patches within **7 days** for critical vulnerabilities and within a reasonable SLA for lower-severity fixes.

## Logging Policy

- Never log API keys, service account private keys, full Gemini responses, or user PII in application logs.
- Redact sensitive data with `[REDACTED]` or omit entirely.
- Audit logs may include `word` labels only in controlled, access-restricted audit storage; avoid including full Gemini responses in standard application logs.

### Audit Logging (Implementation)

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

- Example structured log entry:

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

- If example content-level auditing is required, it MUST be stored in a separate, access-restricted audit dataset with stronger access controls, and access to that dataset is subject to an approval process.

## [Optional] Testing Implementation

- Unit tests for `gcsCacheService` with GCS emulator.
- Integration test for terraform plan to assert lifecycle rule exists.
- Simulated traffic test to validate metrics (hit/miss) and evaluate whether warm-up achieves >80% hit rate for a sample population.
