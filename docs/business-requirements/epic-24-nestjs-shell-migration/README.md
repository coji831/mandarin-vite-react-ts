---
purpose: NestJS 11 shell-swap — mechanical migration running parallel to epics 25–28, completing before epic-29
status: planned
last-verified: 2026-08-17
---

# Epic 24: NestJS Shell Migration

## Epic Summary

**Goal:** Migrate the backend to a NestJS 11 shell via the **D7 shell-swap** — a mechanical shell migration running **parallel to epics 25–28 and completing before epic-29** (epics 29/30/31 land on NestJS). **D1 = NestJS 11**, owner-approved **2026-08-17**.

**Key Points:**

- D7 = shell-swap to NestJS 11 early — **not** a greenfield rebuild, **not** a full migrate
- Runs **parallel with epics 25–28**; **must complete before epic-29** (29/30/31 land on NestJS)
- Builds the calibrated substrate (AI gateway E.0–E.2, retrieval seam, tracking) as epics land on the shell
- Modulith + SSE/gateway/quota/DI all land on NestJS
- Decisive for NestJS 11: ts-fsrs FE+BE bit-identical parity via the shared TS kernel `@mandarin/srs-core`; mechanical shell migration; keeps Zod + `shared-types`
- ⚠️ The former ASP.NET Core scope is **RETIRED** — see the banner below

**Status:** Planned — D7 shell-swap track (parallel with epics 25–28, complete before epic-29)

**Last Update:** August 17, 2026

## Scope (D7 shell-swap)

_See the ratified epic plan (`docs/planning/epics-25-40.md` — D7 row + OI-1 decision record) and tech-mapping D1/D7._

- Migrate the backend onto a NestJS 11 shell early (mechanical shell-swap)
- Complete before epic-29; epics 29/30/31 land on NestJS
- Build the calibrated substrate (E.0–E.2 AI gateway, retrieval seam, tracking) as epics land
- Keep the existing content/features and tests; retrofit the substrate rather than rebuild from scratch

## User Stories

<!-- Leave empty — BR-time breakdown -->

## Acceptance Criteria

<!-- Leave empty -->

## Architecture Decisions

<!-- Leave empty -->

## Implementation Plan

<!-- Leave empty -->

## Risks & mitigations

<!-- Leave empty -->

---

## ⚠️ RETIRED — ASP.NET Core 8 migration (historical appendix, preserved for traceability)

> **RETIRED 2026-08-17** — The ASP.NET Core 8 migration below is **retired**. Its revalidation gate is unmet and **D1 (NestJS 11, owner-approved 2026-08-17) rejects .NET**. The active scope is the D7 NestJS shell-swap above. This material is preserved for traceability only; do not build from it.

### Epic 24 (historical): .NET Backend Migration (Parked)

## Epic Summary

**Goal:** [PARKED — SEE REVALIDATION GATE] Migrate all backend services from Node.js to ASP.NET Core 8, establishing a production-grade .NET architecture for long-term maintainability and performance.

**Key Points:**

- Build ASP.NET Core 8 project with clean architecture mirroring Epic 13 Node.js structure
- Migrate Progress Service first (deepest learning opportunity, heaviest business logic)
- Migrate TTS Service (Google Cloud TTS SDK in C#), Conversation Service (Gemini integration), and Auth Service progressively
- Use gradual rollout strategy (service-by-service cutover with traffic routing and rollback safety)
- Sunset Node.js backend completely after all services migrated and stabilized in production
- ⚠️ PARKED: Requires revalidation before resuming (see Revalidation Gate below)

**Status:** Parked

**Last Update:** June 14, 2026

## Revalidation Gate

This epic is parked indefinitely. Before resuming, at least 2 of the following triggers must be met:

- [ ] Node.js backend shows measurable CPU bottlenecks (>80% CPU sustained, >500ms p95 latency)
- [ ] A customer contract explicitly requires .NET backend
- [ ] Team has dedicated capacity for 8+ weeks with no higher-priority learning content to build
- [ ] Performance regression in existing Node.js services cannot be resolved without full rewrite

If fewer than 2 triggers are met, keep parked and re-evaluate quarterly.

## User Stories

## Acceptance Criteria

## Architecture Decisions

## Implementation Plan

## Risks & mitigations

## Implementation notes
