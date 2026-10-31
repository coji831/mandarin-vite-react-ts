---
purpose: "Observability & Production Hardening"
status: ratified
last-verified: 2026-10-31
type: planning
---

# Epic 39 — Observability & Production Hardening

**Goal:** Close the P1–P6/P10 observability gaps with a lightweight spine — structured logs, health split, ErrorBoundary, metrics/alerting — so `AICallLog`/SSE are interpretable. **In-repo = the deliverable** (no satellite).

**Boundary — IN:** structured JSON logging + levels + requestId/traceId (**P1**); request/access-log middleware (**P2**); health liveness/readiness split — `/live` (no deps) vs `/ready` (deps), stop billing Gemini per probe (**P3**); frontend global ErrorBoundary + consent-gated client error capture, PII-safe, reusing requestId (**P4**); metrics surface (request rate/errors/latency, Redis hit-rate via exported `withCache` metrics, cost-per-feature from `AICallLog`) (**P5-app**); alerting (error-rate, Redis connectivity, Gemini/TTS failure, AI-cost thresholds) (**P6**); console hygiene + feature-flag rollout safety (**P10**).

**Boundary — NON-GOALS (OUT):** `usageMetadata` parsing → 29 (P7); AI-cost metrics capture → 29; funnel/activation capture (**P9/G7**) → **deferred by O3** until the costing feature (owner-decision item, not built here); full OTel/Sentry → over-investment at this scale (documented in `LIMITATIONS.md` per C5).

**Rough AC (4):**

1. BE: all logs structured JSON with level + requestId/traceId; access-log middleware records method/path/status/duration/requestId.
2. BE: `/live` (no deps) vs `/ready` (deps) split; health no longer bills Gemini per probe.
3. FE: global ErrorBoundary renders a fallback + captures consent-gated, PII-safe client errors (`window.onerror`/`unhandledrejection`) with requestId.
4. BE: metrics endpoint exposes request rate/errors/latency + Redis hit-rate + cost-per-feature (from `AICallLog`); alerting wired on error-rate + AI-cost thresholds.

**UI scope:** `UI: ErrorBoundary fallback screen + error-capture consent banner — design spec TBD`.

**Dependencies:** parallel to 25–29; **must land P1/P2 (and P7 via 29) before 29 closes**. No hard dep on feature epics.

**Close criteria:** BR/impl; Tier 1 + Tier 2 (both apps); verification artifact confirming the log/health/metrics evidence; live-ops doc updated (per production-readiness convention).

---

---

Back to the index: [Epic Plan 25-40](../epics-25-40.md) | sequencing: [Sequencing Summary](../epics-25-40.md#sequencing-summary)
