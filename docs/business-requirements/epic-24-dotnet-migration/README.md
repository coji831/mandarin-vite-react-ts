# Epic 24: .NET Backend Migration (Parked)

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
