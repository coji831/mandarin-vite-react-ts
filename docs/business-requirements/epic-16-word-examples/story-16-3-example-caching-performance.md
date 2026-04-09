# Story 16.3: Example Caching & Performance

## Description

**As a** backend developer,
**I want to** cache generated single-line examples in GCS, enforce a 30-day lifecycle, and monitor cache hit rates,
**So that** API costs and response latency remain low while operational health is observable.

## Business Value

Effective caching reduces per-request AI generation cost and improves user-perceived latency, enabling rapid display of examples at scale while controlling storage costs.

## Acceptance Criteria

- [ ] A GCS bucket (or existing GCS artifacts) stores example payloads with a lifecycle rule that removes objects after **30 days**.
- [ ] Backend uses the agreed SHA-256-based cache key pattern and writes validated example payloads to GCS on generation.
- [ ] Production telemetry publishes cache hit / miss counters and a derived cache hit rate metric; a 7-day rolling hit rate is available.
- [ ] Backend uses a deterministic SHA-256-based cache key. Compute the SHA-256 hex digest over the UTF-8 concatenated string `word|hskLevel|language|v1` (include explicit content `version` when format changes) and store the object using a hash-only name: `examples/<sha256>.json` (no plain-text word, no hskLevel or language in the object name).

## Cache Key Pattern

- Cache keys are computed using HMAC-SHA256 with a server-side secret key to provide entropy and prevent offline precomputation or enumeration. The deterministic formula is: `cacheKey = HMAC_SHA256(EXAMPLES_CACHE_HMAC_KEY, "${word}|${hskLevel}|${language}|v1")` and the object name is `examples/<hex-hmac>.json`.
- Rationale: HMAC with a securely stored secret (not user-supplied) preserves determinism across requests while adding secret entropy. This prevents attackers from brute-forcing object names by precomputing raw SHA-256(word) values.
- Implementation (Node.js example):

```ts
import { createHmac } from "crypto";
function computeCacheKey(secret: string, word: string, hskLevel: number, language: string) {
  const src = `${word}|${hskLevel}|${language}|v1`;
  return createHmac("sha256", secret).update(src, "utf8").digest("hex");
}
// Environment: EXAMPLES_CACHE_HMAC_KEY is required and is loaded from Secret Manager or env var
```

- Operational requirements:
  - `EXAMPLES_CACHE_HMAC_KEY` is provisioned via Secret Manager (or Kubernetes Secret) and is rotated on a defined cadence (e.g., 90 days). During rotation the service supports dual-key reads (try new, then old) and writes use the active key.

  - Rationale: object names MUST NOT contain the plain `word` or other user-supplied identifiers to prevent enumeration attacks. If an index from `word -> sha256` is required, store that mapping in a separate, access-controlled metadata store (database), not by object naming.

- [ ] Observability: dashboards show cache hit rate, generation latency, and per-day generated examples count.
- [ ] Alerting: automated alert fires if 7-day rolling cache hit rate drops below **80%** or if generation cost exceeds budgeted threshold.
- [ ] Structured logs include: `service`, `route`, `wordId`, `cache_key`, `cache_hit` (boolean), `generation_latency_ms`, `request_id`.
- [ ] A documented plan for cache warm-up (top-N words) exists and is implementable.

## Redis Connection Security

- Redis connections MUST use TLS in production and require authentication. The following configuration is required and will be enforced by CI/infra checks:
  - `REDIS_URL` (rediss://user:password@host:port) or `REDIS_HOST`/`REDIS_PORT` with `REDIS_PASSWORD` and `REDIS_TLS=true`.
  - Use Redis ACLs to create a dedicated user (e.g., `examples_service`) with minimal commands: `+GET +SET +DEL +EXPIRE` and key namespace scoped to `examples:*`.
  - Connection options: connect timeout `5000ms`, `maxRetriesPerRequest=3`, exponential backoff retry strategy, and `tls.rejectUnauthorized=true`.

Example Node connection (ioredis / redis client):

```js
const client = new Redis(process.env.REDIS_URL, {
  tls: { rejectUnauthorized: true },
  maxRetriesPerRequest: 3,
  connectTimeout: 5000,
});
await client.connect();
```

- Credentials sourcing: Redis credentials are sourced from environment variables injected from Secret Manager or Kubernetes Secrets. Service account-based connection is not assumed; if using managed Redis that supports IAM, document that flow explicitly.

## GCS IAM Policies

- The examples cache bucket is private and accessed only by a dedicated service account. Terraform resources to provision bucket and IAM bindings will be included in `terraform/gcs/examples-bucket.tf` and are defined as follows:

```hcl
resource "google_service_account" "examples_service" {
	account_id   = "examples-service"
	display_name = "Examples caching service account"
}

resource "google_storage_bucket" "examples" {
	name                       = var.examples_bucket_name
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
```

- Least privilege: the service account will NOT be granted `roles/storage.admin`.
- Bucket must have uniform bucket-level access enabled and public access blocked.

## Audit Logging

- Audit logging for cache operations is required. The system will enable Cloud Audit Logs for `DATA_READ` and `DATA_WRITE` on the examples bucket and will export a copy of audit logs to a restricted logging sink with at least **90 days** retention for compliance and debugging.
- Logged fields (structured JSON) — these fields ARE logged for each request but MUST NOT include example text or full user-provided content:

```json
{
  "timestamp": "...",
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

- Audit pipeline requirements:
  - Redact or omit `examples` payloads and `chinese`/`pinyin`/`english` fields from standard logs. If content-level audit is required, it is stored separately in a restricted audit dataset with additional access controls.
  - Create a Logging sink (Terraform `google_logging_project_sink`) that routes GCS audit logs to a secure BigQuery dataset or Cloud Storage bucket for 90-day retention and analysis.

## Business Rules

1. Cache lifecycle for _examples_ objects is **30 days**; keys must include `version` for safe rollouts.
2. Cache writes are atomic — only complete validated payloads are written to GCS.
3. Concurrent requests for the same uncached key must be deduplicated (single-flight) to avoid duplicate Gemini calls.
4. Cache metrics (hits/misses) must be emitted at request time and include the `wordId` dimension for aggregation.
5. Cost monitoring must include a monthly cost estimate and a billing alert threshold.

## Related Issues

- [**Epic 16: Word Example Simplification**](./README.md) (Epic)
- [**Implementation: Example Caching & Performance**](../../issue-implementation/epic-16-word-examples/story-16-3-example-caching-performance.md) (Implementation)
- [**Story 16.1: Single-Line Example API (BR)**](./story-16-1-single-line-example-api.md) (Sibling)
- [**Story 16.2: Example UI Component (BR)**](./story-16-2-example-ui-component.md) (Sibling)

## Implementation Status

- **Status**: Planned
- **PR**:
- **Merge Date**:
- **Key Commit**:
- **Last Update**: 2026-04-09
