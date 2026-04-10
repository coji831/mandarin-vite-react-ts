# Deployment Guide: Example Caching (Story 16.3)

This guide documents deployment checklist and manual steps required to enable the Example Caching feature in production.

1. Secrets & HMAC Key

- **Secret Manager Setup (Ops Prerequisite):** Create secret `EXAMPLES_CACHE_HMAC_KEY` in Google Secret Manager (production) and set rotation cadence (90 days recommended).
- **Environment Variable Injection (Required Before App Start):** The app reads `EXAMPLES_CACHE_HMAC_KEY` from environment variables at startup time. Before deploying, use ops tooling (Cloud Run integration, deployment script, or K8s Secret) to inject the Secret Manager secret value into the environment variable.
- **If the environment variable is missing at startup, HmacManager will throw an error and fail initialization** (fail-fast behavior; intended for early detection).
- Optionally create `EXAMPLES_CACHE_HMAC_KEY_PREVIOUS` in Secret Manager, then inject into env for dual-key reads during key rotation.
- Grant CI/CD and the examples service's runtime identity `Secret Manager Secret Accessor` role to allow reading the secret (ops should configure this for the deployment pipeline).

2. GCS Service Account & Bucket

- Create service account: `examples-service@<project>.iam.gserviceaccount.com`.
- Grant IAM on bucket `mandarin-vocab-example-data` only the least-privilege roles:
  - `roles/storage.objectCreator` (for writes)
  - `roles/storage.objectViewer` (for reads)
- Disable public access and enable uniform bucket-level access on the bucket.

3. Redis ACL & Connection

- Use a dedicated Redis user scoped to the `examples:*` keyspace with only required commands:

```
ACL SETUSER examples_service on ><strong-password> ~examples:* +GET +SET +DEL +PEXPIRE
```

- Provide connection via `REDIS_URL` (or `REDIS_HOST`/`REDIS_PORT` + `REDIS_PASSWORD`) from Secret Manager.
- TLS: Validate TLS certificates in production. If using a managed Redis (e.g., Memorystore with TLS), configure `tls.rejectUnauthorized=true` in ioredis. This repo defers TLS verification configuration to ops.

4. Audit Logging

- Create a BigQuery dataset (assumed already present) for audit exports (example: `mandarin_example_audit`).
- Create a Logging Sink with filter `resource.type="gcs_bucket" AND logName~="cloudaudit"` exporting to the BigQuery dataset. Use `unique_writer_identity = true` and grant the sink's writer identity `roles/bigquery.dataEditor` on the dataset.

5. Deployment Steps

- Provision Terraform (see `terraform/gcs/examples-bucket.tf`) or import existing bucket.
- Ensure service account key or workload identity is configured for the backend runtime environment.
- Set environment variables (see `apps/backend/.env.example`), including `EXAMPLES_CACHE_HMAC_KEY`.
- Deploy the backend and monitor audit logs and cache metrics for expected behavior.

6. Post-Deploy Manual Checks

- Confirm bucket `mandarin-vocab-example-data` exists with 30-day lifecycle.
- Verify service account IAM bindings are limited to Creator/Viewer only.
- Verify logging sink is forwarding `cloudaudit` logs to BigQuery.
- Verify Redis connectivity and that `examples:*` keyspace is protected by ACLs and TTLs are applied.

7. TLS Verification (ops manual step)

- If TLS is expected for Redis in production, ensure the runtime environment provides CA roots and configure ioredis with `tls: { rejectUnauthorized: true }`. This repo defers hardcoded TLS configuration; validate in staging before enabling in prod.

Security notes:

- Never put `EXAMPLES_CACHE_HMAC_KEY` in source control. Use Secret Manager or k8s Secrets.
- Audit dataset access should be restricted to a small group of trusted identities.

## Follow-Up Operational Considerations (Tracked in Story Issues)

The following operational risks have been identified for future optimization (not blocking deployment):

1. **Lock TTL and Long-Running Generation:** If example generation exceeds the 5-second lock TTL, additional concurrent requests may bypass the lock (thundering herd). Monitor generation times in production; if >5s observed, consider extending TTL or adding telemetry to warn on lock expiry.

2. **GCS Write Reliability:** GCS writes assume atomicity, but network failures mid-write could leave partial objects. A post-write verification step or explicit error handling for write failures is recommended in a follow-up optimization.

3. **Real Integration Testing:** Current tests use mocked GCS/Redis; add manual or optional integration tests with a real GCS bucket and Redis instance as an ops validation step.

4. **Redis Memory & Eviction:** Ensure Redis instance has sufficient memory and a suitable eviction policy; under heavy load, locks may be evicted prematurely, leading to lock contention.
