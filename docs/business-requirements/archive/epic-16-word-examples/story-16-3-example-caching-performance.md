# Story 16.3: Example Caching & Performance

## Description

**As a** backend developer,
**I want to** cache generated single-line examples in GCS, enforce a 30-day lifecycle, and use secure HMAC-based keys,
**So that** API costs and response latency remain low while preventing enumeration attacks.

## Business Value

Effective caching reduces per-request AI generation cost and improves user-perceived latency, enabling rapid display of examples at scale while controlling storage costs.

## Acceptance Criteria

- [ ] A GCS bucket stores example payloads with a lifecycle rule that removes objects after **30 days**.

  The bucket must be private with uniform bucket-level access enabled and public access blocked. Example payloads are stored only under HMAC-derived object names (no plaintext word identifiers) in a versioned namespace. The lifecycle policy deletes example objects after 30 days. The bucket and lifecycle policy are provisioned via Terraform as part of this story, and IAM bindings grant access only to the dedicated examples service account with least-privilege roles (object creator and viewer).

- [ ] Backend uses HMAC-SHA256 cache keys (supports dual-key rotation) and writes validated example payloads to GCS on generation.

  Cache keys are produced by applying HMAC-SHA256 with a server-side secret to a deterministic source string composed of the `word`, `hskLevel`, `language`, and a version token (e.g., `word|hskLevel|language|v1`). The service supports dual-key reads during secret rotation and performs writes using the active key. The secret `EXAMPLES_CACHE_HMAC_KEY` is provisioned from Secret Manager or Kubernetes Secrets and rotated on a defined cadence (recommended: 90 days). Cache writes must be atomic and only persisted after payload validation.

- [ ] Redis connections use TLS in production and enforce ACL-based access with minimal privileges for the examples service (key namespace: `examples:*`, commands: `GET`, `SET`, `DEL`, `EXPIRE`).

  Production Redis endpoints must require TLS and authenticated access. The examples service uses a dedicated Redis user scoped to the `examples:*` keyspace with only the minimal commands needed. Client connection policy should use sensible timeouts (e.g., connect timeout ~5000ms), limited retry attempts, and validate TLS certificates. Redis credentials are injected from Secret Manager or Kubernetes Secrets and must not be stored in source control.

## Business Rules

1. Cache lifecycle for examples objects is **30 days**; keys must include a `version` token for safe rollouts.
2. Cache writes are atomic — only complete validated payloads are written to GCS.
3. Concurrent requests for the same uncached key must be deduplicated (single-flight) to avoid duplicate Gemini calls.
4. HMAC-SHA256 keys are rotated on a defined cadence (e.g., 90 days) with dual-key read support during rotation.
5. Audit logging: Cloud Audit Logs for `DATA_READ` and `DATA_WRITE` on the examples bucket must be enabled and exported to a restricted logging sink with at least 90 days retention for compliance and debugging. Standard application logs MUST NOT contain example payloads or full user-provided content; structured audit fields (for example: `timestamp`, `service`, `route`, `request_id`, `cache_key`, `cache_hit`, `generation_latency_ms`, `status`, `error_code`) may be recorded in audit storage only and are subject to stricter access controls and redaction requirements.

## Related Issues

- [**Epic 16: Word Example Simplification**](./README.md) (Epic)
- [**Implementation: Example Caching & Performance**](../../issue-implementation/epic-16-word-examples/story-16-3-example-caching-performance.md) (Implementation)
- [**Story 16.1: Single-Line Example API (BR)**](./story-16-1-single-line-example-api.md) (Sibling)
- [**Story 16.2: Example UI Component (BR)**](./story-16-2-example-ui-component.md) (Sibling)

## Implementation Status

- **Status**: Completed
- **PR**: TBD
- **Merge Date**: 2026-04-09
- **Key Commit**: 3d2669e
- **Last Update**: 2026-04-09
